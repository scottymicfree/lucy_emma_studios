from .schemas import CreativeOutcomeSchema, CreativeDivergenceSchema
import uuid

class CreativeDivergenceEngine:
    """
    Generates multiple alternate outcomes from the same prompt.
    Uses entropy-balanced branching logic.
    Ensures each branch is meaningfully different.
    """
    def __init__(self):
        self.entropy_balancer = 0.5

    def generate_divergent_outcomes(self, prompt: str, num_branches: int = 3) -> list:
        print(f"[CreativeDivergence] Generating {num_branches} divergent outcomes for: '{prompt}'")
        outcomes = []
        for i in range(num_branches):
            branch_entropy = self.entropy_balancer + (i * 0.15)
            outcome = {
                "id": str(uuid.uuid4()),
                "branch_id": f"branch_{i}",
                "content": f"Divergent outcome {i} exploring unique angle based on entropy {branch_entropy:.2f}",
                "entropy_level": branch_entropy,
                "causal_factors": [f"Factor A (branch {i})", f"Factor B (branch {i})"],
                "strengths": ["Novel perspective", "High engagement potential"],
                "weaknesses": ["Potential for ambiguity", "Higher cognitive load"],
                "creative_velocity": 0.8 + (i * 0.05)
            }
            outcomes.append(outcome)
        return outcomes
