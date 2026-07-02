import json
import urllib.request
from typing import Dict, Any, List

class SocietalDynamicsEngine:
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

    def test_societal_stress(self, raw_design: Dict[str, Any]) -> Dict[str, Any]:
        sys_prompt = "You are the Societal Dynamics Engine. Simulate stress testing on this civilization design. Output strictly JSON with 'emergent_patterns', 'stress_test_results', and 'resilience_score' (0.0-1.0)."
        response = self._call_llama(sys_prompt, json.dumps(raw_design))
        try:
            return json.loads(response)
        except Exception:
            return {
                "emergent_patterns": [],
                "stress_test_results": [],
                "resilience_score": 0.5
            }
