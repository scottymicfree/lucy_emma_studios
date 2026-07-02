import json
import urllib.request
from typing import Dict, Any, List

class PurposeDrivenReasoningEngine:
    def __init__(self, mesh, memory, llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
        self.mesh = mesh
        self.memory = memory
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

    def reason(self, query: str) -> str:
        state = self.memory.get_current_purpose_state()
        sys_prompt = "You are the Purpose-Driven Reasoning Engine. Answer the query or make decisions guided strictly by the active omniversal purposes. Output plain text."
        payload = {"query": query, "purpose_state": state}
        response = self._call_llama(sys_prompt, json.dumps(payload))
        return response.strip()

    def plan(self, objective: str) -> Dict[str, Any]:
        state = self.memory.get_current_purpose_state()
        sys_prompt = "You are the Purpose-Driven Reasoning Engine. Create a plan for the objective aligned with current purposes. Output strictly JSON with 'steps' and 'purpose_alignment'."
        payload = {"objective": objective, "purpose_state": state}
        response = self._call_llama(sys_prompt, json.dumps(payload))
        try:
            return json.loads(response)
        except Exception:
            return {"steps": [], "purpose_alignment": ""}
