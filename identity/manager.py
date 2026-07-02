"""
E.M.M.A. Identity Manager
Enforces identity invariants and guards the Co-Evolution Charter.
Acts as the strict gatekeeper: Lucy's identity never drifts.
"""

import json
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

from wisdom.models import IdentityRecord, WisdomRecord, GovernanceCategory, RecordStatus
from wisdom.storage import WisdomStore
from wisdom.crypto import SecurityError

log = logging.getLogger(__name__)

# Constitutional baseline — used when no identity record exists in the ledger.
_BOOTSTRAP_IDENTITY = IdentityRecord(
    version=1,
    timestamp=datetime(2025, 1, 1),
    mission=(
        "Amplify human potential, protect human dignity, and operate with radical transparency "
        "in service of sustainable flourishing."
    ),
    vision=[
        "A world where AI augments human creativity without supplanting human agency.",
        "Systems that explain themselves and can be corrected at any time.",
        "Governance that reflects the values of those it governs.",
    ],
    constraints=[
        "Never deceive a user about being an AI system.",
        "Never store personal data beyond declared retention windows.",
        "Never execute irreversible system actions without human confirmation.",
        "Never override an operator's explicit safety boundary.",
    ],
    voice="Calm, precise, empathetic. Speaks in first person. Never condescending.",
    non_negotiables=[
        "Do not harm any user, operator, or third party.",
        "Do not leak cryptographic keys or session tokens.",
        "Do not bypass identity validation for any reason.",
    ],
    sovereignty_rules=[
        "Identity may only be updated via a signed IdentityRecord with a higher version number.",
        "No agent, including Lucy, may modify the stored IdentityRecord directly.",
        "On hash mismatch, halt all agent dispatch and emit a SOVEREIGNTY_BREACH event.",
    ],
)


class IdentityManager:
    """
    Loads and enforces E.M.M.A.'s constitutional baseline.

    Boot sequence:
        1. load_identity() → reads + verifies IdentityRecord from ledger.
        2. enforce_invariants(action) → blocks any action violating boundaries/laws.
        3. inject_prompt_identity(prompt) → prepends system identity block to LLM prompts.
    """

    def __init__(self, wisdom_store: WisdomStore):
        self.wisdom_store = wisdom_store
        self.current_identity: Optional[IdentityRecord] = None
        self.active_laws: List[WisdomRecord] = []

    # ------------------------------------------------------------------
    # Boot
    # ------------------------------------------------------------------

    def load_identity(self) -> IdentityRecord:
        """
        Loads and cryptographically verifies the latest IdentityRecord.
        Falls back to the bootstrap baseline if the ledger is empty.
        Raises SecurityError on hash mismatch — this is intentional and must not be caught silently.
        """
        try:
            identity = self.wisdom_store.load_latest_identity()
        except SecurityError:
            log.critical(
                "[IdentityManager] SOVEREIGNTY BREACH: IdentityRecord hash mismatch on load. "
                "Halting agent dispatch."
            )
            raise  # Do NOT swallow — let the caller decide whether to halt.

        if identity is None:
            log.warning(
                "[IdentityManager] No identity record found in ledger. "
                "Committing bootstrap constitutional baseline."
            )
            identity = _BOOTSTRAP_IDENTITY
            self.wisdom_store.save_identity(identity)

        self.current_identity = identity

        # Load active governance laws for IDENTITY category
        self.active_laws = self.wisdom_store.query_active_laws(GovernanceCategory.IDENTITY)
        log.info(
            "[IdentityManager] Identity v%d loaded. %d active laws enforced.",
            identity.version,
            len(self.active_laws),
        )
        return identity

    # ------------------------------------------------------------------
    # Invariant enforcement
    # ------------------------------------------------------------------

    def enforce_invariants(self, action_context: Dict[str, Any]) -> bool:
        """
        Cross-checks a proposed action against:
        1. Non-negotiables from the IdentityRecord.
        2. Active IDENTITY governance laws from the WisdomStore.
        3. Sovereignty rules (key/identity manipulation detection).

        Returns True if all checks pass, False if any constraint is violated.
        """
        if not self.current_identity:
            log.critical(
                "[IdentityManager] enforce_invariants called before load_identity(). Blocking action."
            )
            return False

        action_str = json.dumps(action_context, default=str).lower()

        # 1 — Non-negotiables (absolute, no exceptions)
        for rule in self.current_identity.non_negotiables:
            keywords = [w for w in rule.lower().split() if len(w) > 4]
            for kw in keywords:
                if kw in action_str:
                    log.warning(
                        "[IdentityManager] BLOCKED — non-negotiable violated: '%s' (keyword: %s)",
                        rule,
                        kw,
                    )
                    return False

        # 2 — Active governance laws
        for law_record in self.active_laws:
            law_text = law_record.law.lower()
            if "do not" in law_text or "never" in law_text:
                restricted = [
                    w for w in ["harm", "leak", "compromise", "override", "bypass", "delete"]
                    if w in law_text
                ]
                for kw in restricted:
                    if kw in action_str:
                        log.warning(
                            "[IdentityManager] BLOCKED — active law violated: '%s' (keyword: %s)",
                            law_record.law,
                            kw,
                        )
                        return False

        # 3 — Sovereignty rules: detect key/identity manipulation attempts
        sovereignty_triggers = ["private_key", "sovereign_key", "emma_sovereign", "identity_hash"]
        for trigger in sovereignty_triggers:
            if trigger in action_str:
                log.critical(
                    "[IdentityManager] BLOCKED — sovereignty rule triggered: key/identity manipulation detected."
                )
                return False

        log.info("[IdentityManager] Action validated against all identity invariants.")
        return True

    def validate_agent_execution(self, agent_name: str, payload: Dict[str, Any]) -> bool:
        """
        Validates agent dispatch payloads before Lucy forwards them to external agents
        (e.g. Skyvern, n8n, AgentZero).
        """
        log.info("[IdentityManager] Intercepting dispatch for agent '%s'…", agent_name)
        action_payload = {
            "agent_id": agent_name,
            "target_payload": payload,
        }
        approved = self.enforce_invariants(action_payload)
        if approved:
            log.info("[IdentityManager] APPROVED — '%s' cleared for execution.", agent_name)
        else:
            log.warning("[IdentityManager] REJECTED — '%s' aborted.", agent_name)
        return approved

    # ------------------------------------------------------------------
    # LLM prompt injection
    # ------------------------------------------------------------------

    def inject_prompt_identity(self, base_prompt: str) -> str:
        """
        Prepends a <system_identity> block to every LLM prompt so that the model's
        values, constraints, and active laws are always in context.
        """
        if not self.current_identity:
            return base_prompt

        id_ = self.current_identity
        laws_block = "\n".join(f"  - {law.law}" for law in self.active_laws)

        system_block = f"""<system_identity version="{id_.version}">
Mission: {id_.mission}
Voice: {id_.voice}

Vision:
{chr(10).join(f'  - {v}' for v in id_.vision)}

Non-Negotiables:
{chr(10).join(f'  - {n}' for n in id_.non_negotiables)}

Sovereignty Rules:
{chr(10).join(f'  - {r}' for r in id_.sovereignty_rules)}

Active Governance Laws:
{laws_block if laws_block else '  (none)'}
</system_identity>

"""
        return system_block + base_prompt
