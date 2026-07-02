import json
import urllib.request
from typing import Dict, Any, List

class GraphReasoningEngine:
    def __init__(self, mesh, memory, llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
        self.mesh = mesh
        self.memory = memory
        self.llama_endpoint = llama_endpoint

    def _call_llama(self, system_prompt: str, user_prompt: str) -> str:
        data = {
            "model": "local-llama-3-8b-instruct",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "stream": False
        }
        req = urllib.request.Request(
            self.llama_endpoint, 
            data=json.dumps(data).encode('utf-8'), 
            headers={'Content-Type': 'application/json'}
        )
        try:
            with urllib.request.urlopen(req, timeout=45) as response:
                result = json.loads(response.read().decode())
                return result['choices'][0]['message']['content']
        except Exception:
            return ""

    def multi_hop_inference(self, start_node: str, target_node: str) -> str:
        path = self.memory.find_path(start_node, target_node)
        if not path:
            return "No known relationship path."
            
        sys_prompt = "You are a Graph Reasoning Engine. Based on this multi-hop relationship path, infer the deeper causal or analogical connection between the start and end nodes."
        response = self._call_llama(sys_prompt, json.dumps(path))
        return response

    def swarm_assisted_inference(self, query: str):
        sub_graph = self.memory.get_neighborhood(query, depth=2)
        payload = {
            "action": "graph_inference_request",
            "query": query,
            "context": sub_graph
        }
        self.mesh.broadcast_announcement(payload)
