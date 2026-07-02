from typing import TypedDict, Literal, List, Dict, Any

class CreativeOutcomeSchema(TypedDict):
    id: str
    branch_id: str
    content: str
    entropy_level: float
    causal_factors: List[str]
    strengths: List[str]
    weaknesses: List[str]
    creative_velocity: float

class ReasoningChainNodeSchema(TypedDict):
    step: int
    decision: str
    rationale: str
    divergence_trigger: bool

class CreativeDivergenceSchema(TypedDict):
    prompt_id: str
    original_prompt: str
    outcomes: List[CreativeOutcomeSchema]
    reasoning_chains: Dict[str, List[ReasoningChainNodeSchema]]
    divergence_map: Dict[str, Any]
    resilience_status: Literal["stable", "strained", "reconstructing"]
