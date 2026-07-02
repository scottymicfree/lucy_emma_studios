import sqlite3
import json
import time
from typing import Any, Optional

class PagedKVCache:
    """
    Paged KV Storage for context window management.
    """
    def __init__(self, db_path: str = "memory_kv.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''CREATE TABLE IF NOT EXISTS kv_cache (
                            key TEXT PRIMARY KEY,
                            value TEXT,
                            last_accessed REAL)''')
            conn.commit()

    def set(self, key: str, value: Any):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("INSERT OR REPLACE INTO kv_cache (key, value, last_accessed) VALUES (?, ?, ?)",
                         (key, json.dumps(value), time.time()))
            conn.commit()

    def get(self, key: str) -> Optional[Any]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT value FROM kv_cache WHERE key = ?", (key,))
            row = cursor.fetchone()
            if row:
                conn.execute("UPDATE kv_cache SET last_accessed = ? WHERE key = ?", (time.time(), key))
                conn.commit()
                return json.loads(row[0])
        return None

    def prune(self, max_entries: int = 1000):
        """Memory consolidation and pruning of least recently used entries."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT COUNT(*) FROM kv_cache")
            count = cursor.fetchone()[0]
            if count > max_entries:
                limit = count - max_entries
                conn.execute("DELETE FROM kv_cache WHERE key IN (SELECT key FROM kv_cache ORDER BY last_accessed ASC LIMIT ?)", (limit,))
                conn.commit()
