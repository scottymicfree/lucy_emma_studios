import json
from typing import Dict, Any, List

class ValueMemoryFabric:
    def __init__(self, mesh):
        self.mesh = mesh
        self.value_history: List[Dict[str, Any]] = []
        self.active_values: List[Dict[str, Any]] = []

    def store_value(self, value: Dict[str, Any]):
        self.active_values.append(value)
        self.value_history.append({"action": "added", "value": value})
        
        self.mesh.broadcast_announcement({
            "action": "value_memory_sync",
            "value": value
        })

    def update_value(self, old_value: Dict[str, Any], new_value: Dict[str, Any]):
        if old_value in self.active_values:
            self.active_values.remove(old_value)
        self.active_values.append(new_value)
        self.value_history.append({"action": "updated", "old": old_value, "new": new_value})
