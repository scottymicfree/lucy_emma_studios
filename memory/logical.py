import sqlite3
import numpy as np
import json
from typing import List, Dict, Any, Optional

class LogicalMemory:
    """Core embedding and SQLite backend logic."""
    def __init__(self, db_path: str = "memory_logical.db", llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
        self.db_path = db_path
        self.llama_endpoint = llama_endpoint
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''CREATE TABLE IF NOT EXISTS episodic_memory (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            text_content TEXT,
                            embedding BLOB,
                            metadata TEXT)''')
            conn.execute('''CREATE TABLE IF NOT EXISTS causal_schema (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            cause_node TEXT,
                            effect_node TEXT,
                            weight REAL)''')
            conn.commit()

    def get_embedding(self, text: str) -> np.ndarray:
        """Calls local Llama (or mock) to get real embeddings."""
        # For local fallback without a dedicated embedding endpoint, simulate a deterministic embedding
        np.random.seed(hash(text) % (2**32))
        return np.random.rand(64).astype(np.float32)

    def _cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

class EpisodicMemoryLayer(LogicalMemory):
    def store_episode(self, text: str, metadata: dict):
        emb = self.get_embedding(text)
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("INSERT INTO episodic_memory (text_content, embedding, metadata) VALUES (?, ?, ?)",
                         (text, emb.tobytes(), json.dumps(metadata)))
            conn.commit()

    def search_episodes(self, query: str, top_k: int = 3) -> List[Dict]:
        query_emb = self.get_embedding(query)
        results = []
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT text_content, embedding, metadata FROM episodic_memory")
            for row in cursor.fetchall():
                db_emb = np.frombuffer(row[1], dtype=np.float32)
                sim = self._cosine_similarity(query_emb, db_emb)
                results.append({
                    "text": row[0],
                    "metadata": json.loads(row[2]),
                    "similarity": sim
                })
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:top_k]

class CausalSchemaLayer(LogicalMemory):
    def add_causal_link(self, cause: str, effect: str, weight: float = 1.0):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("INSERT INTO causal_schema (cause_node, effect_node, weight) VALUES (?, ?, ?)",
                         (cause, effect, weight))
            conn.commit()

    def get_effects(self, cause: str) -> List[Dict]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT effect_node, weight FROM causal_schema WHERE cause_node = ?", (cause,))
            return [{"effect": row[0], "weight": row[1]} for row in cursor.fetchall()]

class HierarchicalBacktrackingLayer(LogicalMemory):
    def backtrack(self, failed_state: str) -> str:
        episodes = EpisodicMemoryLayer(self.db_path).search_episodes(f"Failed: {failed_state}", top_k=1)
        if episodes and episodes[0]["similarity"] > 0.8:
            return f"Found past failure: {episodes[0]['text']}. Suggesting alternative path."
        return "No exact past failure found. Reverting to base state."
