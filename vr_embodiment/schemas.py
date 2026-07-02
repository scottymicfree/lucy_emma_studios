from typing import TypedDict, Literal, List, Dict, Any

class AvatarCoreSchema(TypedDict):
    body_type: str
    style: str
    mode: Literal["Guide", "Analyst", "Explorer"]

class EmbodimentStateSchema(TypedDict):
    mode: Literal["Guide", "Analyst", "Explorer"]
    posture: str
    energy_level: float
    emotional_sync: float
    creative_sync: float

class MotionExpressionSchema(TypedDict):
    head_tracking: bool
    hand_tracking: bool
    facial_expression: str
    current_gesture: str

class SpatialInteractionSchema(TypedDict):
    active_objects: List[str]
    timeline_visible: bool
    divergence_map_drawn: bool
    highlighted_nodes: List[str]

class VoicePresenceSchema(TypedDict):
    lip_sync_active: bool
    tone: str

class EmbodimentTelemetrySchema(TypedDict):
    avatar: AvatarCoreSchema
    state: EmbodimentStateSchema
    motion: MotionExpressionSchema
    interaction: SpatialInteractionSchema
    voice: VoicePresenceSchema
    safety_status: str
