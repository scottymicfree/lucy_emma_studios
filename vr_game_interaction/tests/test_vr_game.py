from engines.vr_game_interaction import VRGameSystemOrchestrator

class VRGameStressTest:
    def __init__(self):
        self.orchestrator = VRGameSystemOrchestrator()

    def run_tests(self):
        print("=== Initiating VR Game Interaction Stress Test ===")
        
        mock_game_state = {"level": "alpha", "threat_level": "medium"}
        mock_npcs = [{"id": "npc_1", "state": "defensive"}]
        
        result = self.orchestrator.process_game_cycle(mock_game_state, mock_npcs)
        
        print("\n[VR Game Test Results]")
        print(f"Lucy Mode: {result['avatars']['lucy_mode']} | Emma Mode: {result['avatars']['emma_mode']}")
        print(f"Intelligence Strategy: {result['intelligence']['strategy_provided']}")
        print(f"Last Interaction: {result['last_interaction']['entity_id']} -> {result['last_interaction']['action_type']}")
        
        print("\n=== VR Game Interaction Stress Test Complete ===")

if __name__ == "__main__":
    harness = VRGameStressTest()
    harness.run_tests()
