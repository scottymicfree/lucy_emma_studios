class RAGAdapter:
    def __init__(self):
        pass

    def adapt_to_documents(self, timeseries_data, events_data):
        print(f"[RAGAdapter] Converting {len(timeseries_data)} TS points and {len(events_data)} events to RAG docs.")
        docs = []
        for ts in timeseries_data:
            doc = f"In {ts['timestamp']}, the {ts.get('metric_name', 'metric')} for {ts.get('entity_id', 'entity')} was {ts['value']} {ts['unit']} (Source: {ts['source']})."
            docs.append(doc)
            
        for event in events_data:
            doc = f"On {event['timestamp']}, in {event['entity_id']}: {event['event_name']} - {event['description']}"
            docs.append(doc)
            
        return docs
