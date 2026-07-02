from lucy.storage.schema import HistoryDatabase

class AISourceETL:
    def __init__(self):
        self.db = HistoryDatabase()
        self.domain = "ai"

    def extract(self):
        print(f"[AISourceETL] Extracting AI datasets...")
        # Mocking extraction
        return [
            {"date": "2020-01-01", "entity": "US", "metric": "compute_flops", "value": 1e23, "unit": "FLOPs"},
            {"date": "2023-03-14", "entity": "US", "metric": "model_params", "value": 1e12, "unit": "Params"}
        ]

    def transform(self, raw_data):
        print(f"[AISourceETL] Transforming AI datasets...")
        transformed = []
        for row in raw_data:
            transformed.append({
                "timestamp": row["date"],
                "entity_id": row["entity"],
                "domain": self.domain,
                "metric_name": row["metric"],
                "value": row["value"],
                "unit": row["unit"],
                "source": "Public AI Timelines",
                "quality_score": 0.9
            })
        return transformed

    def load(self, transformed_data):
        print(f"[AISourceETL] Loading AI datasets into history_timeseries...")
        cursor = self.db.get_connection().cursor()
        for row in transformed_data:
            cursor.execute('''
                INSERT INTO history_timeseries (timestamp, entity_id, domain, metric_name, value, unit, source, quality_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (row["timestamp"], row["entity_id"], row["domain"], row["metric_name"], row["value"], row["unit"], row["source"], row["quality_score"]))
        self.db.get_connection().commit()

    def run(self):
        raw = self.extract()
        clean = self.transform(raw)
        self.load(clean)
