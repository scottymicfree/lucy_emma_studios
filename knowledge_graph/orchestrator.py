import time
import threading
from typing import Dict, Any, List

class KnowledgeGraphOrchestrator:
    def __init__(self, mesh, entity_engine, relation_engine, reasoning, memory, update, autonomy, visualization, predictive):
        self.mesh = mesh
        self.entity_engine = entity_engine
        self.relation_engine = relation_engine
        self.reasoning = reasoning
        self.memory = memory
        self.update = update
        self.autonomy = autonomy
        self.visualization = visualization
        self.predictive = predictive
        self.running = False
        
        self.mesh.register_callback("raw_data_ingest", self._handle_data_ingest)

    def start(self):
        self.running = True
        threading.Thread(target=self._graph_loop, daemon=True).start()

    def stop(self):
        self.running = False

    def _graph_loop(self):
        while self.running:
            self._build_cycle()
            self._revision_cycle()
            time.sleep(3600)

    def _build_cycle(self):
        hypotheses = self.predictive.generate_hypotheses(self.memory.nodes, self.memory.edges)
        for h in hypotheses:
            self.mesh.broadcast_announcement({
                "action": "test_hypothesis",
                "hypothesis": h
            })

    def _revision_cycle(self):
        updates = self.update.detect_outdated_knowledge(self.memory.nodes, self.memory.edges)
        for u in updates:
            self.memory.remove_edge(u["source"], u["target"], u["relation"])
            
    def _handle_data_ingest(self, msg: Dict[str, Any], source_ip: str):
        data = msg.get("data", "")
        entities = self.entity_engine.extract_entities(data)
        for e in entities:
            self.memory.add_node(e)
            
        relations = self.relation_engine.extract_relationships(entities, data)
        for r in relations:
            self.memory.add_edge(r["source"], r["target"], r["relation"], r.get("confidence", 1.0))
            
        self.mesh.broadcast_announcement({
            "action": "graph_updated",
            "timestamp": time.time()
        })
