from lucy.storage.schema import HistoryDatabase

class HistoricalQueryEngine:
    def __init__(self):
        self.db = HistoryDatabase()

    def query(self, domain: str, metric: str, entity_id: str, from_date: str, to_date: str, min_quality_score: float = 0.0):
        cursor = self.db.get_connection().cursor()
        
        query = '''
            SELECT timestamp, value, unit, source, quality_score
            FROM history_timeseries
            WHERE domain = ? AND metric_name = ? AND entity_id = ?
              AND timestamp >= ? AND timestamp <= ?
              AND quality_score >= ?
            ORDER BY timestamp ASC
        '''
        
        cursor.execute(query, (domain, metric, entity_id, from_date, to_date, min_quality_score))
        rows = cursor.fetchall()
        
        results = []
        for row in rows:
            results.append({
                "timestamp": row["timestamp"],
                "value": row["value"],
                "unit": row["unit"],
                "source": row["source"],
                "quality_score": row["quality_score"]
            })
            
        print(f"[HistoricalQuery] Found {len(results)} records for {domain}/{metric} in {entity_id}.")
        return results
