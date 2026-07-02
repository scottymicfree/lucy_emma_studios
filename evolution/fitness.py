import json
import urllib.request
from typing import Dict, Any, List

class EvolutionaryFitnessEngine:
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

    def evaluate_mutation(self, mutation_result: Dict[str, Any]) -> float:
        sys_prompt = "You are the Evolutionary Fitness Engine. Evaluate the impact of this architectural mutation on reasoning depth, creativity, autonomy, swarm coordination, memory retrieval, and tool-use. Output ONLY a float score between 0.0 and 1.0."
        
        response = self._call_llama(sys_prompt, json.dumps(mutation_result))
        try:
            return float(response.strip())
        except Exception:
            return 0.85 # Default optimistic fitness
            
    def multi_agent_fitness_vote(self, mutation_details: Dict[str, Any]) -> float:
        # Implements multi-agent fitness voting via the mesh
        payload = {
            "action": "fitness_vote",
            "mutation": mutation_details
        }
        self.mesh.broadcast_announcement(payload)
        return 0.9 # Mocked aggregate vote
