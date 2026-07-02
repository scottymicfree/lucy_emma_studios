/**
 * @file RepairRouter.ts
 * @description Layer 2: Control Intelligence Layer (Repair Router).
 * The control-plane safety valve. Intercepts fault validations from the TRC/FAE 
 * and routes them directly into the AZR self-healing loop.
 */

import { EventBus } from './EventBus';
import { RealityEvaluation } from './ToolRealityChecker';

export class RepairRouter {
  private static instance: RepairRouter;

  private constructor() {}

  public static getInstance(): RepairRouter {
    if (!RepairRouter.instance) {
      RepairRouter.instance = new RepairRouter();
    }
    return RepairRouter.instance;
  }

  /**
   * Evaluates if a failure is repairable and dispatches it to the AZR loop.
   */
  public routeFailure(evaluation: RealityEvaluation, correlationId: string) {
    if (!evaluation.fixable) {
      EventBus.getInstance().emit('RepairRouter', 'REPAIR_IMPOSSIBLE', { reason: 'Score too low or critical failure' }, 'high', correlationId);
      return;
    }

    EventBus.getInstance().emit('RepairRouter', 'REPAIR_DISPATCHED', { 
      target: 'AZR', 
      category: evaluation.category,
      score: evaluation.fixabilityScore
    }, 'high', correlationId);

    // In a real system, this invokes AZR.getInstance().generateTask() with context.
  }
}
