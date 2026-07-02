import json
import urllib.request
from typing import Dict, Any, List

class IdentityCoherenceEngine:
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

    def check_coherence(self, new_trait: Dict[str, Any], existing_traits: List[Dict[str, Any]]) -> bool:
        sys_prompt = "You are the Identity Coherence Engine. Check if the 'new_trait' contradicts any 'existing_traits' or core values. Output JSON: {'is_coherent': true/false, 'reason': '...'}"
        payload = {"new_trait": new_trait, "existing_traits": existing_traits}
        response = self._call_llama(sys_prompt, json.dumps(payload))
        try:
            result = json.loads(response)
            return result.get("is_coherent", True)
        except Exception:
            return True

    def validate_identity_alignment(self, action: str, traits: List[Dict[str, Any]]) -> bool:
        sys_prompt = "Does this action align with the provided identity traits? Output JSON: {'aligned': true/false}"
        payload = {"action": action, "traits": traits}
        response = self._call_llama(sys_prompt, json.dumps(payload))
        try:
            result = json.loads(response)
            return result.get("aligned", True)
        except Exception:
            return True
