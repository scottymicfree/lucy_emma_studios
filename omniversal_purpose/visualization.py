import json
from typing import Dict, Any, List

class PurposeVisualizationEngine:
    def __init__(self, memory):
        self.memory = memory

    def export_to_json(self) -> str:
        return json.dumps(self.memory.get_current_purpose_state(), indent=2)

    def generate_summary(self) -> str:
        state = self.memory.get_current_purpose_state()
        active = state.get("active_purposes", [])
        return f"Omniversal Purpose Summary: Driving {len(active)} core meta-purposes across infinite scales."

    def generate_layout(self) -> Dict[str, Any]:
        layout = {}
        state = self.memory.get_current_purpose_state()
        active = state.get("active_purposes", [])
        for idx, purp in enumerate(active):
            layout[f"purpose_{idx}"] = {"x": (idx * 20) % 100, "y": (idx * 25) % 100, "z": (idx * 30) % 100}
        return layout
