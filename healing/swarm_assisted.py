import json
import time
from typing import Dict, Any, List

class SwarmAssistedHealing:
    def __init__(self, mesh, delegation):
        self.mesh = mesh
        self.delegation = delegation
        self.repair_votes: Dict[str, Dict[str, int]] = {}

    def propose_repair(self, anomaly: Dict[str, Any]) -> str:
        vote_id = f"vote_{int(time.time())}"
        self.repair_votes[vote_id] = {}
        
        task_id = f"diagnose_{vote_id}"
        subtask = {
            "subtask": f"Diagnose anomaly: {json.dumps(anomaly)}",
            "assigned_role": "critic"
        }
        self.delegation.announce_task(task_id, subtask)
        return vote_id

    def submit_vote(self, vote_id: str, strategy: str):
        if vote_id in self.repair_votes:
            if strategy not in self.repair_votes[vote_id]:
                self.repair_votes[vote_id][strategy] = 0
            self.repair_votes[vote_id][strategy] += 1

    def resolve_best_repair(self, vote_id: str) -> str:
        if vote_id not in self.repair_votes or not self.repair_votes[vote_id]:
            return "rollback"
            
        best_strategy = max(self.repair_votes[vote_id].items(), key=lambda x: x[1])[0]
        return best_strategy

    def validate_fix(self, fix_details: str) -> bool:
        task_id = f"validate_{int(time.time())}"
        subtask = {
            "subtask": f"Verify system stability after fix: {fix_details}",
            "assigned_role": "critic"
        }
        self.delegation.announce_task(task_id, subtask)
        return True
