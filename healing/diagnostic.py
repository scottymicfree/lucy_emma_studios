import json
import urllib.request
from typing import Dict, Any, List

class DiagnosticEngine:
    def __init__(self, mesh, llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
        self.mesh = mesh
        self.llama_endpoint = llama_endpoint
        self.error_logs: List[Dict[str, Any]] = []

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

    def log_error(self, module: str, error_msg: str, traceback: str):
        self.error_logs.append({
            "module": module,
            "error": error_msg,
            "traceback": traceback
        })

    def get_recent_errors(self) -> float:
        return len(self.error_logs) / 100.0 if self.error_logs else 0.0

    def diagnose(self, anomaly: Dict[str, Any]) -> Dict[str, Any]:
        sys_prompt = "You are a Root-Cause Analysis Engine. Diagnose the provided anomaly and logs. Output JSON with 'root_cause', 'affected_module', and 'severity'."
        payload = {"anomaly": anomaly, "recent_logs": self.error_logs[-5:]}
        
        response = self._call_llama(sys_prompt, json.dumps(payload))
        self.error_logs.clear()
        
        try:
            return json.loads(response)
        except Exception:
            return {"root_cause": "unknown", "affected_module": "unknown", "severity": "high"}

    def trace_dependency_graph(self, module: str) -> List[str]:
        return [module, "core_mesh", "delegation_engine"]

    def classify_error_signature(self, error_msg: str) -> str:
        if "Timeout" in error_msg:
            return "network_timeout"
        if "KeyError" in error_msg:
            return "data_malformation"
        return "unknown_signature"
