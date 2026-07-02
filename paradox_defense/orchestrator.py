import time
import threading
from typing import Dict, Any, List

class ParadoxDefenseOrchestrator:
    def __init__(self, mesh, detector, pruner):
        self.mesh = mesh
        self.detector = detector
        self.pruner = pruner
        self.running = False

    def start(self):
        self.running = True
        threading.Thread(target=self._loop, daemon=True).start()

    def stop(self):
        self.running = False

    def _loop(self):
        while self.running:
            self._cycle()
            time.sleep(3600)

    def _cycle(self):
        paradoxes = self.detector.scan_for_paradoxes()
        if paradoxes:
            pruned = self.pruner.prune(paradoxes)
            self.mesh.broadcast_announcement({
                "action": "paradox_pruned",
                "pruned_paradoxes": pruned
            })
