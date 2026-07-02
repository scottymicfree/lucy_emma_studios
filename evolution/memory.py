import json
from typing import Dict, Any, List

class EvolutionMemoryFabric:
    def __init__(self, mesh):
        self.mesh = mesh
        self.evolutionary_attempts: List[Dict[str, Any]] = []
        self.pattern_memory: Dict[str, List[Any]] = {}

    def store_attempt(self, strategy: Dict[str, Any], success: bool, fitness_score: float):
        attempt = {
            "strategy": strategy,
            "success": success,
            "fitness": fitness_score
        }
        self.evolutionary_attempts.append(attempt)
        
        subsystem = strategy.get("target_subsystem", "unknown")
        if subsystem not in self.pattern_memory:
            self.pattern_memory[subsystem] = []
        self.pattern_memory[subsystem].append(attempt)
        
        self.share_evolution_knowledge(attempt)

    def share_evolution_knowledge(self, attempt: Dict[str, Any]):
        self.mesh.broadcast_announcement({
            "action": "evolution_knowledge_sync",
            "attempt": attempt
        })
