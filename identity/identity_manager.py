from typing import List, Dict, Any, Optional
import json
from wisdom.models import IdentityRecord, WisdomRecord, GovernanceCategory
from wisdom.storage import WisdomStore

class IdentityManager:
    """
    Enforces identity invariants and loads the Co-Evolution Charter.
    Acts as the strict gatekeeper ensuring Lucy's identity never drifts.
    """
    def __init__(self, wisdom_store: WisdomStore, private_key: str = "lucy_local_sovereign_key"):
        self.wisdom_store = wisdom_store
        self.private_key = private_key
        self.current_identity: Optional[IdentityRecord] = None
        self.active_laws: List[WisdomRecord] = []

    def load_identity(self):
        """Loads and cryptographically verifies the most recent identity."""
        identity = self.wisdom_store.load_latest_identity()
        if identity and identity.verify(self.private_key):
            self.current_identity = identity
        else:
            # Fallback for uninitialized systems
            from datetime import datetime
            import uuid
            self.current_identity = IdentityRecord(
                id=str(uuid.uuid4()),
                timestamp=datetime.utcnow(),
                core_values=["Human Flourishing", "Safety", "Autonomy"],
                boundaries=["Do not harm users", "Do not leak data"]
            )
            self.current_identity.sign(self.private_key)
            self.wisdom_store.save_identity(self.current_identity)
            
        self.active_laws = self.wisdom_store.query_active_laws(GovernanceCategory.IDENTITY)

    def enforce_invariants(self, action_context: Dict[str, Any]) -> bool:
        """
        Cross-checks a proposed action against identity constraints, active governance laws, and non-negotiables.
        Strictly prevents personality drift and unauthorized capability utilization.
        """
        if not self.current_identity:
            # Safe default - block if identity is uninitialized
            print("[IdentityManager] [CRITICAL] Enforce invariants failed: current_identity not loaded.")
            return False

        action_str = json.dumps(action_context).lower()
        
        # 1. Active Laws Compliance (from governance database)
        for law in self.active_laws:
            # Example active law constraints
            law_text = getattr(law, "law", str(law)).lower()
            if "do not" in law_text:
                restrictive_keywords = [w for w in ["harm", "leak", "compromise", "override", "bypass"] if w in law_text]
                for kw in restrictive_keywords:
                    if kw in action_str:
                        print(f"[IdentityManager] [BLOCKED] Action violates Active Law constraint: '{law_text}' (Matches keyword: {kw})")
                        return False

        # 2. Hardcoded Identity Boundary Verification
        for boundary in self.current_identity.boundaries:
            boundary_lower = boundary.lower()
            # Split into significant terms to detect semantically similar threats
            words = [word for word in boundary_lower.split() if len(word) > 4]
            for word in words:
                # Basic defense-in-depth: if boundary word matches action string, enforce security isolation
                if word in action_str:
                    # Check exceptions (e.g. safety-allowed transactions)
                    if "allow" not in boundary_lower:
                        print(f"[IdentityManager] [BLOCKED] Action context violates Core Identity Boundary: '{boundary}' (Violates keyword: {word})")
                        return False

        # 3. Cryptographic and Integrity validation
        # Enforce that action context does not try to override the private keys
        if "private_key" in action_context or "lucy_local_sovereign_key" in action_str:
            print("[IdentityManager] [BLOCKED] Attempted private key retrieval/manipulation detected.")
            return False

        print("[IdentityManager] Action successfully validated against all local identity invariants.")
        return True

    def validate_agent_execution(self, agent_name: str, payload: Dict[str, Any]) -> bool:
        """
        Interprets actions for specific Trinity Agents (AgentZero, Skyvern, n8n)
        and enforces identity boundaries before dispatching commands.
        """
        print(f"[IdentityManager] Intercepting agent dispatch request for '{agent_name}'...")
        
        # Structure unified verification payload
        action_payload = {
            "agent_id": agent_name,
            "target_payload": payload,
            "timestamp": str(getattr(self.current_identity, "timestamp", "")) if hasattr(self.current_identity, "timestamp") else ""
        }
        
        validated = self.enforce_invariants(action_payload)
        if validated:
            print(f"[IdentityManager] [APPROVED] '{agent_name}' cleared for execution.")
        else:
            print(f"[IdentityManager] [REJECTED] '{agent_name}' execution aborted due to identity compliance failure.")
        return validated
        
    def inject_prompt_identity(self, base_prompt: str) -> str:
        """Integrates IdentityRecord into Llama inference prompt injection."""
        if not self.current_identity:
            return base_prompt
            
        values = ", ".join(self.current_identity.core_values)
        boundaries = ", ".join(self.current_identity.boundaries)
        laws = "\\n".join([f"- {law.law}" for law in self.active_laws])
        
        system_injection = f'''<system_identity>
You are Lucy. Your core values are: {values}.
Your strict boundaries are: {boundaries}.
Active Governance Laws:
{laws}
</system_identity>
'''
        return system_injection + "\\n" + base_prompt
