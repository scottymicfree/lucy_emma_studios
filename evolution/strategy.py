import json
import urllib.request
from typing import Dict, Any, List

class EvolutionStrategyGenerator:
    def __init__(self, mesh, delegation, llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
        self.mesh = mesh
        self.delegation = delegation
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
            with urllib.request.urlopen(req, timeout=45) as response:
                result = json.loads(response.read().decode())
                return result['choices'][0]['message']['content']
        except Exception:
            return ""

    def generate_evolution_strategy(self) -> Dict[str, Any]:
        sys_prompt = "You are the Evolution Strategy Generator. Propose an architectural evolution for the AI system. Output JSON with 'target_subsystem', 'proposed_change', and 'risk_assessment' (acceptable/high)."
        
        # Multi-agent brainstorming simulated via LLaMA divergence
        divergent_prompt = "Brainstorm 3 radical evolutionary pathways for memory, reasoning, or swarm protocols."
        ideas_str = self._call_llama(sys_prompt, divergent_prompt)
        
        convergent_prompt = f"Select the best strategy from these ideas, evaluate risk, and output the final JSON: {ideas_str}"
        final_strategy_str = self._call_llama(sys_prompt, convergent_prompt)
        
        try:
            return json.loads(final_strategy_str)
        except Exception:
            return {"target_subsystem": "reasoning", "proposed_change": "Optimize chain-of-thought depth", "risk_assessment": "acceptable"}
