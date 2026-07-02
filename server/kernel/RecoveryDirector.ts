/**
 * @file RecoveryDirector.ts
 * @description The highest level Autonomous Recovery loop. 
 * Orchestrates incident response, subsystem recovery, and task rollbacks.
 */

import { EventBus, SystemEvent } from './EventBus';
import { AuditLedger } from './AuditLedger';
import { SnapshotManager } from './SnapshotManager';
import { DiagnosticsEngine, SubsystemHealth } from './DiagnosticsEngine';

export class RecoveryDirector {
  private static instance: RecoveryDirector;
  private isRecovering: boolean = false;

  private constructor() {
    this.attachToEventBus();
  }

  public static getInstance(): RecoveryDirector {
    if (!RecoveryDirector.instance) {
      RecoveryDirector.instance = new RecoveryDirector();
    }
    return RecoveryDirector.instance;
  }

  private attachToEventBus() {
    // Listen for critical subsystem degradation
    EventBus.getInstance().on('DiagnosticsEngine', (event: SystemEvent) => {
      if (event.type === 'SUBSYSTEM_DEGRADED' && !this.isRecovering) {
        this.initiateSubsystemRecovery(event.payload.name, event.payload.status);
      }
    });

    // Listen for dead worker threads to track recovery effectiveness
    EventBus.getInstance().on('WorkerManager', (event: SystemEvent) => {
      if (event.type === 'WORKER_UNRESPONSIVE') {
        this.logIncident('WorkerManager', 'Deadlock Detected', event.payload.id);
      }
    });

    // Listen for LLM crashes
    EventBus.getInstance().on('ReasoningRuntime', (event: SystemEvent) => {
      if (event.type === 'GENERATION_FAILED') {
        this.logIncident('ReasoningRuntime', 'Inference Failure', event.payload.error);
      }
    });
  }

  /**
   * Main recovery state machine execution.
   */
  private async initiateSubsystemRecovery(subsystem: string, status: string) {
    this.isRecovering = true;
    const incidentId = `inc_${crypto.randomUUID()}`;
    
    EventBus.getInstance().emit('RecoveryDirector', 'RECOVERY_STARTED', { incidentId, subsystem, status }, 'critical');

    try {
      // 1. Snapshot prior to recovery action
      const snapId = SnapshotManager.getInstance().createSnapshot('pre_rollback', `Pre-recovery snapshot for ${subsystem}`);

      // 2. Classify & Plan
      let recovered = false;
      if (subsystem === 'ReasoningRuntime') {
        recovered = await this.recoverLLM();
      } else if (subsystem === 'AstIndexer') {
        recovered = this.recoverMemory();
      } else {
        // Generic subsystem restart mock
        recovered = true; 
      }

      // 3. Verify
      if (recovered) {
        EventBus.getInstance().emit('RecoveryDirector', 'RECOVERY_SUCCESSFUL', { incidentId, subsystem });
        DiagnosticsEngine.getInstance().reportHealth(subsystem, 'Healthy', 0, []);
      } else {
        EventBus.getInstance().emit('RecoveryDirector', 'RECOVERY_FAILED', { incidentId, subsystem }, 'critical');
        // Escalation -> Restore Snapshot
        SnapshotManager.getInstance().restoreSnapshot(snapId);
      }

    } catch (err: any) {
      EventBus.getInstance().emit('RecoveryDirector', 'RECOVERY_CRASHED', { incidentId, error: err.message }, 'critical');
    } finally {
      this.isRecovering = false;
    }
  }

  private async recoverLLM(): Promise<boolean> {
    // In a real implementation, this would trigger a restart of Ollama/LM Studio 
    // or fallback to a secondary configuration.
    return true; 
  }

  private recoverMemory(): boolean {
    return true;
  }

  private logIncident(component: string, issue: string, details: any) {
    AuditLedger.getInstance().record('RecoveryDirector', 'INCIDENT_LOGGED', {
      component,
      issue,
      details
    });
  }
}
