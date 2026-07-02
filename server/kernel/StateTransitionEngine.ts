/**
 * @file StateTransitionEngine.ts
 * @description The pure reducer engine for the entire OS. 
 * Enforces the rule: SystemState + BaseEvent -> Next SystemState
 * No subsystem mutates state directly. All mutations go through this engine.
 */

import { SystemState } from './SystemState';
import { BaseEvent } from './BaseEvent';

export class StateTransitionEngine {
  
  /**
   * Applies an event to the current state and returns a new immutable state copy.
   * This is a pure function.
   */
  public static apply(currentState: SystemState, event: BaseEvent): SystemState {
    // Deep clone state for immutability (in a real high-perf system, use Immer or immutable.js)
    const nextState: SystemState = {
      ...currentState,
      activeTasks: new Map(currentState.activeTasks),
      runningNodes: new Map(currentState.runningNodes),
      capabilityLeases: new Map(currentState.capabilityLeases)
    };

    nextState.eventHead = event.eventId;

    // Apply specific reducers based on EventType
    switch (event.type) {
      case 'lifecycle':
        if (event.action === 'KERNEL_STATUS_CHANGED') {
          nextState.kernelStatus = event.payload.status;
        }
        break;

      case 'capability_event':
        if (event.action === 'LEASE_GRANTED') {
          nextState.capabilityLeases.set(event.payload.lease.id, event.payload.lease);
        } else if (event.action === 'LEASE_REVOKED') {
          nextState.capabilityLeases.delete(event.payload.leaseId);
        }
        break;

      case 'mesh_event':
        if (event.action === 'TASK_SPAWNED') {
          nextState.activeTasks.set(event.payload.task.id, event.payload.task);
        } else if (event.action === 'NODE_STATE_CHANGED') {
          // Update specific node state within task
          const task = nextState.activeTasks.get(event.payload.taskId);
          if (task && task.nodes.has(event.payload.nodeId)) {
            const node = task.nodes.get(event.payload.nodeId)!;
            node.state = event.payload.state;
          }
        }
        break;

      // ... other reducer logic for tools, devices, recovery ...
    }

    return nextState;
  }
}
