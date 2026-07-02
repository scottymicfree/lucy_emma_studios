import asyncio
import time
import random
from typing import Dict, Any

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from kernel.orchestrator import Orchestrator
from runtime.scheduler import ChronJobScheduler
from engines.emotional_resilience import EmmaEvaluationEngine

class SovereignDaemon:
    """
    The persistent heartbeat of the E.M.M.A. Kernel.
    Maintains the async event loop, spontaneous action triggers, and OS hooks.
    """
    def __init__(self):
        self.orchestrator = Orchestrator()
        self.scheduler = ChronJobScheduler()
        self.emma_eval = EmmaEvaluationEngine()
        self.running = False
        
        # Initialize PlanetaryTelemetryIngest
        try:
            from ingest.environment_fetcher import PlanetaryTelemetryIngest
            self.planetary_ingest = PlanetaryTelemetryIngest()
            print("[BOOT] PlanetaryTelemetryIngest daemon initialized.")
        except Exception as e:
            print(f"[Daemon] Failed to import PlanetaryTelemetryIngest: {e}")
            self.planetary_ingest = None

    async def _planetary_telemetry_task(self):
        if self.planetary_ingest:
            print("[Daemon] Running planetary telemetry ingestion cycle...")
            try:
                self.planetary_ingest.fetch_live_seismic_activity()
                self.planetary_ingest.fetch_space_weather_telemetry()
                self.planetary_ingest.fetch_weather_anomalies()
                self.planetary_ingest.fetch_crime_telemetry()
            except Exception as e:
                print(f"[Daemon Error] Planetary telemetry task failed: {e}")

    async def _health_check_task(self):
        metrics = self.orchestrator.perf_mon.get_metrics()
        print(f"[Daemon] Heartbeat... CPU: {metrics['cpu']} VRAM: {metrics['vram']}")
        if metrics["cpu"] < 0.2:
            print("[Daemon] Idle state detected. Triggering internal reflection...")

        # Natural homeostatic pressure fluctuations on the 24 Emma nodes
        try:
            for nid, data in self.emma_eval.nodes.items():
                # Slight random fluctuation
                change = random.uniform(-0.015, 0.015)
                # Dampen high pressure nodes towards baseline (homeostatic recovery)
                if data["pressure"] > 0.4:
                    change -= 0.01
                data["pressure"] = min(1.0, max(0.05, data["pressure"] + change))
            
            # Propagate values across neighbors & save to SQLite
            self.emma_eval._propagate_pressure()
            for nid, data in self.emma_eval.nodes.items():
                if data["pressure"] >= data["threshold"]:
                    data["status"] = "critical"
                elif data["pressure"] >= data["threshold"] * 0.75:
                    data["status"] = "warning"
                else:
                    data["status"] = "normal"
            self.emma_eval.save_nodes()
        except Exception as err:
            print(f"[Daemon] Emma homeostatic tick failed: {err}")

    async def run(self):
        self.running = True
        print("[Daemon] Sovereign Kernel Online. Bootstrapping awareness loops.")
        
        # Schedule the spontaneous cognition loop to run every 5 seconds
        self.scheduler.schedule_interval(5.0, self._health_check_task, name="HealthCheck")
        
        # Schedule the planetary telemetry task to run every 20 seconds
        if self.planetary_ingest:
            self.scheduler.schedule_interval(20.0, self._planetary_telemetry_task, name="PlanetaryTelemetry")
        
        # Start the chron job scheduler
        scheduler_task = self.scheduler.start()
        
        # Keep daemon alive
        try:
            await scheduler_task
        except asyncio.CancelledError:
            self.running = False
            self.scheduler.stop()

# --- Windows Service wrapper for Phase 2 daemon requirements ---
try:
    import win32serviceutil
    import win32service
    import win32event
    import servicemanager
    import socket

    class WindowsSovereignService(win32serviceutil.ServiceFramework):
        _svc_name_ = "LucyEmmaSovereignDaemon"
        _svc_display_name_ = "Lucy & Emma Sovereign Daemon Service"
        _svc_description_ = "Persistent background heartbeat, homeostatic ticks, and AGI-OS runtime scheduler for Project Lucy."

        def __init__(self, args):
            win32serviceutil.ServiceFramework.__init__(self, args)
            self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
            socket.setdefaulttimeout(60)
            self.daemon = SovereignDaemon()

        def SvcStop(self):
            self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
            win32event.SetEvent(self.hWaitStop)

        def SvcDoRun(self):
            servicemanager.LogMsg(
                servicemanager.EVENTLOG_INFORMATION_TYPE,
                servicemanager.PYS_SERVICE_STARTED,
                (self._svc_name_, '')
            )
            self.main()

        def main(self):
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            async def watch_stop():
                while True:
                    if win32event.WaitForSingleObject(self.hWaitStop, 500) == 0:
                        self.daemon.scheduler.stop()
                        break
                    await asyncio.sleep(0.5)

            # Start daemon and wait for stops
            loop.create_task(self.daemon.run())
            loop.run_until_complete(watch_stop())

except ImportError:
    WindowsSovereignService = None

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ["install", "remove", "start", "stop", "status"] and WindowsSovereignService is not None:
        win32serviceutil.HandleCommandLine(WindowsSovereignService)
    else:
        daemon = SovereignDaemon()
        asyncio.run(daemon.run())

