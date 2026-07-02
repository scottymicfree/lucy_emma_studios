import sqlite3
import os

DB_PATH = os.environ.get("LUCY_DB_DIR", "/tmp") + "/emma_history.db"

class HistoryDatabase:
    def __init__(self):
        self.conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self._init_schema()

    def _init_schema(self):
        cursor = self.conn.cursor()
        
        # History Timeseries Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS history_timeseries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                entity_id TEXT NOT NULL,
                domain TEXT NOT NULL,
                metric_name TEXT NOT NULL,
                value REAL,
                unit TEXT,
                source TEXT,
                quality_score REAL
            )
        ''')
        
        # History Events Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS history_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                entity_id TEXT NOT NULL,
                domain TEXT NOT NULL,
                event_name TEXT NOT NULL,
                description TEXT,
                tags TEXT
            )
        ''')

        # History Entities Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS history_entities (
                entity_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT
            )
        ''')
        
        # Create Indices
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_timeseries ON history_timeseries (domain, metric_name, entity_id, timestamp)')
        
        self.conn.commit()

    def get_connection(self):
        return self.conn
