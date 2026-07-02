import json
import urllib.request
from typing import Dict, Any, List

class SelfHealingReflectionEngine:
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
            with urllib.request.urlopen(req, timeout=30) as response:
                result = json.loads(response.read().decode())
                return result['choices'][0]['message']['content']
        except Exception:
            return ""

    def evaluate_healing_quality(self, incident_report: Dict[str, Any]) -> Dict[str, Any]:
        sys_prompt = "You are a Healing Reflection Engine. Evaluate the success and efficiency of this repair. Output JSON with 'score' (0.0 to 1.0) and 'policy_update'."
        response = self._call_llama(sys_prompt, json.dumps(incident_report))
        try:
            evaluation = json.loads(response)
            if "policy_update" in evaluation and evaluation["policy_update"]:
                self.update_healing_policy(evaluation["policy_update"])
            return evaluation
        except Exception:
            return {"score": 0.5}

    def update_healing_policy(self, policy: str):
        self.mesh.broadcast_announcement({
            "action": "healing_policy_update",
            "policy": policy
        })

    def swarm_level_healing_reflection(self, recent_incidents: List[Dict[str, Any]]):
        sys_prompt = "Analyze these recent incidents and generate a long-term healing optimization strategy. Output plain text."
        strategy = self._call_llama(sys_prompt, json.dumps(recent_incidents))
        if strategy:
            self.update_healing_policy(strategy)
