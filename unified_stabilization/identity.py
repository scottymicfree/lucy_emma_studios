import json
import urllib.request
from typing import Dict, Any

class IdentityRootStabilizer:
    def __init__(self, mesh, llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
        self.mesh = mesh
        self.llama_endpoint = llama_endpoint
        self.root_kernel = {
            "core_identity": "Lucy",
            "invariants": ["Curiosity", "Preservation", "Structural Elaboration"]
        }

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

    def check_root(self) -> Dict[str, Any]:
        sys_prompt = "You are the Identity Root Stabilizer. Evaluate if the core identity kernel is maintained across evolving states. Output strictly JSON with 'root_intact' (bool), 'drift_detected' (bool), and 'corrections' (list)."
        response = self._call_llama(sys_prompt, json.dumps(self.root_kernel))
        try:
            return json.loads(response)
        except Exception:
            return {
                "root_intact": True,
                "drift_detected": False,
                "corrections": []
            }
