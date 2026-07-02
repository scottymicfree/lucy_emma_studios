class HypergraphBuilder:
    def __init__(self):
        pass

    def build_graph(self, timeseries_data, events_data):
        print("[HypergraphBuilder] Building causal hypergraph from history...")
        nodes = []
        edges = []
        
        for ts in timeseries_data:
            node_id = f"ts_{ts.get('entity_id')}_{ts.get('metric_name')}_{ts.get('timestamp')}"
            nodes.append({"id": node_id, "type": "metric", "data": ts})
            
        for event in events_data:
            node_id = f"evt_{event.get('entity_id')}_{event.get('event_name')}_{event.get('timestamp')}"
            nodes.append({"id": node_id, "type": "event", "data": event})
            
        # Example naive edge generation linking events to metrics in same year
        for evt in events_data:
            evt_year = evt['timestamp'][:4]
            for ts in timeseries_data:
                if ts['timestamp'].startswith(evt_year) and ts['entity_id'] == evt['entity_id']:
                    edges.append({
                        "source": f"evt_{evt.get('entity_id')}_{evt.get('event_name')}_{evt.get('timestamp')}",
                        "target": f"ts_{ts.get('entity_id')}_{ts.get('metric_name')}_{ts.get('timestamp')}",
                        "relation": "co-occurred"
                    })
                    
        return {"nodes": nodes, "edges": edges}
