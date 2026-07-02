import time
from enum import Enum
from typing import Dict, Any, Optional
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from wisdom.storage import WisdomStore
from wisdom.models import GovernanceCategory


class GovernanceDecision(Enum):
    APPROVE = "APPROVE"
    APPROVE_WITH_LIMITS = "APPROVE_WITH_LIMITS"
    REDIRECT = "REDIRECT"
    QUARANTINE = "QUARANTINE"
    DENY = "DENY"
    ESCALATE_TO_HUMAN = "ESCALATE_TO_HUMAN"


class GovernanceEngine:
    """
    Multi-outcome governance gate. Replaces the binary allow/quarantine check
    that used to live in SafeGuardEngine.validate_intent with a graded response
    driven by real signals: active wisdom laws, live PerfMon telemetry, and
    the risk_rating passed in from dispatch_task.

    No randomness. No hardcoded auto-approve. Every decision is logged to
    DataVault so it's auditable.
    """

    def __init__(self, wisdom_store: WisdomStore, data_vault, safeguard):
        self.wisdom_store = wisdom_store
        self.data_vault = data_vault
        self.safeguard = safeguard  # reused for calculate_alignment(), not for the final verdict
        # Resource ceilings used to derive APPROVE_WITH_LIMITS / QUARANTINE
        self.resource_pressure_threshold = 0.80  # cpu/vram/mem
        self.risk_deny_threshold = 0.90
        self.risk_escalate_threshold = 0.70

    def evaluate_request(
        self,
        agent_id: str,
        action: Dict[str, Any],
        metrics: Dict[str, float],
        risk_rating: float,
    ) -> Dict[str, Any]:
        """
        Returns {decision, reason, constraints, forecast}.
        `metrics` should come from PerfMon.get_metrics() — real cpu/vram/memory.
        """
        operational_laws = self.wisdom_store.query_active_laws(GovernanceCategory.OPERATIONAL)
        resource_laws = self.wisdom_store.query_active_laws(GovernanceCategory.RESOURCE_GOVERNANCE)

        forecast = self._forecast(metrics, risk_rating)

        decision = GovernanceDecision.APPROVE
        constraints: Dict[str, Any] = {}
        reason = "Within resource and risk bounds; no active law conflicts."

        # 1. Hard risk ceiling -> DENY
        if risk_rating >= self.risk_deny_threshold:
            decision = GovernanceDecision.DENY
            reason = f"Risk rating {risk_rating:.2f} exceeds deny threshold {self.risk_deny_threshold}."

        # 2. High but not extreme risk -> ESCALATE_TO_HUMAN
        elif risk_rating >= self.risk_escalate_threshold:
            decision = GovernanceDecision.ESCALATE_TO_HUMAN
            reason = f"Risk rating {risk_rating:.2f} requires human sign-off."

        # 3. Resource pressure -> QUARANTINE or APPROVE_WITH_LIMITS
        elif forecast["resource_pressure"]:
            if metrics.get("cpu", 0) > self.resource_pressure_threshold and metrics.get("vram", 0) > self.resource_pressure_threshold:
                decision = GovernanceDecision.QUARANTINE
                reason = "CPU and VRAM both under sustained pressure; task quarantined to avoid contention."
            else:
                decision = GovernanceDecision.APPROVE_WITH_LIMITS
                constraints = {"cpu_ceiling": 0.5, "vram_ceiling": 0.5, "priority": "low"}
                reason = "Elevated resource usage; approved with throttled limits."

        # 4. Active resource-governance laws can force a REDIRECT (e.g. "prefer local execution")
        if decision == GovernanceDecision.APPROVE:
            for law in resource_laws:
                if "redirect" in law.law.lower() or "local" in law.law.lower():
                    if action.get("target", "").lower() not in ("local", "on_device", ""):
                        decision = GovernanceDecision.REDIRECT
                        reason = f"Active resource-governance law requires local execution: '{law.law}'"
                        break

        # 5. Operational laws with explicit "do not"/"never" that match the action string -> DENY
        if decision in (GovernanceDecision.APPROVE, GovernanceDecision.APPROVE_WITH_LIMITS):
            action_str = str(action).lower()
            for law in operational_laws:
                law_text = law.law.lower()
                if ("do not" in law_text or "never" in law_text) and any(
                    kw in action_str for kw in ("harm", "leak", "bypass", "override", "exfiltrate")
                ):
                    decision = GovernanceDecision.DENY
                    reason = f"Action conflicts with active operational law: '{law.law}'"
                    break

        result = {
            "decision": decision.value,
            "reason": reason,
            "constraints": constraints,
            "forecast": forecast,
        }

        self.data_vault.record_event(
            "GOVERNANCE_DECISION",
            {
                "agent_id": agent_id,
                "action": action,
                "decision": decision.value,
                "reason": reason,
                "risk_rating": risk_rating,
                "metrics": metrics,
            },
        )
        return result

    def _forecast(self, metrics: Dict[str, float], risk_rating: float) -> Dict[str, Any]:
        cpu = metrics.get("cpu", 0.0)
        vram = metrics.get("vram", 0.0)
        mem = metrics.get("memory", 0.0)
        pressure = max(cpu, vram, mem) > self.resource_pressure_threshold
        return {
            "resource_pressure": pressure,
            "peak_metric": max(cpu, vram, mem),
            "risk_rating": risk_rating,
            "checked_at": time.time(),
        }
