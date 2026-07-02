from lucy.storage.schema import HistoryDatabase

class EconomySourceETL:
    def __init__(self):
        self.db = HistoryDatabase()
        self.domain = "economy"

    def extract(self):
        print(f"[EconomySourceETL] Extracting Economy datasets...")
        return [
            {"date": "2022-01-01", "entity": "EU", "metric": "gdp", "value": 16.6, "unit": "Trillion USD"},
            {"date": "2023-01-01", "entity": "China", "metric": "gdp", "value": 17.7, "unit": "Trillion USD"}
        ]

    def transform(self, raw_data):
        print(f"[EconomySourceETL] Transforming Economy datasets...")
        transformed = []
        for row in raw_data:
            transformed.append({
                "timestamp": row["date"],
                "entity_id": row["entity"],
                "domain": self.domain,
                "metric_name": row["metric"],
                "value": row["value"],
                "unit": row["unit"],
                "source": "World Bank",
                "quality_score": 0.95
            })
        return transformed

    def load(self, transformed_data):
        print(f"[EconomySourceETL] Loading Economy datasets into history_timeseries...")
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
