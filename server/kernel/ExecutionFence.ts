/**
 * @file ExecutionFence.ts
 * @description The Global Execution Fence.
 * Guarantees that NO execution reaches any subsystem without passing a single atomic gate.
 * Resolves race conditions between Mesh, Kernel, ShadowLayer, and TRC under concurrency.
 */

import { SystemCall, ExecutionAuthorityLayer } from './ExecutionAuthorityLayer';
import { EventBus } from './EventBus';
import { SystemState } from './SystemState';

export class ExecutionFence {
  private static instance: ExecutionFence;
  
  // The atomic lock. True if an execution is currently traversing the EAL pipeline.
  private isLocked: boolean = false;

  private constructor() {}

  public static getInstance(): ExecutionFence {
    if (!ExecutionFence.instance) {
      ExecutionFence.instance = new ExecutionFence();
    }
    return ExecutionFence.instance;
  }

  /**
   * Request -> Lock -> Validate -> Route -> Execute -> Unlock
   */
  public async executeAtomically(syscall: SystemCall, currentState: SystemState): Promise<any> {
    if (this.isLocked) {
      // In a real system, this would queue or block via a Mutex. 
      // For this mock, we throw to indicate concurrency rejection.
      throw new Error(`[ExecutionFence] Lock acquisition failed. System is currently processing another syscall.`);
    }

    try {
      this.isLocked = true;
      EventBus.getInstance().emit('ExecutionFence', 'LOCK_ACQUIRED', { syscallId: syscall.id }, 'normal', syscall.correlationId);

      // Pass through the EAL pipeline (Validate -> Route -> Execute)
      const result = await ExecutionAuthorityLayer.getInstance().execute(syscall, currentState);
      
      return result;
    } finally {
      this.isLocked = false;
      EventBus.getInstance().emit('ExecutionFence', 'LOCK_RELEASED', { syscallId: syscall.id }, 'normal', syscall.correlationId);
    }
  }
}
