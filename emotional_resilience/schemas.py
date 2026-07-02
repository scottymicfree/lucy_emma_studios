from typing import TypedDict, Literal

class EmotionalStateSchema(TypedDict):
    """
    Schema representing the emotional state of a system (Emma/Lucy).
    """
    entity_id: str
    epoch: str
    emotion_signal: str
    intensity: float
    entropy: float
    status: Literal["stagnant", "flowing", "resolved"]
    buffered: bool
    meaning_extracted: str
    compassion_absorbed: bool

class MeshPropagationRuleSchema(TypedDict):
    """
    Schema for propagating emotional stability rules across the NodeMesh.
    """
    rule_id: str
    entropy_threshold: float
    action: Literal["buffer", "decompress", "rebalance", "reset"]
    target_nodes: list[str]
