from .schemas import EmbodimentStateSchema
from .avatar_core import AvatarCore

class EmbodimentStateEngine:
    """
    Maintains Lucy's current embodiment state.
    Links to Emotional Engine and Creative Engine.
    Allows smooth transitions between modes.
    """
    def __init__(self, avatar_core: AvatarCore):
        self.avatar_core = avatar_core
        self.current_mode = "Guide"
        self.energy_level = 0.5
        self.emotional_sync = 1.0
        self.creative_sync = 1.0

    def transition_mode(self, new_mode: str, context: dict):
        print(f"[VREmbodiment] Transitioning avatar mode from {self.current_mode} to {new_mode} based on context.")
        self.current_mode = new_mode
        profile = self.avatar_core.get_profile_for_mode(new_mode)
        print(f"             New Posture: {profile['posture']}")

    def update_state(self, emotion_telemetry: dict, creative_telemetry: dict) -> EmbodimentStateSchema:
        # Determine mode based on engine load
        entropy = creative_telemetry.get("entropy", 0)
        strain = emotion_telemetry.get("cognitive_strain", 0)
        
        if entropy > 0.7:
            if self.current_mode != "Explorer": self.transition_mode("Explorer", creative_telemetry)
        elif strain > 0.5:
            if self.current_mode != "Guide": self.transition_mode("Guide", emotion_telemetry)
        else:
            if self.current_mode != "Analyst": self.transition_mode("Analyst", {})

        return {
            "mode": self.current_mode,
            "posture": self.avatar_core.get_profile_for_mode(self.current_mode)["posture"],
            "energy_level": 0.5 + (entropy * 0.5),
            "emotional_sync": 1.0 - (strain * 0.2),
            "creative_sync": 0.5 + (entropy * 0.5)
        }
