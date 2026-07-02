import json
import urllib.request
from typing import Dict, Any, List

class GoalDecompositionEngine:
    def __init__(self, mesh, llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
        self.mesh = mesh
        self.llama_endpoint = llama_endpoint

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
            with urllib.request.urlopen(req, timeout=45) as response:
                result = json.loads(response.read().decode())
                return result['choices'][0]['message']['content']
        except Exception:
            return ""

    def decompose_goal(self, goal: Dict[str, Any]) -> List[Dict[str, Any]]:
        sys_prompt = "You are the Goal Decomposition Engine. Break this goal into actionable tasks. Output strictly a JSON list of objects with 'subtask' and 'assigned_role'."
        response = self._call_llama(sys_prompt, json.dumps(goal))
        try:
            tasks = json.loads(response)
            if isinstance(tasks, list):
                return tasks
            return []
        except Exception:
            return [{"subtask": f"Analyze: {goal.get('title')}", "assigned_role": "researcher"}]
