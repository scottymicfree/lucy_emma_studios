import json
import sqlite3
import os
from typing import Dict, Any, List

class GraphMemoryFabric:
    def __init__(self, mesh):
        self.mesh = mesh
        self.db_path = os.path.join(os.environ.get("LUCY_DB_DIR", "/tmp"), "emma_knowledge_graph.db")
        self._init_db()
        self.nodes = set()
        self.edges = []
        self._load_memory()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS nodes (id TEXT PRIMARY KEY, type TEXT, vector TEXT)''')
        c.execute('''CREATE TABLE IF NOT EXISTS edges (source TEXT, target TEXT, relation TEXT, confidence REAL)''')
        conn.commit()
        conn.close()
        
    def _load_memory(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        for row in c.execute('SELECT id FROM nodes'):
            self.nodes.add(row[0])
        for row in c.execute('SELECT source, target, relation, confidence FROM edges'):
            self.edges.append({"source": row[0], "target": row[1], "relation": row[2], "confidence": row[3]})
        conn.close()

    def add_node(self, node_id: str, node_type: str = "concept"):
        if node_id not in self.nodes:
            self.nodes.add(node_id)
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute("INSERT OR IGNORE INTO nodes (id, type, vector) VALUES (?, ?, ?)", (node_id, node_type, "[]"))
            conn.commit()
            conn.close()

    def add_edge(self, source: str, target: str, relation: str, confidence: float = 1.0):
        self.add_node(source)
        self.add_node(target)
        edge = {"source": source, "target": target, "relation": relation, "confidence": confidence}
        if edge not in self.edges:
            self.edges.append(edge)
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute("INSERT INTO edges (source, target, relation, confidence) VALUES (?, ?, ?, ?)", (source, target, relation, confidence))
            conn.commit()
            conn.close()

    def remove_edge(self, source: str, target: str, relation: str):
        self.edges = [e for e in self.edges if not (e["source"] == source and e["target"] == target and e["relation"] == relation)]
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("DELETE FROM edges WHERE source=? AND target=? AND relation=?", (source, target, relation))
        conn.commit()
        conn.close()

    def find_path(self, start: str, target: str) -> List[Dict[str, Any]]:
        path = []
        for e in self.edges:
            if e["source"] == start:
                if e["target"] == target:
                    return [e]
                for e2 in self.edges:
                    if e2["source"] == e["target"] and e2["target"] == target:
                        return [e, e2]
        return path

    def get_neighborhood(self, node: str, depth: int = 1) -> List[Dict[str, Any]]:
        neighbors = []
        for e in self.edges:
            if e["source"] == node or e["target"] == node:
                neighbors.append(e)
        return neighbors
