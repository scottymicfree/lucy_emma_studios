/**
 * @file FAE.ts
 * @description The Failure Arbitration Engine (FAE).
 * The single centralized authority for all failure state transitions.
 * Removes failure decision logic from TRC, Kernel, and Emma.
 */

import { EventBus } from './EventBus';
import { RealityEvaluation } from './ToolRealityChecker';
import { SystemState } from './SystemState';
import { ShadowLayer } from './ShadowLayer';

export class FailureArbitrationEngine {
  private static instance: FailureArbitrationEngine;

  private constructor() {}

  public static getInstance(): FailureArbitrationEngine {
    if (!FailureArbitrationEngine.instance) {
      FailureArbitrationEngine.instance = new FailureArbitrationEngine();
    }
    return FailureArbitrationEngine.instance;
  }

  /**
   * Evaluates a failure signal (e.g., from the TRC) and decides the OS transition.
   */
  public async arbitrate(evaluation: RealityEvaluation, currentState: SystemState, correlationId: string) {
    EventBus.getInstance().emit('FAE', 'ARBITRATION_STARTED', { category: evaluation.category }, 'high', correlationId);

    if (evaluation.category === 'syntax_error' && currentState.kernelStatus !== 'safe_mode') {
      // Syntax errors in live code indicate a failed self-edit. Trigger rollback.
      EventBus.getInstance().emit('Kernel', 'KERNEL_STATUS_CHANGED', { status: 'rollback_mode' }, 'critical', correlationId);
      await ShadowLayer.getInstance().rollbackToCleanState(correlationId);
      EventBus.getInstance().emit('Kernel', 'KERNEL_STATUS_CHANGED', { status: 'live' }, 'critical', correlationId);
      return;
    }

    if (evaluation.category === 'resource_starvation') {
      EventBus.getInstance().emit('Kernel', 'KERNEL_STATUS_CHANGED', { status: 'safe_mode' }, 'critical', correlationId);
      return;
    }

    if (evaluation.category === 'permission_denied') {
      EventBus.getInstance().emit('Kernel', 'KERNEL_STATUS_CHANGED', { status: 'degraded' }, 'high', correlationId);
      // Wait for Emma to resolve policy
      return;
    }

    // Default fallback for unknown severe issues
    EventBus.getInstance().emit('Kernel', 'KERNEL_STATUS_CHANGED', { status: 'safe_mode' }, 'critical', correlationId);
  }
}
