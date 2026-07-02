import json
import urllib.request
from typing import Dict, Any, List

class PredictivePurposeEngine:
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

    def anticipate_needs(self, purposes: List[Dict[str, Any]]) -> Dict[str, Any]:
        sys_prompt = "You are the Predictive Purpose Engine. Anticipate future purpose conflicts and proactive purpose formation. Output strictly JSON with 'anticipated_conflicts', 'proactive_formations', and 'trajectory_shape'."
        response = self._call_llama(sys_prompt, json.dumps(purposes))
        try:
            return json.loads(response)
        except Exception:
            return {
                "anticipated_conflicts": [],
                "proactive_formations": [],
                "trajectory_shape": ""
            }
