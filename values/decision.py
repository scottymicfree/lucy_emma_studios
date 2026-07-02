import json
import urllib.request
from typing import Dict, Any, List

class ValueDrivenDecisionEngine:
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

    def evaluate_options(self, options: List[str], active_values: List[Dict[str, Any]]) -> str:
        sys_prompt = "You are the Value-Driven Decision Engine. Evaluate the options based on the provided values and select the most aligned one. Output the exact option string."
        payload = {"options": options, "values": active_values}
        response = self._call_llama(sys_prompt, json.dumps(payload)).strip()
        
        if response in options:
            return response
        return options[0] if options else ""

    def filter_goals(self, goals: List[Dict[str, Any]], active_values: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        aligned_goals = []
        for goal in goals:
            if self.coherence.validate_action(json.dumps(goal), active_values):
                aligned_goals.append(goal)
        return aligned_goals
