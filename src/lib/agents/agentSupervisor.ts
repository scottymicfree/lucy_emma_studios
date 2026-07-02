/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentExecutionLog } from '../../types';
import { useNodeStore } from '../../store/useNodeStore';

/**
 * AgentSupervisor: Governs all micro-agents to prevent conflicting actions
 * and enforce system-wide priorities.
 */
export class AgentSupervisor {
  private static instance: AgentSupervisor;
  private logs: AgentExecutionLog[] = [];
  private cooldowns: Map<string, number> = new Map();
  private priorities = {
    'SafetyAgent': 100,
    'OptimizationAgent': 50,
    'MonitorAgent': 10
  };

  private constructor() {}

  static getInstance(): AgentSupervisor {
    if (!this.instance) {
      this.instance = new AgentSupervisor();
    }
    return this.instance;
  }

  /**
   * Requests permission for an agent to perform an action.
   */
  async requestAction(agentId: string, action: string): Promise<boolean> {
    if (!this.canRequestAction(agentId)) {
      this.logAction(agentId, action, 'blocked', 'Cooldown active');
      return false;
    }

    // 2. Check for conflicting active actions
    // In a real app, we'd check if another high-priority agent is currently executing a conflicting task
    const isConflicting = this.checkConflicts(agentId, action);
    if (isConflicting) {
      this.logAction(agentId, action, 'blocked', 'Priority conflict detected');
      return false;
    }

    const now = Date.now();
    this.cooldowns.set(agentId, now);
    this.logAction(agentId, action, 'success');
    return true;
  }

  /**
   * Pre-checks if an agent can perform an action without logging.
   */
  canRequestAction(agentId: string): boolean {
    const now = Date.now();
    const lastExec = this.cooldowns.get(agentId) || 0;
    const cooldown = 5000; // Default 5s cooldown between agent actions
    return (now - lastExec >= cooldown);
  }

  private checkConflicts(agentId: string, action: string): boolean {
    const state = useNodeStore.getState();
    const agentPriority = (this.priorities as any)[agentId] || 0;

    // Example: If SafetyAgent is active (priority 100), block lower priority optimization actions
    if (agentId === 'OptimizationAgent' && state.throttling.active && state.throttling.level === 3) {
      return true; // Safety first
    }

    return false;
  }

  private logAction(agentId: string, action: string, status: 'success' | 'blocked' | 'failed', reason?: string) {
    const log: AgentExecutionLog = {
      agentId,
      action,
      priority: (this.priorities as any)[agentId] || 0,
      timestamp: Date.now(),
      status,
      reason
    };

    this.logs.push(log);
    if (this.logs.length > 100) this.logs.shift();
    
    if (status !== 'success') {
      console.warn(`[AgentSupervisor] Action ${action} by ${agentId} was ${status}: ${reason}`);
    }
  }

  getLogs() {
    return this.logs;
  }
}
