class EmotionalCreativeTelemetryOverlay:
    """
    Optional HUD/spatial panels showing emotional stability, creative entropy,
    current simulation branch, reasoning chain highlights.
    Lucy calls these up with gestures.
    """
    def __init__(self):
        self.hud_visible = False

    def toggle_hud(self, visible: bool):
        self.hud_visible = visible
        print(f"[VROverlay] Telemetry HUD is now {'visible' if visible else 'hidden'}.")

    def render_overlay(self, emotion_state: dict, creative_state: dict):
        if not self.hud_visible: return None
        return {
            "emotional_stability": 1.0 - emotion_state.get("cognitive_strain", 0),
            "creative_entropy": creative_state.get("entropy", 0),
            "current_branch": creative_state.get("current_branch", "root"),
            "reasoning_highlight": "Parsing spatial context."
        }
