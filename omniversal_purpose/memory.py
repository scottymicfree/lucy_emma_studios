import os
import json
import sqlite3
import time
from typing import Dict, Any, List

class PurposeMemoryFabric:
    def __init__(self, mesh):
        self.mesh = mesh
        self.db_path = os.path.join(os.environ.get("LUCY_DB_DIR", "/tmp"), "emma_omniversal_purpose.db")
        self._init_db()
        self.current_state = {
            "active_purposes": [],
            "future_needs": {},
            "reflection": {},
            "timestamp": time.time()
        }
        self._load_memory()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS purpose_state (id TEXT PRIMARY KEY, state TEXT, updated_at REAL)''')
        c.execute('''CREATE TABLE IF NOT EXISTS purpose_history (id TEXT PRIMARY KEY, state TEXT, timestamp REAL)''')
        conn.commit()
        conn.close()

    def _load_memory(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        row = c.execute('SELECT state FROM purpose_state WHERE id="current"').fetchone()
        if row:
            self.current_state = json.loads(row[0])
        conn.close()

    def update_purpose_state(self, state: Dict[str, Any]):
        self.current_state = state
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("INSERT OR REPLACE INTO purpose_state (id, state, updated_at) VALUES (?, ?, ?)", 
                  ("current", json.dumps(state), time.time()))
        
        hist_id = f"purp_{int(time.time())}"
        c.execute("INSERT INTO purpose_history (id, state, timestamp) VALUES (?, ?, ?)", 
                  (hist_id, json.dumps(state), time.time()))
        
        conn.commit()
        conn.close()

    def get_current_purpose_state(self) -> Dict[str, Any]:
        return self.current_state
