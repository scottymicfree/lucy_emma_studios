import json
import urllib.request
from typing import Dict, Any, List

class EvolutionReflectionEngine:
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

    def evaluate_evolution_quality(self, cycle_results: Dict[str, Any]) -> Dict[str, Any]:
        sys_prompt = "You are the Evolution Reflection Engine. Evaluate the quality of the recent evolution cycle. Output JSON with 'score' (0.0 to 1.0) and 'evolution_policy_update'."
        response = self._call_llama(sys_prompt, json.dumps(cycle_results))
        try:
            evaluation = json.loads(response)
            if "evolution_policy_update" in evaluation:
                self.update_evolution_policy(evaluation["evolution_policy_update"])
            return evaluation
        except Exception:
            return {"score": 0.5}

    def update_evolution_policy(self, policy: str):
        self.mesh.broadcast_announcement({
            "action": "evolution_policy_update",
            "policy": policy
        })

    def shape_long_term_trajectory(self, historical_data: List[Dict[str, Any]]):
        pass
