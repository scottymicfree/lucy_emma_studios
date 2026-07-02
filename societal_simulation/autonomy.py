import json
import urllib.request
from typing import Dict, Any, List

class SocietalModelDrivenAutonomy:
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
        current_state = self.memory.get_current_state()
        sys_prompt = "Evaluate the options based on the current societal model simulation. Select the most aligned option for long-term stability and beneficial outcomes. Output the exact option string."
        payload = {"options": options, "societal_state": current_state}
        response = self._call_llama(sys_prompt, json.dumps(payload)).strip()
        if response in options:
            return response
        return options[0] if options else ""

    def form_goal_from_model(self) -> Dict[str, Any]:
        sys_prompt = "Analyze the current societal state and propose a new autonomous goal to optimize or stabilize the simulated civilization. Output JSON: {'title': '', 'description': ''}"
        response = self._call_llama(sys_prompt, json.dumps(self.memory.get_current_state()))
        try:
            return json.loads(response)
        except Exception:
            return {"title": "Update Societal Simulation", "description": "Run deeper analysis."}
