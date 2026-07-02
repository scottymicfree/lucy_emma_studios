import json
import time
from typing import Dict, Any, List

class CreativeCollaborationProtocol:
    def __init__(self, mesh, delegation):
        self.mesh = mesh
        self.delegation = delegation
        self.sessions = {}

    def start_collaboration(self, session_id: str, topic: str, mode: str):
        self.sessions[session_id] = {"topic": topic, "mode": mode, "contributions": []}
        
        task_id = f"{session_id}_brainstorm"
        subtask = {
            "subtask": f"Generate divergent concepts for {mode} about {topic}",
            "assigned_role": "concept_artist"
        }
        self.delegation.announce_task(task_id, subtask)

    def pass_idea(self, session_id: str, idea: str, target_role: str):
        task_id = f"{session_id}_refine_{int(time.time())}"
        subtask = {
            "subtask": f"Refine and expand upon this idea: {idea}",
            "assigned_role": target_role
        }
        self.delegation.announce_task(task_id, subtask)

    def resolve_conflict(self, ideas: List[str]) -> str:
        task_id = f"conflict_{int(time.time())}"
        subtask = {
            "subtask": f"Evaluate and select the best idea from: {json.dumps(ideas)}",
            "assigned_role": "critic"
        }
        self.delegation.announce_task(task_id, subtask)
        return task_id
