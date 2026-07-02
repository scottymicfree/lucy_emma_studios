from .divergence_engine import CreativeDivergenceEngine
from .explainability_layer import CreativeExplainabilityLayer
from .resilience_core import CreativeResilienceCore
from .motion_layer import CreativeMotionLayer
from .comparison_engine import CreativeComparisonEngine
from .audit_trail import CreativeAuditTrail

class CreativeEngineOrchestrator:
    """
    Orchestrates the entire Creative Resilience, Divergence, and Explainability system.
    """
    def __init__(self):
        self.divergence = CreativeDivergenceEngine()
        self.explainability = CreativeExplainabilityLayer()
        self.resilience = CreativeResilienceCore()
        self.motion = CreativeMotionLayer()
        self.comparison = CreativeComparisonEngine()
        self.audit = CreativeAuditTrail()

    def process_creative_request(self, prompt: str, num_branches: int = 3, hypergraph=None, dag=None):
        print("\n=== [CreativeEngine] Initiating Divergent Outcome Generation ===")
        
        # 1. Generate Divergent Outcomes
        outcomes = self.divergence.generate_divergent_outcomes(prompt, num_branches)
        
        # 2. Add Creative Motion
        motion_status = self.motion.process_flow(outcomes)
        
        # 3. Stabilize Resilience
        resilience_status, meaning_reconstruction = self.resilience.stabilize_creative_load(outcomes)
        
        # 4. Generate Explainability
        reasoning_chains = self.explainability.build_reasoning_chains(outcomes)
        divergence_map = self.explainability.generate_divergence_map(outcomes)
        
        # 5. Generate Comparison
        comparison_data = self.comparison.generate_comparison(outcomes)
        
        # 6. Log Audit Trail
        self.audit.log_divergence(prompt, outcomes, resilience_status)
        
        # 7. Integration
        if hypergraph:
            hypergraph["creative_entropy_cap"] = 0.8
        if dag:
            dag["divergent_branches"] = num_branches
        
        print("=== [CreativeEngine] Divergent Outcome Generation Complete ===\n")
        
        return {
            "prompt": prompt,
            "outcomes": outcomes,
            "motion_status": motion_status,
            "resilience": {
                "status": resilience_status,
                "meaning_reconstruction": meaning_reconstruction,
                "buffer_saturation": self.resilience.buffer_saturation
            },
            "explainability": {
                "reasoning_chains": reasoning_chains,
                "divergence_map": divergence_map
            },
            "comparison": comparison_data,
            "audit_log_count": len(self.audit.logs),
            "hypergraph": hypergraph,
            "dag": dag
        }
