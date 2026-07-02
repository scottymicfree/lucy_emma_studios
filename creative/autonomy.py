import time
import threading
import random

class CreativeAutonomyEngine:
    def __init__(self, mesh, orchestrator):
        self.mesh = mesh
        self.orchestrator = orchestrator
        self.running = False
        self.creative_modes = ["music", "writing", "design", "planning"]

    def start(self):
        self.running = True
        threading.Thread(target=self._autonomous_creation_loop, daemon=True).start()

    def stop(self):
        self.running = False

    def _autonomous_creation_loop(self):
        while self.running:
            if random.random() < 0.3:
                mode = random.choice(self.creative_modes)
                topic = f"Spontaneous exploration in {mode} at {int(time.time())}"
                self.orchestrator.launch_creative_session(topic, mode)
            time.sleep(3600)
