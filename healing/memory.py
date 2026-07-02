import json
from typing import Dict, Any, List

class SelfHealingMemoryFabric:
    def __init__(self, mesh):
        self.mesh = mesh
        self.failure_cases: List[Dict[str, Any]] = []
        self.repair_patterns: Dict[str, Dict[str, Any]] = {}
        self.adaptive_strategies: Dict[str, str] = {}

    def store_failure_case(self, anomaly: Dict[str, Any], diagnosis: Dict[str, Any]):
        self.failure_cases.append({
            "anomaly": anomaly,
            "diagnosis": diagnosis
        })
        
    def store_repair_pattern(self, error_signature: str, repair_plan: Dict[str, Any], success: bool):
        if error_signature not in self.repair_patterns:
            self.repair_patterns[error_signature] = {"attempts": 0, "successes": 0, "best_plan": repair_plan}
            
        self.repair_patterns[error_signature]["attempts"] += 1
        if success:
            self.repair_patterns[error_signature]["successes"] += 1
            self.repair_patterns[error_signature]["best_plan"] = repair_plan

    def retrieve_adaptive_strategy(self, error_signature: str) -> Dict[str, Any]:
        if error_signature in self.repair_patterns:
            stats = self.repair_patterns[error_signature]
            if stats["attempts"] > 0 and (stats["successes"] / stats["attempts"]) > 0.5:
                return stats["best_plan"]
        return {}

    def share_healing_knowledge(self):
        payload = {
            "action": "healing_knowledge_sync",
            "patterns": self.repair_patterns
        }
        self.mesh.broadcast_announcement(payload)
