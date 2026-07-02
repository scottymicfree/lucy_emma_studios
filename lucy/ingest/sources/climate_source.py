from lucy.storage.schema import HistoryDatabase

class ClimateSourceETL:
    def __init__(self):
        self.db = HistoryDatabase()
        self.domain = "climate"

    def extract(self):
        print(f"[ClimateSourceETL] Extracting Climate datasets...")
        return [
            {"date": "2020-01-01", "entity": "Global", "metric": "co2_ppm", "value": 412.5, "unit": "PPM"},
            {"date": "2023-01-01", "entity": "Global", "metric": "co2_ppm", "value": 421.0, "unit": "PPM"}
        ]

    def transform(self, raw_data):
        print(f"[ClimateSourceETL] Transforming Climate datasets...")
        transformed = []
        for row in raw_data:
            transformed.append({
                "timestamp": row["date"],
                "entity_id": row["entity"],
                "domain": self.domain,
                "metric_name": row["metric"],
                "value": row["value"],
                "unit": row["unit"],
                "source": "NOAA",
                "quality_score": 0.99
            })
        return transformed

    def load(self, transformed_data):
        print(f"[ClimateSourceETL] Loading Climate datasets into history_timeseries...")
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
