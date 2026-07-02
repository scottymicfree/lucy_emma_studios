/**
 * @file MeshOrchestrator.ts
 * @description The DAG execution engine for distributed agent computation.
 * STRICT RULE: The Mesh cannot execute nodes directly. It must submit SystemCalls
 * to the KernelScheduler via the Execution Authority Layer.
 */

import { EventBus } from './EventBus';
import { AgentNode } from './AgentNode';
import { SystemCall, ExecutionAuthorityLayer } from './ExecutionAuthorityLayer';

export interface MeshTask {
  id: string;
  correlationId: string;
  nodes: Map<string, AgentNode>;
  edges: { from: string, to: string }[];
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export class MeshOrchestrator {
  private static instance: MeshOrchestrator;
  private activeTasks: Map<string, MeshTask> = new Map();

  private constructor() {}

  public static getInstance(): MeshOrchestrator {
    if (!MeshOrchestrator.instance) {
      MeshOrchestrator.instance = new MeshOrchestrator();
    }
    return MeshOrchestrator.instance;
  }

  public registerTask(task: MeshTask) {
    this.activeTasks.set(task.id, task);
    EventBus.getInstance().emit('MeshOrchestrator', 'TASK_REGISTERED', { taskId: task.id }, 'normal', task.correlationId);
  }

  /**
   * Evaluates the DAG. For any node whose dependencies are met and is 'idle',
   * it transitions them to 'queued' and submits a SystemCall to the Scheduler.
   */
  public evaluateDag(taskId: string) {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    for (const [nodeId, node] of task.nodes.entries()) {
      if (node.state === 'idle') {
        const canRun = this.checkDependencies(task, node);
        if (canRun) {
          node.state = 'queued';
          
          const syscall: SystemCall = {
            id: `sys-${nodeId}-${Date.now()}`,
            type: 'spawn_node',
            payload: { taskId: task.id, nodeId: node.id, role: node.role },
            correlationId: task.correlationId,
            requiredCapabilities: node.toolScope,
            resourceRequest: { cpu: 0.1, memoryMB: 256 } // Base request for a node
          };

          EventBus.getInstance().emit('MeshOrchestrator', 'NODE_QUEUED', { nodeId, syscallId: syscall.id }, 'normal', task.correlationId);
          
          // Note: The Mesh does not execute. It passes the syscall to the EAL/Scheduler pipeline.
          // The actual KernelScheduler handles priority and invocation.
        }
      }
    }
  }

  private checkDependencies(task: MeshTask, node: AgentNode): boolean {
    for (const depId of node.dependencies) {
      const depNode = task.nodes.get(depId);
      if (!depNode || depNode.state !== 'complete') {
        return false;
      }
    }
    return true;
  }
}
