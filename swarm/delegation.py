import json
import time
from typing import Dict, Any, List
from engines.swarm.mesh_protocol import SwarmMeshEngine
from engines.swarm.specialized_agents import BaseAgent, PlannerAgent

class TaskDelegationEngine:
    """
    Swarm-Wide Planning & Delegation.
    Handles swarm-level planning, multi-agent task decomposition, distributed task bidding,
    dynamic reassignment, and swarm-level progress tracking.
    """
    def __init__(self, mesh: SwarmMeshEngine):
        self.mesh = mesh
        self.active_tasks: Dict[str, Dict[str, Any]] = {}
        self.bids: Dict[str, List[Dict[str, Any]]] = {}
        self.task_dependencies: Dict[str, List[str]] = {}

    def swarm_level_plan(self, planner: PlannerAgent, high_level_goal: str) -> Dict[str, Any]:
        """Swarm-level planning engine that generates a graph of subtasks."""
        subtasks = planner.reason(high_level_goal)
        plan_id = f"plan_{int(time.time())}"
        
        # Build dependency graph (mock sequential for now)
        prev_task_id = None
        for idx, st in enumerate(subtasks):
            task_id = f"{plan_id}_sub_{idx}"
            self.task_dependencies[task_id] = [prev_task_id] if prev_task_id else []
            self.announce_task(task_id, st)
            prev_task_id = task_id
            
        return {"plan_id": plan_id, "subtasks": len(subtasks)}

    def decompose_task(self, planner: PlannerAgent, task_description: str) -> List[Dict[str, str]]:
        """Multi-agent task decomposition."""
        subtasks = planner.reason(task_description)
        return subtasks

    def announce_task(self, task_id: str, subtask: Dict[str, str]):
        self.bids[task_id] = []
        payload = {
            "action": "task_announcement",
            "task_id": task_id,
            "role_required": subtask.get("assigned_role"),
            "description": subtask.get("subtask")
        }
        self.mesh.broadcast_announcement(payload)

    def receive_bid(self, task_id: str, agent_id: str, node_ip: str, score: float):
        if task_id in self.bids:
            self.bids[task_id].append({
                "agent_id": agent_id,
                "node_ip": node_ip,
                "score": score
            })

    def assign_task(self, task_id: str) -> bool:
        if task_id not in self.bids or not self.bids[task_id]:
            return False
        
        best_bid = sorted(self.bids[task_id], key=lambda x: x["score"], reverse=True)[0]
        
        payload = {
            "action": "task_assignment",
            "task_id": task_id
        }
        success = self.mesh.send_message(best_bid["node_ip"], payload)
        if success:
            self.active_tasks[task_id] = {
                "assigned_to": best_bid["agent_id"],
                "node_ip": best_bid["node_ip"],
                "status": "in_progress",
                "start_time": time.time(),
                "retries": 0
            }
        return success

    def track_progress(self):
        """Swarm-level progress tracking and dynamic reassignment."""
        now = time.time()
        for task_id, info in list(self.active_tasks.items()):
            if info["status"] == "in_progress":
                if now - info["start_time"] > 60:
                    print(f"[Delegation] Task {task_id} timed out. Initiating dynamic reassignment...")
                    info["status"] = "failed"
                    self.dynamic_reassign(task_id)

    def dynamic_reassign(self, task_id: str):
        """Dynamic reassignment for failed or stalled tasks."""
        if task_id in self.active_tasks:
            retries = self.active_tasks[task_id].get("retries", 0)
            if retries > 3:
                print(f"[Delegation] Task {task_id} failed too many times. Aborting.")
                return
            
            # Remove previous assignee's bid to try someone else
            assigned_agent = self.active_tasks[task_id]["assigned_to"]
            self.bids[task_id] = [b for b in self.bids.get(task_id, []) if b["agent_id"] != assigned_agent]
            
            del self.active_tasks[task_id]
            
            # Reassign if bids exist, otherwise re-announce
            if self.bids[task_id]:
                self.assign_task(task_id)
                if task_id in self.active_tasks:
                    self.active_tasks[task_id]["retries"] = retries + 1
            else:
                print(f"[Delegation] No other bids for {task_id}. Re-announcing...")
                # In a real system, we fetch original subtask
                pass

    def mark_completed(self, task_id: str, result: str):
        if task_id in self.active_tasks:
            self.active_tasks[task_id]["status"] = "completed"
            self.active_tasks[task_id]["result"] = result
            
            # Check dependencies and trigger next tasks
            self._trigger_dependent_tasks(task_id)

    def _trigger_dependent_tasks(self, completed_task_id: str):
        """Unblocks downstream tasks in the swarm plan."""
        for tid, deps in self.task_dependencies.items():
            if completed_task_id in deps:
                deps.remove(completed_task_id)
                if not deps:
                    # All dependencies met, announce task if not already done
                    pass

