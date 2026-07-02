import time
import threading
import json
from typing import Dict, Any, List
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

try:
    from engines.swarm.mesh_protocol import SwarmMeshEngine
    from engines.swarm.delegation import TaskDelegationEngine
    from engines.creative.collaboration import CreativeCollaborationProtocol
except ImportError:
    pass

class CreativeOrchestrator:
    def __init__(self, mesh, delegation):
        self.mesh = mesh
        self.delegation = delegation
        self.collaboration = CreativeCollaborationProtocol(mesh, delegation) if 'CreativeCollaborationProtocol' in globals() else None
        self.active_sessions = {}

    def launch_creative_session(self, topic: str, mode: str):
        session_id = f"creative_{int(time.time())}"
        self.active_sessions[session_id] = {"topic": topic, "mode": mode, "status": "brainstorming"}
        if self.collaboration:
            self.collaboration.start_collaboration(session_id, topic, mode)
        return session_id
