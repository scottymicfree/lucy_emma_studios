import json
from typing import Dict, Any, List

class WorldModelVisualizationEngine:
    def __init__(self, memory):
        self.memory = memory

    def export_to_json(self) -> str:
        return json.dumps(self.memory.get_current_state(), indent=2)

    def generate_summary(self) -> str:
        state = self.memory.get_current_state()
        return f"World Model Summary: Tracking {len(state.keys())} active entities."

    def generate_layout(self) -> Dict[str, Any]:
        layout = {}
        state = self.memory.get_current_state()
        for idx, entity_id in enumerate(state.keys()):
            layout[entity_id] = {"x": (idx * 20) % 100, "y": (idx * 25) % 100}
        return layout
