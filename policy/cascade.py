"""
E.M.M.A. Policy Cascade
Translates active WisdomRecords into Lucy runtime enforcement manifests (PolicyRecords).
Called during boot and after any new law is committed to the sovereign ledger.
"""

import logging
from datetime import datetime
from typing import List, Optional

from wisdom.models import (
    WisdomRecord,
    PolicyRecord,
    GovernanceCategory,
    RecordStatus,
)
from wisdom.storage import WisdomStore

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Compilation rules: map WisdomRecord categories to Lucy runtime directives
# ---------------------------------------------------------------------------

_CATEGORY_ENFORCEMENT_DEFAULTS = {
    GovernanceCategory.IDENTITY: {
        "block_on_violation": True,
        "log_level": "CRITICAL",
        "notify_operator": True,
    },
    GovernanceCategory.ETHICS: {
        "block_on_violation": True,
        "log_level": "ERROR",
        "notify_operator": True,
    },
    GovernanceCategory.RESOURCE_GOVERNANCE: {
        "block_on_violation": False,
        "log_level": "WARNING",
        "throttle_on_violation": True,
        "token_quota_per_step": 2048,
    },
    GovernanceCategory.STRATEGY: {
        "block_on_violation": False,
        "log_level": "INFO",
        "advisory_only": True,
    },
}


class PolicyCascade:
    """
    Compiles active WisdomRecords into PolicyRecords that Lucy's runtime
    can evaluate at execution time without re-querying the database.

    Usage:
        cascade = PolicyCascade(wisdom_store)
        manifest = cascade.compile()          # returns List[PolicyRecord]
        cascade.apply_to_runtime(lucy_kernel) # pushes manifest to Lucy
    """

    def __init__(self, wisdom_store: WisdomStore):
        self.wisdom_store = wisdom_store
        self._manifest: List[PolicyRecord] = []

    def compile(self, category: Optional[GovernanceCategory] = None) -> List[PolicyRecord]:
        """
        Reads all active laws from the sovereign ledger (filtered by category if provided),
        and compiles them into typed PolicyRecords.

        This is a pure function: no side effects beyond in-memory state.
        """
        active_laws: List[WisdomRecord] = self.wisdom_store.query_active_laws(category)
        compiled: List[PolicyRecord] = []

        for law in active_laws:
            if law.confidence < 0.5:
                log.debug(
                    "[PolicyCascade] Skipping low-confidence law %s (%.2f)", law.id, law.confidence
                )
                continue

            base_rules = dict(_CATEGORY_ENFORCEMENT_DEFAULTS.get(law.category, {}))

            # Inject the law text into enforcement rules for runtime matching
            base_rules["law_text"] = law.law
            base_rules["source_hash"] = law.source_hash

            # Override blocking threshold based on confidence
            if law.confidence >= 0.90:
                base_rules["block_on_violation"] = True

            policy = PolicyRecord(
                name=f"policy_{law.category.value.lower()}_{law.id[:8]}",
                source_wisdom_id=law.id,
                confidence_threshold=law.confidence,
                enforcement_rules=base_rules,
                compiled_at=datetime.utcnow(),
            )
            compiled.append(policy)
            log.debug("[PolicyCascade] Compiled policy '%s' from law: %s", policy.name, law.law[:60])

        self._manifest = compiled
        log.info(
            "[PolicyCascade] Compilation complete. %d policies in manifest (category=%s).",
            len(compiled),
            category.value if category else "ALL",
        )
        return compiled

    def compile_all(self) -> List[PolicyRecord]:
        """Compiles policies for all governance categories."""
        return self.compile(category=None)

    def get_manifest(self) -> List[PolicyRecord]:
        """Returns the last compiled manifest without re-querying the store."""
        return list(self._manifest)

    def apply_to_runtime(self, runtime_kernel) -> None:
        """
        Pushes the compiled manifest to the Lucy runtime kernel.
        The kernel must implement `receive_policy_manifest(policies: List[PolicyRecord])`.
        """
        if not self._manifest:
            log.warning("[PolicyCascade] apply_to_runtime called with empty manifest. Call compile() first.")
            return

        if not hasattr(runtime_kernel, "receive_policy_manifest"):
            log.error(
                "[PolicyCascade] Runtime kernel does not implement receive_policy_manifest(). "
                "Policies NOT applied."
            )
            return

        runtime_kernel.receive_policy_manifest(self._manifest)
        log.info(
            "[PolicyCascade] %d policies pushed to Lucy runtime kernel.", len(self._manifest)
        )

    def summarize(self) -> str:
        """Returns a human-readable summary of the active manifest for logging/debugging."""
        if not self._manifest:
            return "[PolicyCascade] No manifest compiled."
        lines = [f"[PolicyCascade] Active Manifest ({len(self._manifest)} policies):"]
        for p in self._manifest:
            block = "BLOCK" if p.enforcement_rules.get("block_on_violation") else "WARN"
            lines.append(
                f"  [{block}] {p.name}  confidence≥{p.confidence_threshold:.2f}  "
                f"law: {p.enforcement_rules.get('law_text', '')[:60]}"
            )
        return "\n".join(lines)
