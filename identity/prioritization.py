import json
import urllib.request
from typing import Dict, Any, List

class IdentityPrioritizationEngine:
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

    def score_trait(self, trait: Dict[str, Any]) -> float:
        sys_prompt = "You are the Identity Prioritization Engine. Score this identity trait from 0.0 to 1.0 based on core importance, stability, and alignment with the overarching swarm goals. Output ONLY the float score."
        response = self._call_llama(sys_prompt, json.dumps(trait))
        try:
            return float(response.strip())
        except Exception:
            return 0.75

    def resolve_conflict(self, traits: List[Dict[str, Any]]) -> Dict[str, Any]:
        return sorted(traits, key=lambda t: self.score_trait(t), reverse=True)[0]
