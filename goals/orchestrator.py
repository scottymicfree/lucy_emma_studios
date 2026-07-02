import time
import threading
from typing import Dict, Any, List

class GoalOrchestrator:
    def __init__(self, mesh, delegation, generation, prioritization, decomposition, execution, reflection):
        self.mesh = mesh
        self.delegation = delegation
        self.generation = generation
        self.prioritization = prioritization
        self.decomposition = decomposition
        self.execution = execution
        self.reflection = reflection
        self.running = False
        self.active_goals = {}

    def start(self):
        self.running = True
        threading.Thread(target=self._goal_loop, daemon=True).start()

    def stop(self):
        self.running = False

    def _goal_loop(self):
        while self.running:
            if len(self.active_goals) < 3:
                new_goals = self.generation.generate_goals()
                for goal in new_goals:
                    score = self.prioritization.score_goal(goal)
                    if score > 0.6:
                        goal_id = f"goal_{int(time.time())}_{id(goal)}"
                        self.active_goals[goal_id] = {
                            "data": goal,
                            "status": "planning",
                            "score": score
                        }
            
            for goal_id, goal_info in list(self.active_goals.items()):
                if goal_info["status"] == "planning":
                    plan = self.decomposition.decompose_goal(goal_info["data"])
                    if plan:
                        goal_info["plan"] = plan
                        goal_info["status"] = "executing"
                        self.execution.execute_plan(goal_id, plan)
                elif goal_info["status"] == "executing":
                    progress = self.execution.check_progress(goal_id)
                    if progress.get("completed"):
                        goal_info["status"] = "reflection"
                        self.reflection.reflect_on_goal(goal_info)
                        del self.active_goals[goal_id]
            time.sleep(300)
