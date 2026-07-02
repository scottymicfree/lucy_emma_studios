"""
E.M.M.A. Sovereign Cryptographic Engine
Provides deterministic SHA-256 signing and verification for WisdomRecords.
In production, replace the HMAC stub with Ed25519 via a TPM or hardware enclave.
"""

import hashlib
import json
import os
from typing import Dict, Any

from .models import WisdomRecord


# Read sovereign root key from environment; never hardcode in production repos.
_SOVEREIGN_ROOT_KEY = os.environ.get("EMMA_SOVEREIGN_KEY", "EMMA_SOVEREIGN_ROOT_DEV")


class SecurityError(Exception):
    """Raised when a cryptographic integrity check fails on a WisdomRecord."""


class SovereignCryptoEngine:

    @staticmethod
    def compute_record_hash(record: WisdomRecord) -> str:
        """
        Generates a deterministic SHA-256 hash of a WisdomRecord's immutable fields.
        The `signature` field itself is excluded to prevent circular references.
        """
        payload: Dict[str, Any] = {
            "id":          record.id,
            "timestamp":   record.timestamp.isoformat(),
            "category":    record.category.value,
            "law":         record.law,
            "confidence":  round(record.confidence, 4),
            "source_hash": record.source_hash,
            "supersedes":  record.supersedes,
        }
        serialized = json.dumps(payload, sort_keys=True).encode("utf-8")
        return hashlib.sha256(serialized).hexdigest()

    @classmethod
    def sign_record(
        cls,
        record: WisdomRecord,
        private_key_stub: str = _SOVEREIGN_ROOT_KEY,
    ) -> str:
        """
        Signs the record payload with the sovereign root key.
        Format: `emma_v1_<sha256(record_hash:key)>`

        Production upgrade path:
          - Generate an Ed25519 keypair at first boot, store private key in TPM.
          - Replace this HMAC stub with `ed25519.sign(record_hash, private_key)`.
        """
        record_hash = cls.compute_record_hash(record)
        signed_manifest = hashlib.sha256(
            f"{record_hash}:{private_key_stub}".encode("utf-8")
        ).hexdigest()
        return f"emma_v1_{signed_manifest}"

    @classmethod
    def verify_record(cls, record: WisdomRecord) -> bool:
        """
        Validates that a WisdomRecord has not been tampered with or corrupted.
        Returns False if the signature is missing.
        Raises SecurityError if the signature is present but invalid.
        """
        if not record.signature:
            return False
        expected_sig = cls.sign_record(record)
        if record.signature != expected_sig:
            raise SecurityError(
                f"[SovereignCryptoEngine] Tamper detected on WisdomRecord '{record.id}'. "
                f"Expected: {expected_sig[:16]}… Got: {record.signature[:16]}…"
            )
        return True
