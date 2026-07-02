/**
 * @file CommandBus.ts
 * @description Validates and routes work requests to the OS.
 * Emits events upon command ingestion, execution, and failure.
 */

import crypto from 'crypto';
import { EventBus } from './EventBus';
import { AuditLedger } from './AuditLedger';

export type CommandState = 'PENDING' | 'AUTHORIZED' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';

export interface SystemCommand<T = any> {
  id: string; // Correlation ID
  name: string; // e.g., 'EXECUTE_TOOL', 'UPDATE_POLICY'
  target: string; // Subsystem target e.g., 'Lucy', 'Emma'
  payload: T;
  issuer: string; // e.g., 'User', 'System', 'Emma'
  timestamp: number;
  state: CommandState;
}

export class CommandBus {
  private static instance: CommandBus;
  private pendingCommands: Map<string, SystemCommand> = new Map();

  private constructor() {
    // Command Bus operates silently until invoked
  }

  public static getInstance(): CommandBus {
    if (!CommandBus.instance) {
      CommandBus.instance = new CommandBus();
    }
    return CommandBus.instance;
  }

  /**
   * Dispatches a command to the system. 
   * Generates a correlation ID if not provided.
   */
  public dispatch<T>(name: string, target: string, payload: T, issuer: string = 'System', correlationId?: string): SystemCommand<T> {
    const id = correlationId || crypto.randomUUID();
    
    const cmd: SystemCommand<T> = {
      id,
      name,
      target,
      payload,
      issuer,
      timestamp: Date.now(),
      state: 'PENDING'
    };

    this.pendingCommands.set(id, cmd);

    // Audit the command ingestion
    AuditLedger.getInstance().record(
      issuer,
      'COMMAND_DISPATCHED',
      { commandName: name, target },
      id
    );

    // Alert the system that a command has arrived
    EventBus.getInstance().emit(
      'CommandBus',
      'COMMAND_RECEIVED',
      cmd,
      'high',
      id
    );

    return cmd;
  }

  /**
   * Update command state and notify listeners.
   */
  public updateCommandState(id: string, state: CommandState, details?: any) {
    const cmd = this.pendingCommands.get(id);
    if (!cmd) {
      console.error(`[CommandBus] Cannot update unknown command: ${id}`);
      return;
    }

    cmd.state = state;
    this.pendingCommands.set(id, cmd);

    EventBus.getInstance().emit(
      'CommandBus',
      `COMMAND_STATE_CHANGED`,
      { commandId: id, newState: state, details },
      'normal',
      id
    );

    // Audit terminal states
    if (['COMPLETED', 'FAILED', 'ROLLED_BACK'].includes(state)) {
      AuditLedger.getInstance().record(
        'CommandBus',
        `COMMAND_${state}`,
        { commandName: cmd.name, details },
        id
      );
      this.pendingCommands.delete(id);
    }
  }

  public getPendingCommands(): SystemCommand[] {
    return Array.from(this.pendingCommands.values());
  }
}
