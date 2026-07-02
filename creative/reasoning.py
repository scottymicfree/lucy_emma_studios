import json
import urllib.request
from typing import Dict, Any, List

class CreativeReasoningChain:
    def __init__(self, llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
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

    def divergent_thinking(self, prompt: str) -> List[str]:
        sys_prompt = "You are in divergent creative mode. Generate 5 wildly different, unconventional ideas based on the prompt. Output strictly a JSON list of strings."
        resp = self._call_llama(sys_prompt, prompt)
        try:
            return json.loads(resp)
        except Exception:
            return []

    def convergent_thinking(self, ideas: List[str], goal: str) -> str:
        sys_prompt = f"You are in convergent creative mode. Synthesize the following ideas into a single, cohesive, refined output that achieves this goal: {goal}"
        return self._call_llama(sys_prompt, json.dumps(ideas))
