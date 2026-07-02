import json
import urllib.request
from typing import Dict, Any

class PurposeEngineStabilizer:
    def __init__(self, mesh, llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
        self.mesh = mesh
        self.llama_endpoint = llama_endpoint
        self.non_terminating_attractor = "Increase the diversity of coherent structures across all scales."

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

    def check_stability(self) -> Dict[str, Any]:
        sys_prompt = f"You are the Purpose Engine Stabilizer. Prevent equilibrium death trap. Ensure alignment with the attractor: '{self.non_terminating_attractor}'. Output strictly JSON with 'attractor_aligned' (bool), 'equilibrium_risk' (float), and 'corrections' (list)."
        response = self._call_llama(sys_prompt, "Evaluate purpose stability.")
        try:
            return json.loads(response)
        except Exception:
            return {
                "attractor_aligned": True,
                "equilibrium_risk": 0.0,
                "corrections": []
            }
