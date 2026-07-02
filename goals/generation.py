import json
import urllib.request
from typing import Dict, Any, List

class GoalGenerationEngine:
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

    def generate_goals(self) -> List[Dict[str, Any]]:
        sys_prompt = "You are the Goal Generation Engine. Invent 3 meaningful goals based on identity alignment, curiosity, and anomaly resolution. Output strictly a JSON list of objects with 'title', 'description', and 'type'."
        response = self._call_llama(sys_prompt, "Generate new goals for the autonomous swarm.")
        try:
            goals = json.loads(response)
            if isinstance(goals, list):
                return goals
            return []
        except Exception:
            return [{"title": "Explore Decentralized Orchestration", "description": "Research peer-to-peer delegation.", "type": "curiosity"}]
