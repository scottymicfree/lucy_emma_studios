import json
from typing import Dict, Any, List

class CreativeMemoryFabric:
    def __init__(self, mesh):
        self.mesh = mesh
        self.style_memory: Dict[str, List[str]] = {}
        self.motifs: Dict[str, List[Any]] = {}
        self.inspirations: List[Dict[str, Any]] = []

    def store_style_pattern(self, agent_id: str, style_data: str):
        if agent_id not in self.style_memory:
            self.style_memory[agent_id] = []
        self.style_memory[agent_id].append(style_data)

    def store_motif(self, category: str, motif: Any):
        if category not in self.motifs:
            self.motifs[category] = []
        self.motifs[category].append(motif)
        
    def retrieve_inspiration(self, query: str) -> List[Dict[str, Any]]:
        return [insp for insp in self.inspirations if query.lower() in json.dumps(insp).lower()]
