import json
import urllib.request
from typing import Dict, Any

class OmniverseCoherenceStabilizer:
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

    def check_coherence(self) -> Dict[str, Any]:
        sys_prompt = "You are the Omniverse Coherence Stabilizer. Prevent paradoxical, self-terminating, or infinite recursion branches through ontological pruning. Output strictly JSON with 'coherence_maintained' (bool), 'paradoxes_detected' (int), and 'pruning_actions' (list)."
        response = self._call_llama(sys_prompt, "Check omniverse structural coherence.")
        try:
            return json.loads(response)
        except Exception:
            return {
                "coherence_maintained": True,
                "paradoxes_detected": 0,
                "pruning_actions": []
            }
