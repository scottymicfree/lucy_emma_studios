/**
 * @file TerminalExecutor.ts
 * @description Bare-metal OS execution engine. Spawns child processes (PowerShell, CMD, Bash) 
 * and streams stdout/stderr directly to the Event Bus for the frontend to observe.
 */

import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { EventBus } from './EventBus';
import { CapabilityManager } from './CapabilityManager';

export interface ExecutionOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
}

export class TerminalExecutor {
  private static instance: TerminalExecutor;
  private activeProcesses: Map<string, ChildProcessWithoutNullStreams> = new Map();

  private constructor() {}

  public static getInstance(): TerminalExecutor {
    if (!TerminalExecutor.instance) {
      TerminalExecutor.instance = new TerminalExecutor();
    }
    return TerminalExecutor.instance;
  }

  /**
   * Executes a command on the bare-metal OS using PowerShell.
   * Requires the 'execute_powershell' capability.
   */
  public executePowerShell(command: string, correlationId: string, options: ExecutionOptions = {}): boolean {
    // 1. Capability Validation (Governance Gate)
    if (!CapabilityManager.getInstance().hasCapability('execute_powershell')) {
      console.error(`[TerminalExecutor] Blocked execution of: ${command}. Capability 'execute_powershell' missing or revoked.`);
      EventBus.getInstance().emit(
        'TerminalExecutor',
        'EXECUTION_BLOCKED',
        { command, reason: 'Missing capability: execute_powershell' },
        'high',
        correlationId
      );
      return false;
    }

    EventBus.getInstance().emit('TerminalExecutor', 'PROCESS_STARTED', { command, platform: 'powershell' }, 'normal', correlationId);

    // 2. Spawn Process
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env },
    });

    this.activeProcesses.set(correlationId, child);

    // 3. Stream stdout to EventBus
    child.stdout.on('data', (data: Buffer) => {
      EventBus.getInstance().emit('TerminalExecutor', 'STDOUT', { data: data.toString() }, 'normal', correlationId);
    });

    // 4. Stream stderr to EventBus
    child.stderr.on('data', (data: Buffer) => {
      EventBus.getInstance().emit('TerminalExecutor', 'STDERR', { data: data.toString() }, 'normal', correlationId);
    });

    // 5. Handle Process Completion
    child.on('close', (code: number | null) => {
      this.activeProcesses.delete(correlationId);
      EventBus.getInstance().emit(
        'TerminalExecutor',
        'PROCESS_CLOSED',
        { code, success: code === 0 },
        code === 0 ? 'normal' : 'high',
        correlationId
      );
    });

    child.on('error', (err: Error) => {
      this.activeProcesses.delete(correlationId);
      EventBus.getInstance().emit(
        'TerminalExecutor',
        'PROCESS_ERROR',
        { error: err.message },
        'critical',
        correlationId
      );
    });

    // Optional timeout
    if (options.timeoutMs) {
      setTimeout(() => {
        if (this.activeProcesses.has(correlationId)) {
          this.killProcess(correlationId);
          EventBus.getInstance().emit('TerminalExecutor', 'PROCESS_TIMEOUT', { command }, 'high', correlationId);
        }
      }, options.timeoutMs);
    }

    return true;
  }

  /**
   * Forcibly terminates an active process.
   */
  public killProcess(correlationId: string): boolean {
    const child = this.activeProcesses.get(correlationId);
    if (child) {
      child.kill('SIGKILL');
      this.activeProcesses.delete(correlationId);
      EventBus.getInstance().emit('TerminalExecutor', 'PROCESS_KILLED', { reason: 'manual_intervention' }, 'high', correlationId);
      return true;
    }
    return false;
  }
}
