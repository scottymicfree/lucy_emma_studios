import time
import threading
from typing import Dict, Any, List

class WorldModelOrchestrator:
    def __init__(self, mesh, state, causal, simulation, memory, update, predictive, autonomy, visualization):
        self.mesh = mesh
        self.state = state
        self.causal = causal
        self.simulation = simulation
        self.memory = memory
        self.update = update
        self.predictive = predictive
        self.autonomy = autonomy
        self.visualization = visualization
        self.running = False
        
        self.mesh.register_callback("world_state_update", self._handle_state_update)

    def start(self):
        self.running = True
        threading.Thread(target=self._world_model_loop, daemon=True).start()

    def stop(self):
        self.running = False

    def _world_model_loop(self):
        while self.running:
            self._construction_cycle()
            self._revision_cycle()
            time.sleep(3600)

    def _construction_cycle(self):
        predictions = self.predictive.forecast_future_states(self.memory.get_current_state())
        for p in predictions:
            self.mesh.broadcast_announcement({
                "action": "world_model_prediction",
                "prediction": p
            })

    def _revision_cycle(self):
        updates = self.update.detect_outdated_state(self.memory.get_current_state())
        if updates:
            for u in updates:
                self.memory.update_entity_state(u["entity_id"], u["new_state"])
            self.mesh.broadcast_announcement({
                "action": "world_model_revised",
                "updates": updates
            })
            
    def _handle_state_update(self, msg: Dict[str, Any], source_ip: str):
        data = msg.get("data", {})
        if "entity" in data and "state" in data:
            self.memory.update_entity_state(data["entity"], data["state"])
            self.mesh.broadcast_announcement({
                "action": "world_model_synced",
                "timestamp": time.time()
            })
