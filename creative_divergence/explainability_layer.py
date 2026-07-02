from .schemas import ReasoningChainNodeSchema
from typing import List, Dict

class CreativeExplainabilityLayer:
    """
    Outputs reasoning chain for each outcome, causal differences,
    key decision points, and divergence map.
    """
    def __init__(self):
        pass

    def build_reasoning_chains(self, outcomes: list) -> Dict[str, List[ReasoningChainNodeSchema]]:
        print("[CreativeExplainability] Building reasoning chains for outcomes.")
        chains = {}
        for outcome in outcomes:
            branch = outcome["branch_id"]
            chains[branch] = [
                {"step": 1, "decision": "Initial context parsed", "rationale": "Establishing baseline meaning", "divergence_trigger": False},
                {"step": 2, "decision": f"Apply entropy shift ({outcome['entropy_level']})", "rationale": "Injecting controlled randomness for divergence", "divergence_trigger": True},
                {"step": 3, "decision": "Synthesize divergent concept", "rationale": "Merging prompt with shifted perspective", "divergence_trigger": False},
            ]
        return chains

    def generate_divergence_map(self, outcomes: list):
        print("[CreativeExplainability] Generating divergence map.")
        return {
            "root": "Initial Prompt",
            "branches": [outcome["branch_id"] for outcome in outcomes],
            "split_points": ["step_2_entropy_shift"]
        }
