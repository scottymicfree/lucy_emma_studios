class CreativeComparisonEngine:
    """
    Produces side-by-side comparison of outcomes, highlighted differences,
    strengths, weaknesses, and 'why this outcome emerged'.
    """
    def generate_comparison(self, outcomes: list):
        print("[CreativeComparison] Generating side-by-side comparison.")
        comparisons = []
        for out in outcomes:
            comparisons.append({
                "branch_id": out["branch_id"],
                "highlights": f"Unique focus based on causal factors: {', '.join(out['causal_factors'])}",
                "strengths": out["strengths"],
                "weaknesses": out["weaknesses"],
                "emergence_reason": f"Emerged due to entropy shift to {out['entropy_level']:.2f} triggering alternative contextual association."
            })
        return comparisons
