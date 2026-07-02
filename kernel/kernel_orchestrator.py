import asyncio
from typing import Dict, Any
from .system import PerfMon, DataVault, RecoveryManager
from .safeguard import SafeGuardEngine
from .offload import OffLoadStream
from .agents import ThinkTank, TaskFlow
from .governance import GovernanceEngine, GovernanceDecision
from .homeostasis import HomeostaticCore

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from runtime.task_vector import TaskVectorMachine
from wisdom.storage import WisdomStore
from identity.manager import IdentityManager

class Orchestrator:
    """
    Coordination Layer: Manages task queueing, executes agent lifecycles, and routes messages.
    """
    def __init__(self):
        self.data_vault = DataVault()
        self.perf_mon = PerfMon()
        self.recovery = RecoveryManager()
        self.safeguard = SafeGuardEngine(self.data_vault)
        self.offload_stream = OffLoadStream(self.safeguard)
        self.task_vector_machine = TaskVectorMachine()
        self.cost_threshold = 0.75
        self.worker_task = None
        
        # Identity enforcement core
        db_dir = os.environ.get("LUCY_DB_DIR", "/tmp")
        self.wisdom_store = WisdomStore(os.path.join(db_dir, "emma_wisdom.db"))
        self.identity_manager = IdentityManager(self.wisdom_store)
        self.identity_manager.load_identity()

        # Multi-outcome governance gate (replaces binary safeguard.validate_intent
        # as the source of truth; safeguard is still used for its alignment calc).
        self.governance = GovernanceEngine(self.wisdom_store, self.data_vault, self.safeguard)

        # Homeostasis-driven proactive goal generation, reading real PerfMon telemetry.
        traits = {"openness": 0.8, "conscientiousness": 0.7, "utility_focus": 0.9}
        self.homeostasis = HomeostaticCore(traits, self.perf_mon, self.data_vault)
        self.homeostasis_task = None
        
    def _calculate_task_cost(self, metrics: Dict[str, float], risk_rating: float) -> float:
        """
        Dynamically calculates task cost to determine if offloading is necessary.
        C_task = f(U_cpu, U_vram, R_risk)
        """
        return (metrics["cpu"] + metrics["vram"]) / 2.0 + (risk_rating * 0.5)

    def start_background_workers(self):
        if not self.worker_task:
            loop = asyncio.get_running_loop()
            self.worker_task = loop.create_task(self.offload_stream.worker())
        if not self.homeostasis_task:
            loop = asyncio.get_running_loop()
            self.homeostasis_task = loop.create_task(self.homeostasis.run_cognitive_loop(self))

    def inject_proactive_task(self, goal: str, metrics: Dict[str, float]):
        """Entry point homeostasis calls when it wants the orchestrator to act
        on sustained resource pressure. Logged, not silently dropped."""
        self.data_vault.record_event("PROACTIVE_TASK_INJECTED", {"goal": goal, "metrics": metrics})
        print(f"[Orchestrator] [Homeostasis] Proactive goal injected: {goal} (metrics={metrics})")
        # TODO: route to a real handler per goal (e.g. THROTTLE_BACKGROUND_TASKS ->
        # lower offload_stream concurrency). Wiring left open pending which
        # subsystems Randy wants these goals to actually control.

    async def dispatch_task(self, agent: Any, action: Dict[str, Any], raw_model_output: str = "", risk_rating: float = 0.2):
        self.start_background_workers()
        agent_id = getattr(agent, "id", getattr(agent, "name", "unknown_agent"))
        print(f"[Orchestrator] Dispatching task to {agent_id}...")
        
        # 0. Strict Identity Validation Invariants Check
        if not self.identity_manager.validate_agent_execution(agent_id, action):
            print(f"[Orchestrator] [CRITICAL] Task BLOCKED by Identity Guardrail. Aborting execution of {agent_id}.")
            return {"status": "blocked_by_identity_manager", "reason": "Action violated core identity values/boundaries."}
            
        # Bridge TaskVectorMachine: Parse <think> tags and align task
        if raw_model_output:
            processed_trajectory = self.task_vector_machine.process_trajectory(
                user_query=action.get("query", ""),
                raw_model_output=raw_model_output,
                base_weights=None
            )
            print(f"[Orchestrator] Task Vector Alignment completed. Aligned: {processed_trajectory['alignment']['aligned']}")
            action["query"] = processed_trajectory["output"]
            action["deliberation"] = processed_trajectory.get("deliberation", "")

        # 1. Multi-outcome governance gate (replaces the old binary SafeGuard check).
        metrics = self.perf_mon.get_metrics()
        gov_result = self.governance.evaluate_request(agent_id, action, metrics, risk_rating)
        decision = gov_result["decision"]

        if decision == GovernanceDecision.DENY.value:
            print(f"[Orchestrator] Task DENIED by Governance: {gov_result['reason']}")
            return {"status": "denied", "reason": gov_result["reason"], "governance": gov_result}

        if decision == GovernanceDecision.QUARANTINE.value:
            print(f"[Orchestrator] Task QUARANTINED by Governance: {gov_result['reason']}")
            return {"status": "quarantined", "reason": gov_result["reason"], "governance": gov_result}

        if decision == GovernanceDecision.ESCALATE_TO_HUMAN.value:
            print(f"[Orchestrator] Task ESCALATED for human approval: {gov_result['reason']}")
            return {"status": "escalated_to_human", "reason": gov_result["reason"], "governance": gov_result}

        if decision == GovernanceDecision.REDIRECT.value:
            print(f"[Orchestrator] Task REDIRECTED per governance: {gov_result['reason']}")
            action = {**action, "target": "local"}
            # Fall through and continue executing, now forced local.

        # APPROVE_WITH_LIMITS clamps cost accounting below via the returned constraints.
        limit_scale = 1.0
        if decision == GovernanceDecision.APPROVE_WITH_LIMITS.value:
            print(f"[Orchestrator] Task APPROVED_WITH_LIMITS: {gov_result['reason']} | {gov_result['constraints']}")
            limit_scale = 1.5  # inflate perceived cost so throttled tasks offload more readily

        # 2. Resource Check
        cost = self._calculate_task_cost(metrics, risk_rating) * limit_scale
        
        # 3. Offload if needed
        if cost > self.cost_threshold:
            print(f"[Orchestrator] High task cost ({cost:.2f}). Shedding to OffLoadStream.")
            future = await self.offload_stream.submit_task(action)
            result = await future
            print(f"[Orchestrator] Received offloaded result: {result}")
            return {"status": "offloaded_completed", "data": result}
            
        # 4. Execute synchronously/asynchronously based on agent execution model
        print(f"[Orchestrator] Task cost acceptable ({cost:.2f}). Executing on main loop.")
        if isinstance(agent, ThinkTank):
            result = await agent.analyze(action.get("query", ""))
            return result
        elif isinstance(agent, TaskFlow):
            result = agent.execute(action)
            return result

    def propose_self_upgrade(self, proposal: Dict[str, Any], live_state: Dict[str, Any], new_code: str, file_path: str, live_prompt: str, live_output: str) -> Dict[str, Any]:
        """
        Routes a self-upgrade proposal through IdentityManager validation and EmmaEvaluationEngine.
        If both checks pass, it deploys the isolated twin and validates the sandbox.
        """
        print(f"[Orchestrator] Proposing self-upgrade for target file: {file_path}")
        
        # 1. Identity Manager Safety Boundary Check
        # Upgrades can only modify files under emma-core/ and src/.
        # No upgrade can touch identity/ or core safety files without explicit human approval.
        clean_file_path = file_path.replace("\\", "/").strip()
        is_safe_path = (
            (clean_file_path.startswith("emma-core/") or clean_file_path.startswith("src/")) and
            "identity/" not in clean_file_path and
            "safeguard" not in clean_file_path.lower()
        )
        
        if not is_safe_path:
            return {
                "success": False,
                "reason": f"CRITICAL SECURITY BLOCKED: Target path '{file_path}' lies outside allowed modification boundaries or attempts to modify core safety/identity components.",
                "report": None
            }
            
        # Validate through IdentityManager invariants
        if not self.identity_manager.validate_agent_execution("system_self_upgrade", {"action": "write_file", "file": file_path}):
            return {
                "success": False,
                "reason": "CRITICAL SECURITY BLOCKED: Upgrade proposal violates core identity manager invariants.",
                "report": None
            }
            
        # 2. Emma Evaluation Engine Pressure Evaluation
        from engines.emotional_resilience import EmmaEvaluationEngine
        emma_eval = EmmaEvaluationEngine()
        
        # Structure the proposal context for Emma
        emma_proposal = {
            "id": proposal.get("id", "upg_proposal_0"),
            "novelty": proposal.get("novelty", 0.65),
            "confidence": proposal.get("confidence", 0.85),
            "cost": proposal.get("cost", 0.45),
            "intentAlignment": proposal.get("intent_alignment", 0.90),
            "target_file": file_path,
            "risk_level": proposal.get("risk_level", "medium")
        }
        
        emma_report = emma_eval.evaluate_proposal(emma_proposal, "self_upgrade_authorization")
        print(f"[Orchestrator] Emma evaluation score: {emma_report['score']}, Trust tier: {emma_report['trustTier']}")
        
        if emma_report["score"] < 0.5:
            return {
                "success": False,
                "reason": f"PROPOSAL REJECTED: Emma emotional web pressure exceeded limits. Score: {emma_report['score']:.3f}. Reason: {emma_report['reasoning']}",
                "emma_report": emma_report
            }
            
        # 3. Deploy isolated twin, clone state, run test inferences and perform multi-stage verification report
        from mirror.shadow import ShadowRouter
        router = ShadowRouter()
        
        passed, audit_report = router.test_upgrade(
            live_state=live_state,
            new_code=new_code,
            file_path=file_path,
            live_prompt=live_prompt,
            live_output=live_output,
            proposal=emma_proposal
        )
        
        return {
            "success": passed,
            "reason": audit_report.get("summary", "Verification complete."),
            "emma_report": emma_report,
            "audit_report": audit_report
        }

