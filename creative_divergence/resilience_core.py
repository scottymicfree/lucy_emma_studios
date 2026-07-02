class CreativeResilienceCore:
    """
    Prevents emotional overload during creative exploration.
    Ensures creativity remains stable under high entropy.
    Adds meaning-reconstruction logic for creative failures.
    """
    def __init__(self):
        self.buffer_saturation = 0.0

    def stabilize_creative_load(self, outcomes: list):
        print(f"[CreativeResilience] Stabilizing load across {len(outcomes)} divergent paths.")
        total_entropy = sum(o["entropy_level"] for o in outcomes)
        
        if total_entropy > 2.5:
            self.buffer_saturation += 0.2
            return "strained", self._reconstruct_meaning()
        
        return "stable", None

    def _reconstruct_meaning(self):
        print("[CreativeResilience] Activating meaning-reconstruction logic due to high creative entropy.")
        return "Reconstructed meaning: Extracted core truth from chaotic divergence."
