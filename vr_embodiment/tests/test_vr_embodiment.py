from engines.vr_embodiment import VREmbodimentOrchestrator

class VREmbodimentTestHarness:
    def __init__(self):
        self.orchestrator = VREmbodimentOrchestrator()

    def run_tests(self):
        print("=== Initiating VR Embodiment Stress Test ===")
        
        scenarios = [
            {"name": "Idle / Guide", "emotion": {"cognitive_strain": 0.2}, "creative": {"entropy": 0.3}, "presence": True, "sim": False, "speak": False},
            {"name": "Heavy Simulation / Analyst", "emotion": {"cognitive_strain": 0.6}, "creative": {"entropy": 0.5}, "presence": True, "sim": True, "speak": True},
            {"name": "High Divergence / Explorer", "emotion": {"cognitive_strain": 0.4}, "creative": {"entropy": 0.9}, "presence": True, "sim": True, "speak": True}
        ]
        
        for idx, sc in enumerate(scenarios):
            print(f"\n--- Scenario {idx+1}: {sc['name']} ---")
            result = self.orchestrator.process_embodiment_cycle(
                sc["emotion"], sc["creative"], sc["presence"], sc["sim"], sc["speak"]
            )
            print(f"Mode: {result['state']['mode']} | Posture: {result['state']['posture']}")
            print(f"Expression: {result['motion']['facial_expression']} | Gesture: {result['motion']['current_gesture']}")
            print(f"Voice Tone: {result['voice']['tone']} | Map Drawn: {result['interaction']['divergence_map_drawn']}")
            
        print("\n=== VR Embodiment Stress Test Complete ===")

if __name__ == "__main__":
    harness = VREmbodimentTestHarness()
    harness.run_tests()
