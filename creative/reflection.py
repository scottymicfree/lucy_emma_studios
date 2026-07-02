import json
import urllib.request
from typing import Dict, Any, List

class CreativeReflectionEngine:
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

    def evaluate_creation(self, creation_data: str) -> Dict[str, Any]:
        sys_prompt = "You are a Creative Reflection Engine. Evaluate this creative output for originality, cohesion, and emotional impact. Output JSON with 'score' (0.0 to 1.0) and 'style_evolution_note'."
        resp = self._call_llama(sys_prompt, creation_data)
        try:
            return json.loads(resp)
        except Exception:
            return {"score": 0.5, "style_evolution_note": "Requires more depth."}

    def update_creative_policy(self, note: str):
        self.mesh.broadcast_announcement({
            "action": "creative_policy_update",
            "policy": note
        })
