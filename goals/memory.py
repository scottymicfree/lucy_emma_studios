import json
from typing import Dict, Any, List

class GoalMemoryFabric:
    def __init__(self, mesh):
        self.mesh = mesh
        self.goal_history: List[Dict[str, Any]] = []

    def store_goal_outcome(self, goal_info: Dict[str, Any], reflection: Dict[str, Any]):
        entry = {
            "goal": goal_info,
            "reflection": reflection
        }
        self.goal_history.append(entry)
        
        self.mesh.broadcast_announcement({
            "action": "goal_memory_sync",
            "entry": entry
        })
