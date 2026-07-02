from typing import TypedDict, List, Dict, Any, Optional
import datetime

class VRPoseSchema(TypedDict):
    x: float
    y: float
    z: float
    pitch: float
    yaw: float
    roll: float

class VRHandGestureSchema(TypedDict):
    left_hand: str
    right_hand: str
    pinch_strength: float

class VRTelemetrySchema(TypedDict):
    headset_pose: VRPoseSchema
    left_controller: VRPoseSchema
    right_controller: VRPoseSchema
    hand_gestures: VRHandGestureSchema
    room_boundaries: List[Dict[str, float]]
    spatial_anchors: List[str]
    mr_passthrough_active: bool

class VRCommandSchema(TypedDict):
    command_type: str
    target_id: str
    parameters: Dict[str, Any]
    timestamp: str
