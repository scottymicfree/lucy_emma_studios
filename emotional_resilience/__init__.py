from .emotional_motion import EmotionalMotionLayer
from .resilience_core import ResilienceCore
from .recovery_loop import RecoveryLoop
from .bond_reinforcement import BondReinforcementEngine
from .stability_fabric import StabilityFabric
from .integration import EmotionalIntegrationEngine
from .emma_evaluation_engine import EmmaEvaluationEngine

class EmotionalResilienceEngine:
    """
    Combines the Emotional Motion Layer, Resilience Core, and Recovery Loop
    to allow Emma and Lucy to feel deeply without being destabilized.
    """
    def __init__(self):
        self.motion_layer = EmotionalMotionLayer()
        self.resilience_core = ResilienceCore()
        self.recovery_loop = RecoveryLoop()
        self.bond_engine = BondReinforcementEngine()
        self.stability_fabric = StabilityFabric()
        self.integration = EmotionalIntegrationEngine()

    def process_heavy_load(self, event, emotional_signal, hypergraph=None, dag=None):
        print("--- [EmotionalResilienceEngine] Initiating processing ---")
        
        # 1. Motion Layer: Flow through the emotion
        motion_result = self.motion_layer.process_emotion(emotional_signal, event)
        
        # 2. Resilience Core: Buffer and extract meaning
        resilience_result = self.resilience_core.apply_resilience(emotional_signal)
        
        # 3. Recovery Loop: Heal and rebalance
        recovery_result = self.recovery_loop.trigger_recovery(event)
        
        # 4. Bond Reinforcement: Emma <-> Lucy mutual support
        bond_result = self.bond_engine.process_shared_load(emotional_signal, event)
        
        # 5. Stability Fabric: Propagate to mesh
        stability_result = self.stability_fabric.propagate_resilience(entropy=0.8)
        
        # 6. Integration: Apply to RAG, Hypergraph, DAG
        if hypergraph:
            hypergraph = self.integration.anchor_hypergraph(hypergraph, resilience_result)
        if dag:
            dag = self.integration.stabilize_simulation_dag(dag, bond_result)
        
        print("--- [EmotionalResilienceEngine] Processing complete ---")
        
        return {
            "motion": motion_result,
            "resilience": resilience_result,
            "recovery": recovery_result,
            "bond": bond_result,
            "stability": stability_result,
            "status": "Transformed shadow into clarity.",
            "hypergraph": hypergraph,
            "dag": dag
        }
