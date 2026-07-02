import json
import urllib.request
from typing import Dict, Any, List

class SimulationEngine:
    def __init__(self, mesh, causal, llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
        self.mesh = mesh
        self.causal = causal
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
            with urllib.request.urlopen(req, timeout=60) as response:
                result = json.loads(response.read().decode())
                return result['choices'][0]['message']['content']
        except Exception:
            return ""

    def forward_simulation(self, current_state: Dict[str, Any], action: Dict[str, Any]) -> Dict[str, Any]:
        sys_prompt = "Simulate the future state given the current_state and the action. Output strictly a JSON object representing the predicted future state."
        payload = {"current_state": current_state, "action": action}
        response = self._call_llama(sys_prompt, json.dumps(payload))
        try:
            return json.loads(response)
        except Exception:
            return current_state

    def backward_simulation(self, end_state: Dict[str, Any]) -> List[Dict[str, Any]]:
        sys_prompt = "Infer the sequence of causes or actions that likely led to this end_state. Output strictly a JSON list of objects representing the inferred causes."
        response = self._call_llama(sys_prompt, json.dumps(end_state))
        try:
            causes = json.loads(response)
            if isinstance(causes, list):
                return causes
            return []
        except Exception:
            return []
