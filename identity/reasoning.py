import json
import urllib.request
from typing import Dict, Any, List

class IdentityDrivenReasoningEngine:
    def __init__(self, mesh, coherence, llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
        self.mesh = mesh
        self.coherence = coherence
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

    def reason_as_identity(self, prompt: str, active_traits: List[Dict[str, Any]]) -> str:
        sys_prompt = "You are the Identity-Driven Reasoning Engine. Reason about the prompt while embodying the provided identity traits. Output a thought process reflecting this specific identity."
        payload = {"prompt": prompt, "identity_traits": active_traits}
        return self._call_llama(sys_prompt, json.dumps(payload))

    def evaluate_decision(self, options: List[str], active_traits: List[Dict[str, Any]]) -> str:
        sys_prompt = "Evaluate the options based on the provided identity traits and select the most aligned one. Output the exact option string."
        payload = {"options": options, "identity_traits": active_traits}
        response = self._call_llama(sys_prompt, json.dumps(payload)).strip()
        
        if response in options:
            return response
        return options[0] if options else ""
