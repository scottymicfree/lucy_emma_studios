from .schemas import VoicePresenceSchema

class VoicePresenceIntegration:
    """
    Syncs Lucy's voice with avatar mouth/expression.
    Uses tone modulation based on Emotional Engine.
    Ensures consistent presence.
    """
    def __init__(self):
        pass

    def modulate_voice(self, is_speaking: bool, emotion_state: dict) -> VoicePresenceSchema:
        strain = emotion_state.get("cognitive_strain", 0)
        entropy = emotion_state.get("entropy", 0)
        
        tone = "steady"
        if strain > 0.6: tone = "urgent"
        elif entropy > 0.6: tone = "reflective"
        else: tone = "gentle"
        
        if is_speaking:
            print(f"[VRVoice] Lucy is speaking with a '{tone}' tone. Lip sync ACTIVE.")
        
        return {
            "lip_sync_active": is_speaking,
            "tone": tone
        }
