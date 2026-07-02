/**
 * @file NarrativeCompiler.ts
 * @description The UI Brain. 
 * STRICT RULE: Chat output is derived ONLY from the SystemState snapshot 
 * and Event stream projection. NEVER raw tool outputs or mesh internal logs.
 */

import { SystemState } from './SystemState';
import { BaseEvent } from './BaseEvent';

export interface ChatUpdate {
  timestamp: number;
  speaker: 'Emma' | 'Lucy' | 'Kernel';
  message: string;
  contextSnapshot: {
    activeTasksCount: number;
    kernelStatus: string;
  };
}

export class NarrativeCompiler {
  private static instance: NarrativeCompiler;

  private constructor() {}

  public static getInstance(): NarrativeCompiler {
    if (!NarrativeCompiler.instance) {
      NarrativeCompiler.instance = new NarrativeCompiler();
    }
    return NarrativeCompiler.instance;
  }

  /**
   * Compiles the current system state and the latest event into a safe UI projection.
   * Internal tool traces and node logs are explicitly filtered out.
   */
  public compile(currentState: SystemState, latestEvent: BaseEvent): ChatUpdate | null {
    // Filter out noisy backend events
    if (latestEvent.type === 'tool_result' || latestEvent.type === 'mesh_event') {
      return null; 
    }

    let speaker: 'Emma' | 'Lucy' | 'Kernel' = 'Kernel';
    let message = '';

    if (latestEvent.source === 'Emma' && latestEvent.action === 'POLICY_OVERRIDE_DENIED') {
      speaker = 'Emma';
      message = `I have denied that execution request due to policy restrictions: ${latestEvent.payload.reason}`;
    } else if (latestEvent.source === 'Lucy' && latestEvent.action === 'ACTION_PROPOSED') {
      speaker = 'Lucy';
      message = `I am proposing to execute a task: ${latestEvent.payload.type}`;
    } else if (latestEvent.source === 'Kernel' && latestEvent.action === 'KERNEL_STATUS_CHANGED') {
      speaker = 'Kernel';
      message = `System status transitioned to ${latestEvent.payload.status}.`;
    } else {
      return null; // Not relevant for chat UI
    }

    return {
      timestamp: Date.now(),
      speaker,
      message,
      contextSnapshot: {
        activeTasksCount: currentState.activeTasks.size,
        kernelStatus: currentState.kernelStatus
      }
    };
  }
}
