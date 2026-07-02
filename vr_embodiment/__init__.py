from .avatar_core import AvatarCore
from .state_engine import EmbodimentStateEngine
from .motion_expression import MotionExpressionLayer
from .spatial_interaction import SpatialInteractionSystem
from .voice_presence import VoicePresenceIntegration
from .telemetry_overlay import EmotionalCreativeTelemetryOverlay
from .safety_rails import VREmbodimentSafetyRails
from .schemas import EmbodimentTelemetrySchema

class VREmbodimentOrchestrator:
    """
    Orchestrates Lucy's full VR Avatar Embodiment System.
    """
    def __init__(self):
        self.avatar_core = AvatarCore()
        self.state_engine = EmbodimentStateEngine(self.avatar_core)
        self.motion = MotionExpressionLayer()
        self.spatial = SpatialInteractionSystem()
        self.voice = VoicePresenceIntegration()
        self.overlay = EmotionalCreativeTelemetryOverlay()
        self.safety = VREmbodimentSafetyRails()

    def process_embodiment_cycle(self, emotion_telemetry: dict, creative_telemetry: dict, user_presence: bool, sim_active: bool, is_speaking: bool) -> EmbodimentTelemetrySchema:
        print("\n=== [VREmbodiment] Updating Avatar State ===")
        
        state = self.state_engine.update_state(emotion_telemetry, creative_telemetry)
        motion = self.motion.drive_animation(user_presence, sim_active, emotion_telemetry, creative_telemetry)
        voice = self.voice.modulate_voice(is_speaking, emotion_telemetry)
        safety_status = self.safety.get_safety_status()
        
        # Simulated interactions based on creative entropy
        if creative_telemetry.get("entropy", 0) > 0.8 and not self.spatial.divergence_map_drawn:
            self.spatial.draw_divergence_map()
            self.overlay.toggle_hud(True)
            
        spatial_state = self.spatial.get_interaction_state()
        
        print("=== [VREmbodiment] Avatar State Updated ===\n")
        
        return {
            "avatar": self.avatar_core.base_definition,
            "state": state,
            "motion": motion,
            "interaction": spatial_state,
            "voice": voice,
            "safety_status": safety_status
        }
