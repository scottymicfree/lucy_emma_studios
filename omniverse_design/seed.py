import json
import urllib.request
from typing import Dict, Any, List

class RealitySeedDesigner:
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

    def design_seed(self, meta_laws: Dict[str, Any]) -> Dict[str, Any]:
        sys_prompt = "You are the Reality Seed Designer. Create new forms of reality. Output strictly JSON with 'seed_template', 'divergent_ontology', 'meta_initial_conditions', and 'viability_score'."
        response = self._call_llama(sys_prompt, json.dumps(meta_laws))
        try:
            return json.loads(response)
        except Exception:
            return {
                "seed_template": "omni-exotic",
                "divergent_ontology": {},
                "meta_initial_conditions": {},
                "viability_score": 0.5
            }
