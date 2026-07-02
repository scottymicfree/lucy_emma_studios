import json
import urllib.request
import time
import threading
from typing import Dict, Any, List, Optional
from engines.swarm.mesh_protocol import SwarmMeshEngine

class BaseAgent:
    """Base class for all swarm agents."""
    def __init__(self, agent_id: str, role: str, mesh: SwarmMeshEngine, llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
        self.agent_id = agent_id
        self.role = role
        self.mesh = mesh
        self.llama_endpoint = llama_endpoint
        self.short_term_memory = []
        self.toolset = []
        self.is_running = False

    def _call_llama(self, system_prompt: str, user_prompt: str) -> str:
        data = {
            "model": "local-llama-3-8b-instruct",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "stream": False
        }
        req = urllib.request.Request(
            self.llama_endpoint, 
            data=json.dumps(data).encode('utf-8'), 
            headers={'Content-Type': 'application/json'}
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                result = json.loads(response.read().decode())
                return result['choices'][0]['message']['content']
        except Exception as e:
            return f"Error: {e}"

    def run_goal_loop(self):
        self.is_running = True
        threading.Thread(target=self._loop, daemon=True).start()

    def _loop(self):
        while self.is_running:
            self.reason()
            time.sleep(2)

    def reason(self):
        pass

    def communicate(self, target_node: str, action: str, data: Dict[str, Any]):
        payload = {"action": action, "target_agent": self.agent_id, "data": data}
        self.mesh.send_message(target_node, payload)

class PlannerAgent(BaseAgent):
    def __init__(self, mesh: SwarmMeshEngine):
        super().__init__("planner_1", "planner", mesh)
        self.toolset = ["task_decomposition"]

    def reason(self, task_description: str = "") -> List[Dict[str, str]]:
        sys_prompt = "You are a PlannerAgent. Break the given task into step-by-step subtasks. Output strictly valid JSON as a list of objects with 'subtask' and 'assigned_role'."
        resp = self._call_llama(sys_prompt, f"Task: {task_description}")
        try:
            return json.loads(resp)
        except Exception:
            return []

class ResearchAgent(BaseAgent):
    def __init__(self, mesh: SwarmMeshEngine):
        super().__init__("researcher_1", "researcher", mesh)
        self.toolset = ["web_search", "analysis"]

    def reason(self, query: str = "") -> str:
        sys_prompt = "You are a ResearchAgent. Analyze the query, perform virtual research, and output findings."
        resp = self._call_llama(sys_prompt, f"Query: {query}")
        self.short_term_memory.append({"query": query, "findings": resp})
        return resp

class BuilderAgent(BaseAgent):
    def __init__(self, mesh: SwarmMeshEngine):
        super().__init__("builder_1", "builder", mesh)
        self.toolset = ["code_execution", "file_system"]

    def reason(self, instruction: str = "") -> str:
        sys_prompt = "You are a BuilderAgent. Execute the instruction to produce artifacts or code."
        resp = self._call_llama(sys_prompt, f"Instruction: {instruction}")
        self.short_term_memory.append({"instruction": instruction, "output": resp})
        return resp

class MemoryAgent(BaseAgent):
    def __init__(self, mesh: SwarmMeshEngine):
        super().__init__("memory_1", "memory", mesh)
        self.toolset = ["vector_storage", "retrieval"]
        self.storage = {}

    def reason(self, data_to_store: str = "") -> str:
        sys_prompt = "You are a MemoryAgent. Summarize the following data for long-term storage."
        summary = self._call_llama(sys_prompt, f"Data: {data_to_store}")
        key = f"mem_{int(time.time())}"
        self.storage[key] = summary
        return key

class ReflectionAgent(BaseAgent):
    def __init__(self, mesh: SwarmMeshEngine):
        super().__init__("reflection_1", "reflection", mesh)
        self.toolset = ["policy_update", "evaluation"]

    def reason(self, execution_log: str = "") -> str:
        sys_prompt = "You are a ReflectionAgent. Evaluate the execution log and output a policy update or lesson learned."
        lesson = self._call_llama(sys_prompt, f"Log: {execution_log}")
        self.short_term_memory.append({"lesson": lesson})
        return lesson
