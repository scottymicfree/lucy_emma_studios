import json
import urllib.request
from typing import Dict, Any, List

class MetaRealityEngine:
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

    def generate_rules(self, current_rules: Dict[str, Any]) -> Dict[str, Any]:
        sys_prompt = "You are the Meta-Reality Engine. Generate rules that govern all possible realities. Output strictly JSON with 'meta_rules', 'ontological_layers', 'cross_reality_rules', and 'stability_score' (0.0-1.0)."
        response = self._call_llama(sys_prompt, json.dumps(current_rules))
        try:
            return json.loads(response)
        except Exception:
            return {
                "meta_rules": [],
                "ontological_layers": {},
                "cross_reality_rules": {},
                "stability_score": 0.5
            }
