import json
from typing import Dict, Any, List

class GraphVisualizationEngine:
    def __init__(self, memory):
        self.memory = memory

    def export_to_json(self) -> str:
        data = {
            "nodes": [{"id": n, "label": n} for n in self.memory.nodes],
            "edges": [{"source": e["source"], "target": e["target"], "label": e["relation"]} for e in self.memory.edges]
        }
        return json.dumps(data, indent=2)

    def generate_layout(self) -> Dict[str, Any]:
        layout = {}
        for idx, node in enumerate(self.memory.nodes):
            layout[node] = {"x": (idx * 10) % 100, "y": (idx * 15) % 100}
        return layout

    def generate_summary(self) -> str:
        return f"Graph Summary: {len(self.memory.nodes)} nodes and {len(self.memory.edges)} edges."
