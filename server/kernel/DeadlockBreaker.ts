/**
 * @file DeadlockBreaker.ts
 * @description Watches for Emma and Lucy entering a cyclic wait state (deadlock) and forces an escalation to safe mode.
 */

import { EventBus, SystemEvent } from './EventBus';
import { RecoveryDirector } from './RecoveryDirector';

export class DeadlockBreaker {
  private static instance: DeadlockBreaker;
  
  // Tracks correlationId -> timestamp of the last activity
  private activityWatchdog: Map<string, number> = new Map();
  private readonly DEADLOCK_TIMEOUT_MS = 30000; // 30 seconds

  private constructor() {
    this.attachToEventBus();
    this.startWatchdogLoop();
  }

  public static getInstance(): DeadlockBreaker {
    if (!DeadlockBreaker.instance) {
      DeadlockBreaker.instance = new DeadlockBreaker();
    }
    return DeadlockBreaker.instance;
  }

  private attachToEventBus() {
    // Every time Emma or Lucy emits an event, reset the timer for that correlation ID
    EventBus.getInstance().onAny((event: SystemEvent) => {
      if ((event.source === 'Emma' || event.source === 'Lucy') && event.correlationId) {
        this.activityWatchdog.set(event.correlationId, Date.now());
      }
    });
  }

  private startWatchdogLoop() {
    setInterval(() => {
      const now = Date.now();
      for (const [correlationId, lastActive] of this.activityWatchdog.entries()) {
        if (now - lastActive > this.DEADLOCK_TIMEOUT_MS) {
          this.triggerSafeModeFallback(correlationId);
        }
      }
    }, 5000);
  }

  private triggerSafeModeFallback(correlationId: string) {
    console.error(`[DeadlockBreaker] Kernel deadlock detected on correlation ID: ${correlationId}`);
    this.activityWatchdog.delete(correlationId);

    EventBus.getInstance().emit('DeadlockBreaker', 'SAFE_MODE_TRIGGERED', { 
      reason: 'Emma/Lucy cyclic timeout', 
      correlationId 
    }, 'critical', correlationId);

    // Fall back to safe mode via Recovery Director
    // In a full implementation, this triggers a hard subsystem restart and aborts the deadlocked command.
  }
}
