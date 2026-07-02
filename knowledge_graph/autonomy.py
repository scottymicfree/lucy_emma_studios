import json
import urllib.request
from typing import Dict, Any, List

class GraphDrivenAutonomy:
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

    def guide_goal_formation(self) -> Dict[str, Any]:
        sys_prompt = "Analyze the knowledge graph edges and propose a new autonomous goal based on missing connections or discovered patterns. Output JSON: {'title': '', 'description': ''}"
        sample = self.memory.edges[-20:] if self.memory.edges else []
        response = self._call_llama(sys_prompt, json.dumps(sample))
        try:
            return json.loads(response)
        except Exception:
            return {"title": "Graph Expansion", "description": "Gather more nodes."}

    def guide_decision_making(self, options: List[str]) -> str:
        sys_prompt = "Select the best option based on the structure of the provided knowledge graph sample. Output the exact option string."
        payload = {"options": options, "graph": self.memory.edges[-10:]}
        response = self._call_llama(sys_prompt, json.dumps(payload))
        if response.strip() in options:
            return response.strip()
        return options[0] if options else ""
