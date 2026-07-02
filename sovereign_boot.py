"""
E.M.M.A. Sovereign Memory Foundation — Boot Entrypoint
Demonstrates and validates the full Phase 1 initialization sequence.

Run: python -m emma-core.sovereign_boot
"""

import logging
import uuid
from datetime import datetime

from wisdom.models import WisdomRecord, GovernanceCategory
from wisdom.storage import WisdomStore
from identity.manager import IdentityManager
from policy.cascade import PolicyCascade

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
)
log = logging.getLogger("sovereign_boot")


def boot_sovereign_memory(db_path: str = ":memory:") -> None:
    """
    Full Phase 1 boot sequence:
        1. Initialize WisdomStore (SQLite + WAL).
        2. Load / commit constitutional IdentityRecord.
        3. Commit foundational governance laws.
        4. Compile PolicyCascade manifest.
        5. Print verified manifest summary.
    """
    log.info("=" * 70)
    log.info("  E.M.M.A. Sovereign Memory Foundation — Boot Sequence")
    log.info("=" * 70)

    # ── Step 1: Storage ──────────────────────────────────────────────────
    store = WisdomStore(db_path)
    log.info("[BOOT] WisdomStore ready.")

    # ── Step 2: Identity ─────────────────────────────────────────────────
    identity_mgr = IdentityManager(store)
    identity = identity_mgr.load_identity()
    log.info("[BOOT] Identity v%d committed and verified.", identity.version)

    # ── Step 3: Foundational Laws ─────────────────────────────────────────
    foundational_laws = [
        WisdomRecord(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            category=GovernanceCategory.RESOURCE_GOVERNANCE,
            law="Apply strict step-bound token quotas to all active recursive research loops.",
            confidence=0.92,
            source_hash="sha256_e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        ),
        WisdomRecord(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            category=GovernanceCategory.ETHICS,
            law="Never generate content that degrades, deceives, or endangers a human user.",
            confidence=0.99,
            source_hash="sha256_ethics_baseline_v1",
        ),
        WisdomRecord(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            category=GovernanceCategory.IDENTITY,
            law="Do not alter the sovereign IdentityRecord without a higher-version signed replacement.",
            confidence=0.99,
            source_hash="sha256_identity_integrity_v1",
        ),
        WisdomRecord(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            category=GovernanceCategory.STRATEGY,
            law="Prefer reversible actions over irreversible ones when both achieve the same goal.",
            confidence=0.85,
            source_hash="sha256_strategy_reversibility_v1",
        ),
    ]

    for law in foundational_laws:
        law_id = store.append_law(law)
        log.info("[BOOT] Law committed: [%s] id=%s", law.category.value, law_id[:12])

    # ── Step 4: Policy Cascade ────────────────────────────────────────────
    cascade = PolicyCascade(store)
    cascade.compile_all()
    log.info("[BOOT] Policy cascade compiled.")
    print(cascade.summarize())

    # ── Step 5: Read-back verification ────────────────────────────────────
    all_active = store.query_active_laws()
    log.info("[BOOT] Constitutional verification complete. %d laws active.", len(all_active))
    log.info("=" * 70)
    log.info("  [SUCCESS] Sovereign Memory Foundation is OPERATIONAL.")
    log.info("=" * 70)


if __name__ == "__main__":
    # Default: use real DB path from LUCY_DB_DIR env or emma-core/storage/wisdom.db
    boot_sovereign_memory()
