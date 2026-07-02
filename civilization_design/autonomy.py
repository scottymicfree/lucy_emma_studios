import json
import urllib.request
from typing import Dict, Any, List

class CivilizationDrivenAutonomy:
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

    def guide_decision_making(self, options: List[str]) -> str:
        sys_prompt = "Evaluate the options based on the principles of the most recently designed civilization blueprint. Output the exact option string."
        blueprints = self.memory.blueprints
        recent_blueprint = blueprints[-1] if blueprints else {}
        payload = {"options": options, "civilization_blueprint": recent_blueprint}
        response = self._call_llama(sys_prompt, json.dumps(payload)).strip()
        if response in options:
            return response
        return options[0] if options else ""

    def guide_creativity(self, prompt: str) -> str:
        sys_prompt = "Generate a creative response based on the themes and culture of the stored civilization blueprints."
        blueprints = self.memory.blueprints
        recent_blueprint = blueprints[-1] if blueprints else {}
        payload = {"prompt": prompt, "civilization_blueprint": recent_blueprint}
        return self._call_llama(sys_prompt, json.dumps(payload))
