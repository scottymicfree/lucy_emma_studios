import json
import time
from typing import Dict, Any, List
from engines.swarm.mesh_protocol import SwarmMeshEngine

class SwarmMemoryFabric:
    """
    Swarm Memory Fabric.
    Implements distributed vector memory, shared memory channels, agent-to-agent queries,
    memory synchronization, and a swarm-level knowledge graph.
    """
    def __init__(self, mesh: SwarmMeshEngine):
        self.mesh = mesh
        self.shared_channels: Dict[str, List[Dict[str, Any]]] = {
            "general": [],
            "research": [],
            "lessons": []
        }
        self.local_vectors: Dict[str, List[float]] = {}
        self.knowledge_graph: Dict[str, List[str]] = {} # Node -> [Edges]
        
        self.mesh.register_callback("memory_sync", self._handle_memory_sync)
        self.mesh.register_callback("memory_query", self._handle_memory_query)
        self.mesh.register_callback("kg_update", self._handle_kg_update)

    def publish_to_channel(self, channel: str, data: Dict[str, Any]):
        if channel not in self.shared_channels:
            self.shared_channels[channel] = []
        
        entry = {
            "timestamp": time.time(),
            "data": data
        }
        self.shared_channels[channel].append(entry)
        
        payload = {
            "action": "memory_sync",
            "channel": channel,
            "entry": entry
        }
        self.mesh.broadcast_announcement(payload)

    def add_to_knowledge_graph(self, entity1: str, relationship: str, entity2: str):
        """Updates the swarm-level knowledge graph."""
        edge = f"{relationship}:{entity2}"
        if entity1 not in self.knowledge_graph:
            self.knowledge_graph[entity1] = []
        
        if edge not in self.knowledge_graph[entity1]:
            self.knowledge_graph[entity1].append(edge)
            
            self.mesh.broadcast_announcement({
                "action": "kg_update",
                "e1": entity1,
                "rel": relationship,
                "e2": entity2
            })

    def _handle_kg_update(self, msg: Dict[str, Any], source_ip: str):
        e1 = msg.get("e1")
        rel = msg.get("rel")
        e2 = msg.get("e2")
        if e1 and rel and e2:
            edge = f"{rel}:{e2}"
            if e1 not in self.knowledge_graph:
                self.knowledge_graph[e1] = []
            if edge not in self.knowledge_graph[e1]:
                self.knowledge_graph[e1].append(edge)

    def _handle_memory_sync(self, msg: Dict[str, Any], source_ip: str):
        channel = msg.get("channel")
        entry = msg.get("entry")
        if channel and entry:
            if channel not in self.shared_channels:
                self.shared_channels[channel] = []
            self.shared_channels[channel].append(entry)

    def query_mesh_memory(self, query: str) -> List[Dict[str, Any]]:
        """Agent-to-agent memory query across the distributed fabric."""
        payload = {
            "action": "memory_query",
            "query": query,
            "requester_node": self.mesh.node_id
        }
        self.mesh.broadcast_announcement(payload)
        
        results = []
        for ch, entries in self.shared_channels.items():
            for e in entries:
                if query.lower() in json.dumps(e["data"]).lower():
                    results.append(e)
        return results

    def _handle_memory_query(self, msg: Dict[str, Any], source_ip: str):
        query = msg.get("query")
        results = []
        for ch, entries in self.shared_channels.items():
            for e in entries:
                if query.lower() in json.dumps(e["data"]).lower():
                    results.append(e)
        if results:
            reply = {
                "action": "memory_sync", 
                "channel": "query_results",
                "entry": {"query": query, "results": results}
            }
            self.mesh.send_message(source_ip, reply)
