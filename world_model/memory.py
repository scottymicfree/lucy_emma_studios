import os
import json
import sqlite3
import time
from typing import Dict, Any, List

class WorldModelMemoryFabric:
    def __init__(self, mesh):
        self.mesh = mesh
        self.db_path = os.path.join(os.environ.get("LUCY_DB_DIR", "/tmp"), "emma_world_model.db")
        self._init_db()
        self.current_state = {}
        self._load_memory()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS entities (id TEXT PRIMARY KEY, state TEXT, updated_at REAL)''')
        c.execute('''CREATE TABLE IF NOT EXISTS snapshots (id TEXT PRIMARY KEY, snapshot TEXT, timestamp REAL)''')
        conn.commit()
        conn.close()

    def _load_memory(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        for row in c.execute('SELECT id, state FROM entities'):
            self.current_state[row[0]] = json.loads(row[1])
        conn.close()

    def update_entity_state(self, entity_id: str, state: Dict[str, Any]):
        self.current_state[entity_id] = state
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("INSERT OR REPLACE INTO entities (id, state, updated_at) VALUES (?, ?, ?)", 
                  (entity_id, json.dumps(state), time.time()))
        conn.commit()
        conn.close()

    def get_current_state(self) -> Dict[str, Any]:
        return self.current_state

    def create_snapshot(self) -> str:
        snapshot_id = f"snap_{int(time.time())}"
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("INSERT INTO snapshots (id, snapshot, timestamp) VALUES (?, ?, ?)", 
                  (snapshot_id, json.dumps(self.current_state), time.time()))
        conn.commit()
        conn.close()
        return snapshot_id
