/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useNodeStore } from '../../store/useNodeStore';
import { NodeStatus, EventPriority } from '../../types';
import { AgentSupervisor } from './agentSupervisor';

export class MonitorAgent {
  private static instance: MonitorAgent;
  private interval: any;
  private supervisor = AgentSupervisor.getInstance();

  private constructor() {}

  public static getInstance(): MonitorAgent {
    if (!MonitorAgent.instance) {
      MonitorAgent.instance = new MonitorAgent();
    }
    return MonitorAgent.instance;
  }

  public start() {
    if (this.interval) return;
    // Align interval with supervisor cooldown (5s)
    this.interval = setInterval(() => this.monitor(), 5100);
  }

  public stop() {
    clearInterval(this.interval);
    this.interval = null;
  }

  private async monitor() {
    // Pre-check cooldown to avoid warning spam in logs
    if (!this.supervisor.canRequestAction('MonitorAgent')) return;
    
    if (!(await this.supervisor.requestAction('MonitorAgent', 'check_latency'))) return;

    const { nodes, emitEvent } = useNodeStore.getState();
    const now = Date.now();
    
    // 1. Monitor Node Latency
    const staleNodes = nodes.filter(n => now - n.lastUpdated > 10000 && n.status !== NodeStatus.IDLE);
    if (staleNodes.length > 0) {
      emitEvent('E1', NodeStatus.ANOMALY, EventPriority.SYSTEM, { 
        type: 'stale_nodes', 
        count: staleNodes.length 
      });
    }

    // 2. Monitor Event Rate
    const recentEvents = nodes.filter(n => now - n.lastUpdated < 1000).length;
    if (recentEvents > 30) {
      emitEvent('E1', NodeStatus.HEARTBEAT, EventPriority.SYSTEM, { 
        type: 'high_event_rate', 
        rate: recentEvents 
      });
    }
  }
}

export class SafetyAgent {
  private static instance: SafetyAgent;
  private supervisor = AgentSupervisor.getInstance();

  private constructor() {}

  public static getInstance(): SafetyAgent {
    if (!SafetyAgent.instance) {
      SafetyAgent.instance = new SafetyAgent();
    }
    return SafetyAgent.instance;
  }

  public async evaluateRisk(action: string, params: any): Promise<'low' | 'medium' | 'high'> {
    if (!(await this.supervisor.requestAction('SafetyAgent', `evaluate_${action}`))) return 'high';

    const highRiskActions = ['restart_server', 'delete_resource', 'kick_all'];
    if (highRiskActions.includes(action)) return 'high';
    
    const mediumRiskActions = ['restart_resource', 'kick_player'];
    if (mediumRiskActions.includes(action)) return 'medium';
    
    return 'low';
  }
}

export class OptimizationAgent {
  private static instance: OptimizationAgent;
  private supervisor = AgentSupervisor.getInstance();

  private constructor() {}

  public static getInstance(): OptimizationAgent {
    if (!OptimizationAgent.instance) {
      OptimizationAgent.instance = new OptimizationAgent();
    }
    return OptimizationAgent.instance;
  }

  public async checkThrottling() {
    if (!(await this.supervisor.requestAction('OptimizationAgent', 'optimize_load'))) return;

    const { nodes, setThrottling } = useNodeStore.getState();
    const now = Date.now();
    const recentEvents = nodes.filter(n => now - n.lastUpdated < 1000).length;
    
    if (recentEvents > 50) {
      setThrottling({ active: true, level: 2, reason: 'High Event Rate' });
    } else if (recentEvents > 20) {
      setThrottling({ active: true, level: 1, reason: 'Moderate Load' });
    } else {
      setThrottling({ active: false, level: 0 });
    }
  }
}
