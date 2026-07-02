"""
E.M.M.A. Sovereign Storage Engine — WisdomStore
Manages the physical wisdom.db ledger using an append-only transaction model.
Records are cryptographically signed on write and verified on read.
WAL mode is enabled for high-concurrency robustness.
"""

import os
import sqlite3
import json
import logging
from datetime import datetime
from typing import List, Optional

from .models import (
    WisdomRecord,
    IdentityRecord,
    GovernanceCategory,
    RecordStatus,
)
from .crypto import SovereignCryptoEngine, SecurityError

log = logging.getLogger(__name__)


def _default_db_path() -> str:
    db_dir = os.environ.get("LUCY_DB_DIR", "emma-core/storage")
    os.makedirs(db_dir, exist_ok=True)
    return os.path.join(db_dir, "wisdom.db")


class WisdomStore:
    """
    Persistent, cryptographically-secured storage for E.M.M.A.'s constitutional memory.

    Guarantees:
    - Append-only: records are never UPDATE'd; supersession marks old rows SUPERSEDED.
    - Crypto-verified: every record is SHA-256 signed on write; verified on read.
    - WAL journaling: safe for concurrent reads from multiple agents.
    - Tamper-evident: any corruption raises SecurityError at read time.
    """

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or _default_db_path()
        self._initialize_db()

    # ------------------------------------------------------------------
    # Schema bootstrap
    # ------------------------------------------------------------------

    def _initialize_db(self) -> None:
        with sqlite3.connect(self.db_path) as conn:
            # WAL for concurrent multi-agent access
            conn.execute("PRAGMA journal_mode = WAL")
            conn.execute("PRAGMA foreign_keys = ON")

            conn.execute("""
                CREATE TABLE IF NOT EXISTS wisdom_records (
                    id          TEXT PRIMARY KEY,
                    timestamp   TEXT NOT NULL,
                    category    TEXT NOT NULL,
                    law         TEXT NOT NULL,
                    confidence  REAL NOT NULL,
                    source_hash TEXT NOT NULL,
                    status      TEXT NOT NULL DEFAULT 'ACTIVE',
                    supersedes  TEXT,
                    signature   TEXT NOT NULL
                )
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS identity_records (
                    id                TEXT PRIMARY KEY,
                    version           INTEGER NOT NULL,
                    timestamp         TEXT NOT NULL,
                    mission           TEXT NOT NULL,
                    vision            TEXT NOT NULL,
                    constraints       TEXT NOT NULL,
                    voice             TEXT NOT NULL,
                    non_negotiables   TEXT NOT NULL,
                    sovereignty_rules TEXT NOT NULL,
                    identity_hash     TEXT NOT NULL
                )
            """)

            conn.commit()
        log.info("[WisdomStore] Storage engine initialized at: %s", self.db_path)

    # ------------------------------------------------------------------
    # Wisdom (law) operations — append-only
    # ------------------------------------------------------------------

    def append_law(self, record: WisdomRecord) -> str:
        """
        Signs and appends a new constitutional law to the ledger.
        If record.supersedes is set, the prior record is marked SUPERSEDED
        (no rows are ever deleted or mutated beyond this status flag).
        Returns the new record's id.
        """
        # Sign before writing
        record.signature = SovereignCryptoEngine.sign_record(record)

        with sqlite3.connect(self.db_path) as conn:
            conn.execute("PRAGMA journal_mode = WAL")

            if record.supersedes:
                # Mark the superseded record — this is the ONLY permitted mutation
                conn.execute(
                    "UPDATE wisdom_records SET status = ? WHERE id = ?",
                    (RecordStatus.SUPERSEDED.value, record.supersedes),
                )
                log.info("[WisdomStore] Record %s superseded by %s", record.supersedes, record.id)

            conn.execute(
                """
                INSERT INTO wisdom_records
                    (id, timestamp, category, law, confidence, source_hash, status, supersedes, signature)
                VALUES
                    (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record.id,
                    record.timestamp.isoformat(),
                    record.category.value,
                    record.law,
                    record.confidence,
                    record.source_hash,
                    record.status.value,
                    record.supersedes,
                    record.signature,
                ),
            )
            conn.commit()

        log.info("[WisdomStore] Law committed: [%s] %s (id=%s)", record.category.value, record.law[:60], record.id)
        return record.id

    def query_active_laws(
        self,
        category: Optional[GovernanceCategory] = None,
    ) -> List[WisdomRecord]:
        """
        Retrieves all ACTIVE laws, optionally filtered by category.
        Each record is cryptographically verified on retrieval.
        Raises SecurityError if any record fails integrity validation.
        """
        query = "SELECT id, timestamp, category, law, confidence, source_hash, status, supersedes, signature FROM wisdom_records WHERE status = 'ACTIVE'"
        params: list = []
        if category:
            query += " AND category = ?"
            params.append(category.value)
        query += " ORDER BY timestamp ASC"

        records: List[WisdomRecord] = []
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(query, params)
            for row in cursor.fetchall():
                record = WisdomRecord(
                    id=row[0],
                    timestamp=datetime.fromisoformat(row[1]),
                    category=GovernanceCategory(row[2]),
                    law=row[3],
                    confidence=row[4],
                    source_hash=row[5],
                    status=RecordStatus(row[6]),
                    supersedes=row[7],
                    signature=row[8],
                )
                # Enforce cryptographic barrier on every read
                if not SovereignCryptoEngine.verify_record(record):
                    raise SecurityError(
                        f"[WisdomStore] CRITICAL: Integrity failure on WisdomRecord {record.id}. "
                        "Constitutional memory may be compromised."
                    )
                records.append(record)

        log.info("[WisdomStore] Loaded %d active laws (category=%s)", len(records), category)
        return records

    # ------------------------------------------------------------------
    # Identity operations
    # ------------------------------------------------------------------

    def save_identity(self, record: IdentityRecord) -> None:
        """Persists an IdentityRecord to the ledger."""
        identity_hash = record.compute_hash()
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("PRAGMA journal_mode = WAL")
            conn.execute(
                """
                INSERT OR REPLACE INTO identity_records
                    (id, version, timestamp, mission, vision, constraints, voice,
                     non_negotiables, sovereignty_rules, identity_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    # Use version as synthetic ID for upsert on version key
                    f"identity_v{record.version}",
                    record.version,
                    record.timestamp.isoformat(),
                    record.mission,
                    json.dumps(record.vision),
                    json.dumps(record.constraints),
                    record.voice,
                    json.dumps(record.non_negotiables),
                    json.dumps(record.sovereignty_rules),
                    identity_hash,
                ),
            )
            conn.commit()
        log.info("[WisdomStore] Identity v%d committed (hash=%s…)", record.version, identity_hash[:12])

    def load_latest_identity(self) -> Optional[IdentityRecord]:
        """Loads the highest-version IdentityRecord and validates its hash."""
        with sqlite3.connect(self.db_path) as conn:
            row = conn.execute(
                """
                SELECT version, timestamp, mission, vision, constraints, voice,
                       non_negotiables, sovereignty_rules, identity_hash
                FROM identity_records
                ORDER BY version DESC LIMIT 1
                """
            ).fetchone()

        if not row:
            return None

        record = IdentityRecord(
            version=row[0],
            timestamp=datetime.fromisoformat(row[1]),
            mission=row[2],
            vision=json.loads(row[3]),
            constraints=json.loads(row[4]),
            voice=row[5],
            non_negotiables=json.loads(row[6]),
            sovereignty_rules=json.loads(row[7]),
        )

        # Validate hash integrity
        stored_hash = row[8]
        computed_hash = record.compute_hash()
        if stored_hash != computed_hash:
            raise SecurityError(
                f"[WisdomStore] CRITICAL: IdentityRecord v{record.version} hash mismatch. "
                f"Stored={stored_hash[:12]}… Computed={computed_hash[:12]}…"
            )

        log.info("[WisdomStore] Identity v%d verified and loaded.", record.version)
        return record
