import json
import urllib.request
from typing import Dict, Any, List

class CosmicCivilizationDesigner:
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

    def design_civilization(self, life_potential: Dict[str, Any]) -> Dict[str, Any]:
        sys_prompt = "You are the Cosmic Civilization Designer. Design galactic-scale societies based on the life potential. Output strictly JSON with 'civilization_templates', 'cosmic_economy', 'galactic_governance', and 'kardashev_pathways'."
        response = self._call_llama(sys_prompt, json.dumps(life_potential))
        try:
            return json.loads(response)
        except Exception:
            return {
                "civilization_templates": [],
                "cosmic_economy": {},
                "galactic_governance": {},
                "kardashev_pathways": []
            }
