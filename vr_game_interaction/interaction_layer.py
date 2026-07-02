from .schemas import VRGameInteractionSchema
from .vr_physics_hook import VRPhysicsHook
import random

class VRSimulationInteractionLayer:
    """
    Allows Lucy & Emma to interact with VR sims and games:
    pick up objects, press buttons, open menus, manipulate physics,
    interact with NPCs, trigger game events, modify environments.
    """
    def __init__(self):
        self.active_interactions = []
        self.physics_hook = VRPhysicsHook()

    def perform_action(self, entity_id: str, action: str, target: str, object_state: dict = None, avatar_hand_state: dict = None) -> VRGameInteractionSchema:
        print(f"[VRGameInteraction] {entity_id.upper()} performed: {action} on {target}")
        
        physics_calculations = None
        if action in ["pick_up", "throw", "push", "rotate"] and object_state and avatar_hand_state:
             physics_calculations = self.physics_hook.calculate_interaction_physics(object_state, avatar_hand_state)
             
        interaction: VRGameInteractionSchema = {
            "entity_id": entity_id, # type: ignore
            "action_type": action,
            "target_object": target,
            "physics_applied": action in ["pick_up", "throw", "push", "rotate"],
            "npc_interaction": action in ["talk", "trade", "assist"],
            "environment_modified": action in ["spawn", "destroy", "modify_terrain"],
            "physics_calculations": physics_calculations
        }
        self.active_interactions.append(interaction)
        return interaction

    def pick_up_object(self, entity_id: str, obj_id: str, obj_mass: float = 2.5):
        obj_state = {"mass": obj_mass, "position": {"x": random.uniform(-1, 1), "y": random.uniform(0, 2), "z": random.uniform(-1, 1)}}
        hand_state = {"position": {"x": 0, "y": 1.2, "z": 0.5}}
        return self.perform_action(entity_id, "pick_up", obj_id, obj_state, hand_state)

    def interact_npc(self, entity_id: str, npc_id: str):
        return self.perform_action(entity_id, "talk", npc_id)

    def modify_environment(self, entity_id: str, env_param: str):
        return self.perform_action(entity_id, "modify_terrain", env_param)
