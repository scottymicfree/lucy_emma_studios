"""
Builds hypergraph nodes + RAG docs + DAG priors.
"""
class HistoricalIndexer:
    def __init__(self):
        pass

    def index(self, historical_data: list):
        print("[HistoricalIndexer] Converting history to hypergraph + RAG + DAG priors.")
        indexed = {
            "hypergraph_nodes": [],
            "rag_docs": [],
            "dag_priors": []
        }
        for item in historical_data:
            indexed["hypergraph_nodes"].append({"node_id": hash(item["event"]), "data": item})
            indexed["rag_docs"].append(item["event"])
            indexed["dag_priors"].append({"prior": item["event"], "weight": 0.8})
        return indexed
