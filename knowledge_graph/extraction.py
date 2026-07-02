import json
import urllib.request
import re
from typing import Dict, Any, List

class EntityExtractionEngine:
    def __init__(self, mesh, llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
        self.mesh = mesh
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
            with urllib.request.urlopen(req, timeout=30) as response:
                result = json.loads(response.read().decode())
                return result['choices'][0]['message']['content']
        except Exception:
            return ""

    def extract_entities(self, text: str) -> List[str]:
        sys_prompt = "Extract all significant entities, concepts, and subjects from the text. Normalize them to their base forms and remove duplicates. Output strictly a JSON list of strings."
        response = self._call_llama(sys_prompt, text)
        try:
            entities = json.loads(response)
            if isinstance(entities, list):
                return list(set([str(e).lower().strip() for e in entities]))
            return []
        except Exception:
            return []

class RelationshipExtractionEngine:
    def __init__(self, mesh, llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
        self.mesh = mesh
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

    def extract_relationships(self, entities: List[str], context: str) -> List[Dict[str, Any]]:
        sys_prompt = "Extract relationships between these entities based on the context. Return causal, temporal, hierarchical, or associative edges. Output strictly a JSON list of objects: {'source': '', 'target': '', 'relation': '', 'confidence': 0.0-1.0}."
        payload = f"Entities: {json.dumps(entities)}\nContext: {context}"
        response = self._call_llama(sys_prompt, payload)
        try:
            relations = json.loads(response)
            if isinstance(relations, list):
                return relations
            return []
        except Exception:
            return []
