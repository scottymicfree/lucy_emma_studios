import json
import urllib.request
from typing import Dict, Any, List
from engines.swarm.mesh_protocol import SwarmMeshEngine

class ResearchReportGenerator:
    def __init__(self, mesh: SwarmMeshEngine, llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
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

    def generate_report(self, question: str, findings: List[Dict[str, Any]]) -> Dict[str, Any]:
        sys_prompt = "You are a Research Report Generator. Synthesize the findings into a structured report with 'abstract', 'findings', 'citations', 'analysis', and 'recommendations'. Output strictly valid JSON matching these keys."
        response = self._call_llama(sys_prompt, f"Question: {question}\\nFindings: {json.dumps(findings)}")
        try:
            report = json.loads(response)
            report["question"] = question
            return report
        except Exception:
            return {
                "question": question,
                "abstract": "Failed to parse report.",
                "findings": [],
                "citations": [],
                "analysis": "",
                "recommendations": []
            }
