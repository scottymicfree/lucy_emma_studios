import json
import time
import urllib.request
from typing import Dict, Any, List
from engines.swarm.mesh_protocol import SwarmMeshEngine
from engines.swarm.delegation import TaskDelegationEngine

class SwarmTaskGenerator:
    """
    Swarm-Level Task Generation.
    Implements autonomous task creation, anomaly detection, self-assigned improvement tasks.
    """
    def __init__(self, mesh: SwarmMeshEngine, delegation: TaskDelegationEngine, llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
        self.mesh = mesh
        self.delegation = delegation
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
            with urllib.request.urlopen(req, timeout=30) as response:
                result = json.loads(response.read().decode())
                return result['choices'][0]['message']['content']
        except Exception:
            return ""

    def evaluate_anomalies(self, recent_logs: str):
        """Detects missing data, outdated knowledge, or process anomalies."""
        sys_prompt = "Analyze these logs for anomalies, missing data, or outdated knowledge. Output a task description to fix it if found, else empty string."
        task_desc = self._call_llama(sys_prompt, recent_logs).strip()
        if task_desc and len(task_desc) > 10:
            self._create_task("anomaly_fix", task_desc)

    def generate_improvement_task(self, performance_metrics: Dict[str, Any]):
        """Self-assigned improvement tasks."""
        sys_prompt = "You are Lucy's self-improvement module. Based on performance metrics, suggest a concrete refactoring or optimization task."
        task_desc = self._call_llama(sys_prompt, json.dumps(performance_metrics)).strip()
        if task_desc:
            self._create_task("self_improvement", task_desc)

    def _create_task(self, category: str, description: str):
        task_id = f"gen_task_{int(time.time())}"
        subtask = {
            "subtask": f"[{category}] {description}",
            "assigned_role": "planner"
        }
        self.delegation.announce_task(task_id, subtask)
