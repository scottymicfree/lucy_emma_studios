import asyncio
import time
from datetime import datetime
from typing import Callable, Dict, Any, List

class ChronJobScheduler:
    """
    Autonomy: Chron-job or heartbeat trigger for spontaneous action.
    Maintains a heartbeat loop and allows cron-style scheduling.
    """
    def __init__(self):
        self.interval_jobs = []
        self.cron_jobs = []
        self.running = False
        self.heartbeat_interval = 1.0

    def schedule_interval(self, interval_seconds: float, task_coroutine: Callable, name: str = "UnnamedTask"):
        """Registers a recurring task by interval."""
        self.interval_jobs.append({
            "name": name,
            "interval": interval_seconds,
            "task": task_coroutine,
            "last_run": time.time()
        })

    def schedule_cron(self, cron_expr: str, task_coroutine: Callable, name: str = "UnnamedCronTask"):
        """Registers a task using a cron expression."""
        self.cron_jobs.append({
            "name": name,
            "cron": cron_expr, # mock cron expression
            "task": task_coroutine,
            "last_minute": datetime.now().minute
        })

    async def trigger_spontaneous_action(self, action_type: str):
        """Allows Lucy to take spontaneous actions outside of normal schedules."""
        print(f"[Scheduler] Triggering spontaneous action: {action_type}")
        # Dispatch logic would go here

    async def _runner(self):
        self.running = True
        while self.running:
            now = time.time()
            now_dt = datetime.now()
            
            # 1. Process Interval Jobs
            for job in self.interval_jobs:
                if now - job["last_run"] >= job["interval"]:
                    print(f"[Scheduler] Executing interval job: {job['name']}")
                    try:
                        asyncio.create_task(job["task"]())
                    except Exception as e:
                        print(f"[Scheduler] Error executing interval job {job['name']}: {e}")
                    job["last_run"] = now
            
            # 2. Process Cron Jobs (Mock logic)
            for job in self.cron_jobs:
                if job["last_minute"] != now_dt.minute:
                    job["last_minute"] = now_dt.minute
                    # In a real system, we'd parse the cron expression and match the current time
                    # Here we just run it every minute for demonstration if it's "* * * * *"
                    if job["cron"] == "* * * * *":
                        print(f"[Scheduler] Executing cron job: {job['name']}")
                        try:
                            asyncio.create_task(job["task"]())
                        except Exception as e:
                            print(f"[Scheduler] Error executing cron job {job['name']}: {e}")

            # 3. Heartbeat Pulse
            await asyncio.sleep(self.heartbeat_interval)

    def start(self):
        return asyncio.create_task(self._runner())
        
    def stop(self):
        self.running = False


