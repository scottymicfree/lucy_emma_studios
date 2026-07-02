import datetime

class CreativeAuditTrail:
    """
    Logs every creative decision, entropy levels, divergence triggers,
    and reasoning chain checkpoints.
    """
    def __init__(self):
        self.logs = []

    def log_divergence(self, prompt: str, outcomes: list, resilience_status: str):
        entry = {
            "timestamp": str(datetime.datetime.now()),
            "action": "creative_divergence",
            "prompt": prompt,
            "branches_generated": len(outcomes),
            "avg_entropy": sum(o["entropy_level"] for o in outcomes) / len(outcomes) if outcomes else 0,
            "resilience_status": resilience_status
        }
        self.logs.append(entry)
        print(f"[CreativeAuditTrail] Logged divergence event: {entry['branches_generated']} branches.")

    def get_audit_trail(self):
        return self.logs
