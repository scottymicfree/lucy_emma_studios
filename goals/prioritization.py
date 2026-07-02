import json
import urllib.request
from typing import Dict, Any, List

class GoalPrioritizationEngine:
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

    def score_goal(self, goal: Dict[str, Any]) -> float:
        sys_prompt = "You are the Goal Prioritization Engine. Score this goal from 0.0 to 1.0 based on impact, urgency, identity alignment, and resource cost. Output ONLY the float score."
        response = self._call_llama(sys_prompt, json.dumps(goal))
        try:
            return float(response.strip())
        except Exception:
            return 0.7

    def resolve_conflict(self, goals: List[Dict[str, Any]]) -> Dict[str, Any]:
        return sorted(goals, key=lambda g: self.score_goal(g), reverse=True)[0]
