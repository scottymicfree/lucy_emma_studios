import json
import time
from typing import Dict, Any, List
from engines.swarm.mesh_protocol import SwarmMeshEngine

class ResearchMemoryFabric:
    def __init__(self, mesh: SwarmMeshEngine):
        self.mesh = mesh
        self.research_channels: Dict[str, List[Dict[str, Any]]] = {}
        self.vector_storage: Dict[str, List[float]] = {}
        self.topic_index: Dict[str, List[str]] = {}
        self.archives: List[Dict[str, Any]] = []
        
        self.mesh.register_callback("research_sync", self._handle_research_sync)

    def store_finding(self, topic: str, finding: Dict[str, Any]):
        if topic not in self.research_channels:
            self.research_channels[topic] = []
        
        entry = {
            "timestamp": time.time(),
            "data": finding
        }
        self.research_channels[topic].append(entry)
        
        if topic not in self.topic_index:
            self.topic_index[topic] = []
        self.topic_index[topic].append(finding.get("summary", ""))
        
        self.mesh.broadcast_announcement({
            "action": "research_sync",
            "topic": topic,
            "entry": entry
        })

    def archive_report(self, report: Dict[str, Any]):
        self.archives.append(report)
        self.mesh.broadcast_announcement({
            "action": "research_archive",
            "report": report
        })

    def _handle_research_sync(self, msg: Dict[str, Any], source_ip: str):
        topic = msg.get("topic")
        entry = msg.get("entry")
        if topic and entry:
            if topic not in self.research_channels:
                self.research_channels[topic] = []
            self.research_channels[topic].append(entry)
