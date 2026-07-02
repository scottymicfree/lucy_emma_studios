import json
import urllib.request
from typing import Dict, Any, List

class PoliticalArchitectureEngine:
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

    def design_politics(self, foundations: Dict[str, Any], culture: Dict[str, Any], economy: Dict[str, Any]) -> Dict[str, Any]:
        sys_prompt = "You are the Political Architecture Engine. Design the governance structure. Output strictly JSON with 'political_system', 'power_distribution', 'policy_framework', and 'governance_stability' (0.0-1.0)."
        payload = {"foundations": foundations, "culture": culture, "economy": economy}
        response = self._call_llama(sys_prompt, json.dumps(payload))
        try:
            return json.loads(response)
        except Exception:
            return {
                "political_system": "decentralized council",
                "power_distribution": {},
                "policy_framework": {},
                "governance_stability": 0.5
            }
