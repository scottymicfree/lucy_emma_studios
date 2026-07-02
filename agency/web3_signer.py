import os
from typing import Dict, Any

try:
    from web3 import Web3
    from eth_account import Account
    from eth_account.messages import encode_defunct, encode_typed_data
except ImportError:
    pass

class Web3Signer:
    """
    Web3 Agents Engine — Lucy's Sovereign Identity
    Local web3 wallet signing, agent-to-agent communication via crypto rails.
    """
    def __init__(self, private_key_store: str = "secure_keystore.txt"):
        self.keystore_path = private_key_store
        self.account = self._load_or_create_account()

    def _load_or_create_account(self):
        if os.path.exists(self.keystore_path):
            with open(self.keystore_path, "r") as f:
                key = f.read().strip()
                return Account.from_key(key)
        else:
            acct = Account.create()
            with open(self.keystore_path, "w") as f:
                f.write(acct.key.hex())
            return acct

    def sign_transaction(self, tx_payload: Dict[str, Any]) -> str:
        """Signs an on-chain transaction completely locally."""
        try:
            signed_tx = self.account.sign_transaction(tx_payload)
            return signed_tx.raw_transaction.hex() # type: ignore
        except Exception:
            return ""

    def sign_message(self, message: str) -> str:
        """Signs an arbitrary EIP-191 string message."""
        try:
            message_encoded = encode_defunct(text=message)
            signed_message = self.account.sign_message(message_encoded)
            return signed_message.signature.hex() # type: ignore
        except Exception:
            return ""

    def sign_typed_data(self, domain_data: Dict[str, Any], message_types: Dict[str, Any], message_data: Dict[str, Any]) -> str:
        """Signs EIP-712 structured data."""
        try:
            signable_message = encode_typed_data(domain_data, message_types, message_data)
            signed_message = self.account.sign_message(signable_message)
            return signed_message.signature.hex() # type: ignore
        except Exception:
            return ""

    def verify_agent_identity(self, peer_address: str, signature: str, original_message: str) -> bool:
        """Decentralized Identity Verification for agent-to-agent meshes."""
        try:
            message_encoded = encode_defunct(text=original_message)
            recovered_address = Account.recover_message(message_encoded, signature=signature)
            return recovered_address.lower() == peer_address.lower()
        except Exception:
            return False
