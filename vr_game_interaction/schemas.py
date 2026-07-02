from typing import TypedDict, Literal, List, Dict, Any, Optional

class ObjectPhysicsSchema(TypedDict):
    grab_offset: Dict[str, float]
    lift_force_newtons: float
    torque_applied: Dict[str, float]
    stability: str
    dynamic_mass_compensation: bool

class VRGameInteractionSchema(TypedDict):
    entity_id: Literal["lucy", "emma"]
    action_type: str
    target_object: str
    physics_applied: bool
    npc_interaction: bool
    environment_modified: bool
    physics_calculations: Optional[ObjectPhysicsSchema]

class GameIntelligenceSchema(TypedDict):
    game_state_understood: bool
    npc_behavior_analysis: str
    predicted_outcome: str
    strategy_provided: str

class VRAvatarDualSchema(TypedDict):
    lucy_mode: str
    emma_mode: str
    lucy_posture: str
    emma_posture: str
    lucy_expression: str
    emma_expression: str

class VRGameSystemTelemetry(TypedDict):
    avatars: VRAvatarDualSchema
    last_interaction: VRGameInteractionSchema
    intelligence: GameIntelligenceSchema
    safety_rails_active: bool
