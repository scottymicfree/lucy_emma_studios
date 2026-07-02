"""
E.M.M.A. Sovereign Memory Foundation — Domain Models
Type-safe, immutable primitives for E.M.M.A.'s constitutional consciousness layer.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
import hashlib
import json


class GovernanceCategory(Enum):
    IDENTITY           = "IDENTITY"
    STRATEGY           = "STRATEGY"
    ETHICS             = "ETHICS"
    RESOURCE_GOVERNANCE = "RESOURCE_GOVERNANCE"


class RecordStatus(Enum):
    ACTIVE     = "ACTIVE"
    DEPRECATED = "DEPRECATED"
    SUPERSEDED = "SUPERSEDED"


@dataclass(frozen=True)
class IdentityRecord:
    """
    The immutable constitutional core of E.M.M.A.'s existential boundaries.
    Loaded at boot from the sovereign ledger. Cannot be modified in-place.
    """
    version: int
    timestamp: datetime
    mission: str
    vision: List[str]
    constraints: List[str]
    voice: str
    non_negotiables: List[str]
    sovereignty_rules: List[str]

    def compute_hash(self) -> str:
        payload = json.dumps({
            "version": self.version,
            "timestamp": self.timestamp.isoformat(),
            "mission": self.mission,
            "vision": self.vision,
            "constraints": self.constraints,
            "voice": self.voice,
            "non_negotiables": self.non_negotiables,
            "sovereignty_rules": self.sovereignty_rules,
        }, sort_keys=True)
        return hashlib.sha256(payload.encode()).hexdigest()


@dataclass
class WisdomRecord:
    """
    A persistent meta-cognitive truth derived from operational experience.
    Append-only: records are never mutated, only superseded.
    """
    id: str
    timestamp: datetime
    category: GovernanceCategory
    law: str
    confidence: float
    source_hash: str
    status: RecordStatus = RecordStatus.ACTIVE
    supersedes: Optional[str] = None
    signature: Optional[str] = None   # Self-signed integrity block

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat(),
            "category": self.category.value,
            "law": self.law,
            "confidence": self.confidence,
            "source_hash": self.source_hash,
            "status": self.status.value,
            "supersedes": self.supersedes,
            "signature": self.signature,
        }


@dataclass(frozen=True)
class PolicyRecord:
    """
    An operational target manifest compiled from WisdomRecords for the Lucy Kernel.
    Read by the policy cascade to enforce runtime governance.
    """
    name: str
    source_wisdom_id: str
    confidence_threshold: float
    enforcement_rules: Dict[str, Any]
    compiled_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "source_wisdom_id": self.source_wisdom_id,
            "confidence_threshold": self.confidence_threshold,
            "enforcement_rules": self.enforcement_rules,
            "compiled_at": self.compiled_at.isoformat(),
        }
