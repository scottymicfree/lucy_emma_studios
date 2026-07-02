/**
 * @file Lucy.ts
 * @description The Lucy Execution Runtime. 
 * Responsible for cognitive planning and executing tasks, but she has ZERO authorization capability.
 * All her actions must be formalized as SystemCalls and submitted to the EAL.
 */

import { EventBus } from './EventBus';
import { SystemCallType } from './ExecutionAuthorityLayer';

export class LucyRuntime {
  private static instance: LucyRuntime;

  private constructor() {}

  public static getInstance(): LucyRuntime {
    if (!LucyRuntime.instance) {
      LucyRuntime.instance = new LucyRuntime();
    }
    return LucyRuntime.instance;
  }

  /**
   * Lucy formulates a plan, but she DOES NOT execute it directly.
   * She emits a REQUEST_SYSCALL event that the Mesh or Kernel must pick up and route to the Scheduler.
   */
  public proposeAction(actionType: SystemCallType, payload: any, correlationId: string) {
    EventBus.getInstance().emit('Lucy', 'ACTION_PROPOSED', { 
      type: actionType, 
      payload 
    }, 'normal', correlationId);

    // Note: Lucy does not call `ExecutionAuthorityLayer.execute()` directly.
    // Her proposals are converted into `ExecutionRequest`s by the Mesh Orchestrator
    // or the API gateway, which then routes them to the Scheduler.
  }
}
