import json
import urllib.request
from typing import Dict, Any, List

class StateRepresentationEngine:
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

    def encode_entity_state(self, entity_data: str) -> Dict[str, Any]:
        sys_prompt = "Encode the entity state into a structured JSON representation with 'id', 'type', 'properties', and 'active_processes'."
        response = self._call_llama(sys_prompt, entity_data)
        try:
            return json.loads(response)
        except Exception:
            return {"id": "unknown", "type": "entity", "properties": {}, "active_processes": []}

    def track_state_transition(self, old_state: Dict[str, Any], new_state: Dict[str, Any]) -> Dict[str, Any]:
        sys_prompt = "Analyze the transition between old_state and new_state. Output JSON with 'changes' and 'transition_type'."
        payload = {"old_state": old_state, "new_state": new_state}
        response = self._call_llama(sys_prompt, json.dumps(payload))
        try:
            return json.loads(response)
        except Exception:
            return {"changes": [], "transition_type": "unknown"}
