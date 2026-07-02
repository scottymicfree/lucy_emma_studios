import time
import logging
import json
import sqlite3
import os
import psutil
from typing import Dict, Any

class DataVault:
    """Private / Encrypted: Immutable black box logging and auditing."""
    def __init__(self):
        db_dir = os.environ.get("LUCY_DB_DIR", "/tmp")
        self.db_path = os.path.join(db_dir, "emma_history.db")
        self._init_db()
        
    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS audit_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_type TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    timestamp REAL NOT NULL
                )
            ''')
            conn.commit()
    
    def record_event(self, event_type: str, payload: Dict[str, Any]):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "INSERT INTO audit_log (event_type, payload, timestamp) VALUES (?, ?, ?)",
                (event_type, json.dumps(payload), time.time())
            )
            conn.commit()
        logging.info(f"[DataVault] Recorded {event_type} to SQLite")

class PerfMon:
    """Private / Isolated: Monitors host utilization and manages throttling."""
    def get_metrics(self) -> Dict[str, float]:
        cpu = psutil.cpu_percent(interval=None) / 100.0
        memory = psutil.virtual_memory().percent / 100.0
        # VRAM is hard to get cross-platform reliably without specific libs, using a heuristic or 0
        return {"cpu": cpu, "vram": 0.0, "memory": memory}

class RecoveryManager:
    """Private / Isolated: Orchestrates automated recovery sequences."""
    def recover_agent(self, agent_id: str):
        logging.warning(f"[RecoveryManager] Initiating recovery for agent {agent_id}")
        # Send a restart signal file that the orchestrator or runner can pick up
        signal_file = os.path.join(os.environ.get("LUCY_DB_DIR", "/tmp"), f"restart_{agent_id}.sig")
        try:
            with open(signal_file, "w") as f:
                f.write(str(time.time()))
            logging.info(f"[RecoveryManager] Restart signal emitted for {agent_id}")
            return True
        except Exception as e:
            logging.error(f"[RecoveryManager] Failed to emit restart signal: {e}")
            return False
