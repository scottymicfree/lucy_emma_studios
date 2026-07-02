from typing import Dict, Any, List

class GoalExecutionEngine:
    def __init__(self, mesh, delegation):
        self.mesh = mesh
        self.delegation = delegation
        self.active_plans = {}

    def execute_plan(self, goal_id: str, plan: List[Dict[str, Any]]):
        self.active_plans[goal_id] = {
            "tasks": plan,
            "completed_tasks": 0,
            "total_tasks": len(plan)
        }
        for idx, task in enumerate(plan):
            task_id = f"{goal_id}_task_{idx}"
            self.delegation.announce_task(task_id, task)

    def check_progress(self, goal_id: str) -> Dict[str, Any]:
        if goal_id not in self.active_plans:
            return {"completed": False, "progress": 0.0}
            
        plan = self.active_plans[goal_id]
        plan["completed_tasks"] += 0.1 
        
        is_complete = plan["completed_tasks"] >= plan["total_tasks"]
        return {
            "completed": is_complete,
            "progress": min(1.0, plan["completed_tasks"] / plan["total_tasks"])
        }
