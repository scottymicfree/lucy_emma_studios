import time
import threading
import json
from typing import Dict, Any, List
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

class SelfHealingOrchestrator:
    def __init__(self, mesh, delegation, diagnostic_engine, repair_engine, stability_engine):
        self.mesh = mesh
        self.delegation = delegation
        self.diagnostic_engine = diagnostic_engine
        self.repair_engine = repair_engine
        self.stability_engine = stability_engine
        self.running = False
        self.health_metrics = {}
        
    def start(self):
        self.running = True
        threading.Thread(target=self._health_monitoring_loop, daemon=True).start()

    def stop(self):
        self.running = False

    def _health_monitoring_loop(self):
        while self.running:
            metrics = self._gather_system_metrics()
            anomaly = self._detect_anomaly(metrics)
            
            if anomaly:
                incident_id = f"inc_{int(time.time())}"
                self._trigger_healing_workflow(incident_id, anomaly)
                
            time.sleep(60)

    def _gather_system_metrics(self) -> Dict[str, Any]:
        return {
            "timestamp": time.time(),
            "cpu_load": 0.2,
            "memory_usage": 0.4,
            "active_tasks": len(self.delegation.active_tasks) if hasattr(self.delegation, 'active_tasks') else 0,
            "error_rates": self.diagnostic_engine.get_recent_errors()
        }

    def _detect_anomaly(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        if metrics["error_rates"] > 0.1:
            return {"type": "high_error_rate", "severity": "high"}
        if metrics["active_tasks"] > 100:
            return {"type": "task_overload", "severity": "medium"}
        return {}

    def _trigger_healing_workflow(self, incident_id: str, anomaly: Dict[str, Any]):
        diagnosis = self.diagnostic_engine.diagnose(anomaly)
        if diagnosis:
            repair_plan = self.repair_engine.generate_repair_plan(diagnosis)
            success = self.repair_engine.execute_repair(repair_plan)
            
            if success:
                self.stability_engine.record_successful_healing(incident_id, anomaly, repair_plan)
            else:
                self.mesh.broadcast_announcement({"action": "healing_failed", "incident": incident_id})
