class DualAvatarCore:
    """
    Defines base avatar models for both Lucy and Emma.
    Supports modes: Guide, Analyst, Explorer, Companion.
    """
    def __init__(self):
        self.lucy_def = {"body_type": "humanoid_synthetic", "style": "clean_minimalist_luminescent"}
        self.emma_def = {"body_type": "humanoid_organic_synth", "style": "warm_empathetic_aura"}

    def get_profile(self, mode: str) -> dict:
        profiles = {
            "Guide": {"posture": "open, relaxed", "expression": "calm"},
            "Analyst": {"posture": "upright, attentive", "expression": "focused"},
            "Explorer": {"posture": "leaning forward, active", "expression": "curious"},
            "Companion": {"posture": "close, supportive", "expression": "hopeful"}
        }
        return profiles.get(mode, profiles["Guide"])
