import os
import json
import sqlite3
import time
from typing import Dict, Any, List

class OmniverseDesignMemoryFabric:
    def __init__(self, mesh):
        self.mesh = mesh
        self.db_path = os.path.join(os.environ.get("LUCY_DB_DIR", "/tmp"), "emma_omniverse_design.db")
        self._init_db()
        self.blueprints = []
        self._load_memory()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS omniverse_blueprints (id TEXT PRIMARY KEY, data TEXT, timestamp REAL)''')
        conn.commit()
        conn.close()

    def _load_memory(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        for row in c.execute('SELECT id, data FROM omniverse_blueprints'):
            self.blueprints.append(json.loads(row[1]))
        conn.close()

    def store_blueprint(self, blueprint: Dict[str, Any]):
        blueprint_id = f"omni_design_{int(time.time())}"
        blueprint["id"] = blueprint_id
        self.blueprints.append(blueprint)
        
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("INSERT INTO omniverse_blueprints (id, data, timestamp) VALUES (?, ?, ?)", 
                  (blueprint_id, json.dumps(blueprint), time.time()))
        conn.commit()
        conn.close()
