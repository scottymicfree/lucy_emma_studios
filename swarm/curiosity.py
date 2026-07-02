import json
import time
import urllib.request
from typing import Dict, Any, List
from engines.swarm.mesh_protocol import SwarmMeshEngine
from engines.swarm.delegation import TaskDelegationEngine

class SwarmCuriosityEngine:
    """
    Swarm Curiosity & Exploration Engine.
    Implements curiosity scoring, exploration triggers, autonomous research cycles,
    and knowledge-gap detection.
    """
    def __init__(self, mesh: SwarmMeshEngine, delegation: TaskDelegationEngine, llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
        self.mesh = mesh
        self.delegation = delegation
        self.llama_endpoint = llama_endpoint
        self.knowledge_gaps: List[str] = []

    def _call_llama(self, system_prompt: str, user_prompt: str) -> str:
        data = {
            "model": "local-llama-3-8b-instruct",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "stream": False
        }
        req = urllib.request.Request(
            self.llama_endpoint, 
            data=json.dumps(data).encode('utf-8'), 
            headers={'Content-Type': 'application/json'}
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                result = json.loads(response.read().decode())
                return result['choices'][0]['message']['content']
        except Exception:
            return ""

    def detect_knowledge_gaps(self, recent_conversations: str):
        """Analyzes recent interactions to find concepts Lucy doesn't fully understand."""
        sys_prompt = "Analyze the conversation and list up to 3 concepts or facts the AI lacked knowledge of. Output strictly a JSON list of strings."
        response = self._call_llama(sys_prompt, recent_conversations)
        try:
            gaps = json.loads(response)
            if isinstance(gaps, list):
                for gap in gaps:
                    if gap not in self.knowledge_gaps:
                        self.knowledge_gaps.append(gap)
                        self._trigger_research(gap)
        except Exception:
            pass

    def calculate_curiosity_score(self, topic: str) -> float:
        """Scores a topic based on how little is known vs potential utility."""
        sys_prompt = "Score the curiosity value of this topic from 0.0 to 1.0 based on general usefulness for an AI agent. Output ONLY the float number."
        response = self._call_llama(sys_prompt, topic).strip()
        try:
            return float(response)
        except Exception:
            return 0.5

    def _trigger_research(self, topic: str):
        score = self.calculate_curiosity_score(topic)
        if score > 0.6:
            task_id = f"research_{int(time.time())}"
            subtask = {
                "subtask": f"Research knowledge gap: {topic}",
                "assigned_role": "researcher"
            }
            self.delegation.announce_task(task_id, subtask)
