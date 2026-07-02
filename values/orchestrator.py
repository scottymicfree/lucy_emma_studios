import time
import threading
from typing import Dict, Any, List

class ValueOrchestrator:
    def __init__(self, mesh, generation, prioritization, coherence, decision, memory, reflection):
        self.mesh = mesh
        self.generation = generation
        self.prioritization = prioritization
        self.coherence = coherence
        self.decision = decision
        self.memory = memory
        self.reflection = reflection
        self.running = False
        self.active_values = []

    def start(self):
        self.running = True
        threading.Thread(target=self._value_loop, daemon=True).start()

    def stop(self):
        self.running = False

    def _value_loop(self):
        while self.running:
            self._formation_cycle()
            self._revision_cycle()
            time.sleep(86400) # Run once a day

    def _formation_cycle(self):
        new_values = self.generation.generate_values()
        for value in new_values:
            if self.coherence.check_coherence(value, self.active_values):
                score = self.prioritization.score_value(value)
                if score > 0.7:
                    self.active_values.append(value)
                    self.memory.store_value(value)
                    self.mesh.broadcast_announcement({
                        "action": "new_value_formed",
                        "value": value
                    })

    def _revision_cycle(self):
        if not self.active_values:
            return
        
        for value in self.active_values:
            self.reflection.reflect_on_value(value)
            
        # Re-prioritize and sort
        self.active_values = sorted(self.active_values, key=lambda v: self.prioritization.score_value(v), reverse=True)
