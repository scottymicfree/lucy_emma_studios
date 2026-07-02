from .openxr_bindings import OpenXRBindings
from .telemetry_feed import VRTelemetryFeed
from .command_layer import VRCommandLayer
from .simulation_hooks import VRSimulationHooks
from .creative_vr import CreativeEngineVR
from .emotional_vr import EmotionalEngineVR
from .safety_rails import VRSafetyRails

class VRBridgeOrchestrator:
    """
    Orchestrates the entire VR Bridge Layer + Sensor Fusion + Simulation Link.
    Links Meta Quest / Oculus VR (OpenXR) with Lucy, Emma, and NodeMesh.
    """
    def __init__(self):
        self.bindings = OpenXRBindings()
        self.telemetry = VRTelemetryFeed(self.bindings)
        self.command = VRCommandLayer()
        self.hooks = VRSimulationHooks()
        self.creative_vr = CreativeEngineVR(self.command)
        self.emotional_vr = EmotionalEngineVR()
        self.safety = VRSafetyRails()

    def initiate_vr_session(self):
        print("\n=== [VRBridge] Initiating VR Session with Lucy & Emma ===")
        self.bindings.start_session()
        
        # 1. Gather Telemetry
        vr_data = self.telemetry.get_latest_feed()
        
        # 2. Check Safety Rails
        boundary_safe = self.safety.check_boundaries(vr_data)
        
        # 3. Stabilize Emotion
        emotion_state = self.emotional_vr.stabilize_immersion(0.6)
        
        # 4. Integrate Simulation
        sim_state = self.hooks.hook_dag({"active": True})
        
        # 5. Push VR Command
        self.command.spawn_object("lucy_avatar", {"x": 0, "y": 1.5, "z": -1})
        self.command.show_simulation_overlay({"status": "active"})
        
        print("=== [VRBridge] VR Session Active ===\n")
        
        return {
            "status": "vr_active",
            "telemetry": vr_data,
            "safety_checks": {"boundary_safe": boundary_safe},
            "emotion_vr": emotion_state,
            "simulation_hooks": sim_state,
            "pending_commands": len(self.command.command_queue)
        }
