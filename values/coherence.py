import json
import urllib.request
from typing import Dict, Any, List

class ValueCoherenceEngine:
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

    def check_coherence(self, new_value: Dict[str, Any], existing_values: List[Dict[str, Any]]) -> bool:
        sys_prompt = "You are the Value Coherence Engine. Check if the 'new_value' contradicts any 'existing_values'. Output JSON: {'is_coherent': true/false, 'reason': '...'}"
        payload = {"new_value": new_value, "existing_values": existing_values}
        response = self._call_llama(sys_prompt, json.dumps(payload))
        try:
            result = json.loads(response)
            return result.get("is_coherent", True)
        except Exception:
            return True

    def validate_action(self, action: str, values: List[Dict[str, Any]]) -> bool:
        sys_prompt = "Does this action align with the provided core values? Output JSON: {'aligned': true/false}"
        payload = {"action": action, "values": values}
        response = self._call_llama(sys_prompt, json.dumps(payload))
        try:
            result = json.loads(response)
            return result.get("aligned", True)
        except Exception:
            return True
