import json
import urllib.request
from typing import Dict, Any, List

class PurposeCoherenceEngine:
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

    def ensure_coherence(self, purposes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        sys_prompt = "You are the Purpose Coherence Engine. Filter out contradictions and ensure identity-value alignment. Return strictly a JSON list of the coherent purpose objects, adding a 'coherence_status' field."
        response = self._call_llama(sys_prompt, json.dumps(purposes))
        try:
            coherent = json.loads(response)
            if isinstance(coherent, list):
                return coherent
            return purposes
        except Exception:
            return purposes
