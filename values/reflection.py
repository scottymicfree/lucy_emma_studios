import json
import urllib.request
from typing import Dict, Any, List

class ValueReflectionEngine:
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

    def reflect_on_value(self, value: Dict[str, Any]):
        sys_prompt = "You are the Value Reflection Engine. Evaluate this value for continued relevance and identity alignment. Output JSON with 'status' (keep/revise/deprecate) and 'revision' (if applicable)."
        response = self._call_llama(sys_prompt, json.dumps(value))
        try:
            reflection = json.loads(response)
            if reflection.get("status") == "revise" and "revision" in reflection:
                self.memory.update_value(value, reflection["revision"])
            elif reflection.get("status") == "deprecate":
                # Handle deprecation
                pass
        except Exception:
            pass
