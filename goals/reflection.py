import json
import urllib.request
from typing import Dict, Any, List

class GoalReflectionEngine:
    def __init__(self, mesh, memory, llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
        self.mesh = mesh
        self.memory = memory
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

    def reflect_on_goal(self, goal_info: Dict[str, Any]):
        sys_prompt = "You are the Goal Reflection Engine. Evaluate this completed goal. Output JSON with 'success_score' (0.0-1.0) and 'policy_update'."
        response = self._call_llama(sys_prompt, json.dumps(goal_info))
        try:
            reflection = json.loads(response)
            self.memory.store_goal_outcome(goal_info, reflection)
            if "policy_update" in reflection:
                self.mesh.broadcast_announcement({
                    "action": "goal_policy_update",
                    "policy": reflection["policy_update"]
                })
        except Exception:
            pass
