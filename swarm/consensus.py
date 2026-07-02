import json
from typing import Dict, Any, List

class SwarmConsensusEngine:
    """
    Group Decision Making.
    Implements consensus voting, conflict resolution, quorum rules,
    and weighted expertise scoring for the swarm.
    """
    def __init__(self):
        self.proposals: Dict[str, Dict[str, Any]] = {}
        self.votes: Dict[str, List[Dict[str, Any]]] = {}
        self.quorum_threshold = 0.6  # 60% of active agents must vote

    def submit_proposal(self, proposal_id: str, topic: str, content: str):
        self.proposals[proposal_id] = {
            "topic": topic,
            "content": content,
            "status": "open"
        }
        self.votes[proposal_id] = []

    def cast_vote(self, proposal_id: str, agent_id: str, expertise_weight: float, agree: bool, reasoning: str):
        if proposal_id in self.votes:
            self.votes[proposal_id].append({
                "agent_id": agent_id,
                "expertise_weight": expertise_weight,
                "agree": agree,
                "reasoning": reasoning
            })

    def resolve_consensus(self, proposal_id: str, active_agent_count: int) -> Dict[str, Any]:
        if proposal_id not in self.proposals or proposal_id not in self.votes:
            return {"status": "error", "reason": "Proposal not found"}
        
        votes = self.votes[proposal_id]
        if len(votes) / max(1, active_agent_count) < self.quorum_threshold:
            return {"status": "pending", "reason": "Quorum not reached"}
        
        total_weight = sum(v["expertise_weight"] for v in votes)
        if total_weight == 0:
            return {"status": "failed", "reason": "No weighted votes"}

        agree_weight = sum(v["expertise_weight"] for v in votes if v["agree"])
        disagree_weight = sum(v["expertise_weight"] for v in votes if not v["agree"])

        result = "approved" if agree_weight > disagree_weight else "rejected"
        
        # Conflict resolution logging
        if abs(agree_weight - disagree_weight) / total_weight < 0.2:
            conflict_log = "Close vote. " + " | ".join([f"{v['agent_id']}: {v['reasoning']}" for v in votes])
        else:
            conflict_log = "Clear consensus."

        self.proposals[proposal_id]["status"] = result
        
        return {
            "status": result,
            "agree_weight": agree_weight,
            "disagree_weight": disagree_weight,
            "conflict_log": conflict_log
        }
