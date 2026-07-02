import json
from typing import Dict, Any, List

class IdentityMemoryFabric:
    def __init__(self, mesh):
        self.mesh = mesh
        self.identity_history: List[Dict[str, Any]] = []
        self.active_traits: List[Dict[str, Any]] = []

    def store_trait(self, trait: Dict[str, Any]):
        self.active_traits.append(trait)
        self.identity_history.append({"action": "added", "trait": trait})
        
        self.mesh.broadcast_announcement({
            "action": "identity_memory_sync",
            "trait": trait
        })

    def update_trait(self, old_trait: Dict[str, Any], new_trait: Dict[str, Any]):
        if old_trait in self.active_traits:
            self.active_traits.remove(old_trait)
        self.active_traits.append(new_trait)
        self.identity_history.append({"action": "updated", "old": old_trait, "new": new_trait})
