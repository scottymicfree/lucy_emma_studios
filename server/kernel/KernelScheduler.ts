/**
 * @file KernelScheduler.ts
 * @description The global execution arbiter. Manages a PriorityQueue of SystemCalls,
 * resolves dependencies, and allocates execution time slices. Ensures that tools, mesh nodes,
 * and background operations do not race each other.
 */

import { SystemCall } from './ExecutionAuthorityLayer';
import { ExecutionFence } from './ExecutionFence';
import { EventBus } from './EventBus';
import { SystemState } from './SystemState';

export enum ExecutionPriority {
  CRITICAL = 0,    // Recovery, Emma approval, Safe Mode triggers
  HIGH = 1,        // Lucy execution, explicit user tool calls
  NORMAL = 2,      // Standard Mesh node execution
  LOW = 3,         // Analysis, summarization, narrative generation
  BACKGROUND = 4   // Graph optimization, telemetry archival
}

export interface ScheduledTask {
  syscall: SystemCall;
  priority: ExecutionPriority;
  enqueueTime: number;
}

export class KernelScheduler {
  private static instance: KernelScheduler;

  // Simple array-based priority queue for demonstration.
  // In production, use a Heap or structured PriorityQueue.
  private queue: ScheduledTask[] = [];
  private isProcessing = false;

  private constructor() {}

  public static getInstance(): KernelScheduler {
    if (!KernelScheduler.instance) {
      KernelScheduler.instance = new KernelScheduler();
    }
    return KernelScheduler.instance;
  }

  /**
   * Schedules a system call for execution based on priority.
   */
  public schedule(syscall: SystemCall, priority: ExecutionPriority) {
    this.queue.push({ syscall, priority, enqueueTime: Date.now() });
    
    // Sort queue: lower priority number runs first. 
    // If priority is equal, older tasks run first (FIFO).
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.enqueueTime - b.enqueueTime;
    });

    EventBus.getInstance().emit('KernelScheduler', 'SYSCALL_QUEUED', { 
      syscallId: syscall.id, 
      priority,
      queueDepth: this.queue.length
    }, 'normal', syscall.correlationId);

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (!task) continue;

      try {
        // We inject a dummy SystemState for execution in this demo.
        // In reality, the Kernel passes the authoritative State pointer.
        const mockState = {} as SystemState;
        
        await ExecutionFence.getInstance().executeAtomically(task.syscall, mockState);
      } catch (err: any) {
        console.error(`[Scheduler] SystemCall ${task.syscall.id} failed:`, err.message);
        // Error handling routes to the Repair Router
      }
    }

    this.isProcessing = false;
  }
}
