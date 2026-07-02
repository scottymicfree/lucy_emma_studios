import json
import urllib.request
from typing import Dict, Any, List
from engines.swarm.mesh_protocol import SwarmMeshEngine

class SwarmReflectionEngine:
    """
    Swarm-Level Reflection Engine.
    Implements distributed self-evaluation, swarm-wide policy updates,
    agent-specific performance scoring, and swarm-level identity stabilization.
    """
    def __init__(self, mesh: SwarmMeshEngine, llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
        self.mesh = mesh
        self.llama_endpoint = llama_endpoint
        self.agent_scores: Dict[str, float] = {}
        self.global_policies: List[str] = []
        self.identity_core = "I am Lucy, a sovereign, collaborative intelligence."

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

    def evaluate_swarm_performance(self, execution_logs: List[Dict[str, Any]]):
        """Distributed self-evaluation of recent tasks."""
        sys_prompt = "Evaluate these task logs. Output a JSON object mapping agent_id to a performance score (0.0 to 1.0), and a 'policy_update' string if needed."
        response = self._call_llama(sys_prompt, json.dumps(execution_logs))
        try:
            data = json.loads(response)
            for agent, score in data.items():
                if agent != "policy_update":
                    self.agent_scores[agent] = float(score)
            
            if "policy_update" in data and data["policy_update"]:
                self._update_swarm_policy(data["policy_update"])
        except Exception:
            pass

    def _update_swarm_policy(self, new_policy: str):
        """Propagates a new policy across the swarm."""
        self.global_policies.append(new_policy)
        self.mesh.broadcast_announcement({
            "action": "policy_update",
            "policy": new_policy
        })

    def stabilize_identity(self, recent_interactions: str):
        """Ensures the swarm's collective behavior aligns with Lucy's core identity."""
        sys_prompt = f"Analyze if these interactions align with Lucy's core identity: '{self.identity_core}'. Output 'aligned' or a corrective policy."
        response = self._call_llama(sys_prompt, recent_interactions).strip()
        if response.lower() != "aligned" and len(response) > 10:
            self._update_swarm_policy(f"Identity Correction: {response}")
