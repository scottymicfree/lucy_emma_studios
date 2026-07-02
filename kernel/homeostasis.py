import asyncio
import math
from typing import Dict, Any


class HomeostaticCore:
    """
    Monitors real PerfMon telemetry (cpu/vram/memory) and generates proactive
    goals when sustained deviation from target operating range is detected.
    No random telemetry - reads whatever PerfMon.get_metrics() actually reports.

    trait_matrix tunes how sensitive the deviation calc is per axis:
      conscientiousness -> weight on cpu overrun
      openness          -> weight on vram overrun (willingness to explore heavier work)
      utility_focus     -> weight on memory overrun
    """

    TARGET = {"cpu": 0.60, "vram": 0.60, "memory": 0.60}

    def __init__(self, trait_matrix: Dict[str, float], perf_mon, data_vault,
                 poll_interval_seconds: float = 30.0, deviation_threshold: float = 0.35):
        self.traits = trait_matrix
        self.perf_mon = perf_mon
        self.data_vault = data_vault
        self.poll_interval_seconds = poll_interval_seconds
        self.deviation_threshold = deviation_threshold
        self.weights = {
            "cpu": self.traits.get("conscientiousness", 0.5),
            "vram": self.traits.get("openness", 0.5),
            "memory": self.traits.get("utility_focus", 0.5),
        }
        self._running = False

    def evaluate_deviation(self, metrics: Dict[str, float]) -> float:
        """Weighted RMS deviation from target operating range, positive-only
        (we only care about pressure above target, not idle capacity)."""
        total = 0.0
        for axis, target in self.TARGET.items():
            observed = metrics.get(axis, target)
            overrun = max(0.0, observed - target)
            total += (self.weights.get(axis, 0.5) * overrun) ** 2
        return math.sqrt(total)

    async def run_cognitive_loop(self, orchestrator) -> None:
        """Background loop: poll real telemetry, inject a proactive task through
        the orchestrator's existing dispatch path when deviation is sustained."""
        self._running = True
        consecutive_breaches = 0
        try:
            while self._running:
                metrics = self.perf_mon.get_metrics()
                deviation = self.evaluate_deviation(metrics)

                if deviation > self.deviation_threshold:
                    consecutive_breaches += 1
                else:
                    consecutive_breaches = 0

                # Require 2 consecutive breaches before acting, to avoid reacting
                # to a single noisy sample.
                if consecutive_breaches >= 2:
                    goal = self._select_goal(metrics)
                    self.data_vault.record_event(
                        "HOMEOSTASIS_PROACTIVE_GOAL",
                        {"deviation": deviation, "metrics": metrics, "goal": goal},
                    )
                    orchestrator.inject_proactive_task(goal, metrics)
                    consecutive_breaches = 0

                await asyncio.sleep(self.poll_interval_seconds)
        except asyncio.CancelledError:
            self._running = False
            raise

    def _select_goal(self, metrics: Dict[str, float]) -> str:
        """Pick which resource axis is driving the deviation and name the
        corresponding proactive goal."""
        worst_axis = max(self.TARGET.keys(), key=lambda a: metrics.get(a, 0.0) - self.TARGET[a])
        return {
            "cpu": "THROTTLE_BACKGROUND_TASKS",
            "vram": "SHED_OR_OFFLOAD_HEAVY_MODELS",
            "memory": "COMPACT_MEMORY_STORES",
        }.get(worst_axis, "RESOLVE_RESOURCE_PRESSURE")

    def stop(self):
        self._running = False
