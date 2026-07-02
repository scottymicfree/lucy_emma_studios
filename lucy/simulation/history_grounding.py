"""
Injects historical anchors into simulation DAG.
"""
from lucy.history.query import HistoricalQueryEngine

class HistoryGrounding:
    def __init__(self):
        self.query_engine = HistoricalQueryEngine()

    def inject_anchors(self, simulation_dag: dict, aligned_history: dict):
        print("[HistoryGrounding] Injecting historical anchors into simulation DAG.")
        simulation_dag["historical_anchors"] = aligned_history.get("aligned_sequences", [])
        return simulation_dag
        
    def fetch_priors(self, domain: str, metric: str, entity_id: str, from_date: str, to_date: str):
        print(f"[HistoryGrounding] Fetching priors for {domain} simulation ({metric} in {entity_id})...")
        results = self.query_engine.query(domain, metric, entity_id, from_date, to_date)
        return results
