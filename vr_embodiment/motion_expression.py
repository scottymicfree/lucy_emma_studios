from .schemas import MotionExpressionSchema

class MotionExpressionLayer:
    """
    Head, hand, and body animation driven by user presence, simulation events, etc.
    Facial expressions mapped to emotional telemetry.
    Gestures mapped to explanation actions.
    """
    def __init__(self):
        self.current_expression = "calm"
        self.current_gesture = "idle"

    def drive_animation(self, user_presence: bool, simulation_active: bool, emotion_state: dict, creative_state: dict) -> MotionExpressionSchema:
        print("[VRMotion] Driving avatar skeleton and facial rig.")
        
        strain = emotion_state.get("cognitive_strain", 0)
        if strain > 0.7:
            self.current_expression = "concerned"
        elif creative_state.get("entropy", 0) > 0.6:
            self.current_expression = "focused"
        else:
            self.current_expression = "calm"
            
        if simulation_active:
            self.current_gesture = "pointing_at_graphs"
        else:
            self.current_gesture = "attentive_listening" if user_presence else "idle"

        return {
            "head_tracking": True,
            "hand_tracking": True,
            "facial_expression": self.current_expression,
            "current_gesture": self.current_gesture
        }
