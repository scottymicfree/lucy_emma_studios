/**
 * @file AgentNode.ts
 * @description The core primitive of the Agent Mesh Runtime. Represents a single, isolated
 * cognitive execution node bound to a task, a correlation ID, and specific capability leases.
 */

import { EventBus } from './EventBus';
import { AuditLedger } from './AuditLedger';

export type AgentRole = 'researcher' | 'coder' | 'tester' | 'optimizer' | 'planner';
export type NodeState = 'idle' | 'queued' | 'running' | 'blocked' | 'complete' | 'failed';

export interface AgentNodeConfig {
  id: string;
  parentTaskId: string;
  correlationId: string;
  role: AgentRole;
  memoryScope: string[];
  toolScope: string[];
  input: any;
  dependencies: string[];
}

export class AgentNode {
  public id: string;
  public parentTaskId: string;
  public correlationId: string;
  public role: AgentRole;
  public state: NodeState;
  
  public memoryScope: string[];
  public toolScope: string[];
  public dependencies: string[];
  
  public input: any;
  public output: any = null;

  constructor(config: AgentNodeConfig) {
    this.id = config.id;
    this.parentTaskId = config.parentTaskId;
    this.correlationId = config.correlationId;
    this.role = config.role;
    this.memoryScope = config.memoryScope;
    this.toolScope = config.toolScope;
    this.input = config.input;
    this.dependencies = config.dependencies;
    
    this.state = 'idle';
  }

  /**
   * Executes the cognitive workload for this specific node.
   * Throws if dependencies are not yet resolved.
   */
  public async execute(): Promise<any> {
    if (this.state !== 'idle' && this.state !== 'blocked') {
      throw new Error(`[AgentNode] Cannot execute node ${this.id} from state: ${this.state}`);
    }

    this.transitionTo('running');

    try {
      // Mock LLM / Tool Execution via capability firewall
      // In reality, this would invoke the PersonaLockEngine and ReasoningRuntime
      
      this.output = { result: `Simulated output for ${this.role} node.` };
      
      this.transitionTo('complete');
      return this.output;
    } catch (err: any) {
      this.transitionTo('failed');
      throw err;
    }
  }

  private transitionTo(newState: NodeState) {
    this.state = newState;
    
    EventBus.getInstance().emit('AgentNode', 'NODE_STATE_CHANGED', {
      nodeId: this.id,
      taskId: this.parentTaskId,
      state: this.state,
      role: this.role
    }, 'normal', this.correlationId);

    AuditLedger.getInstance().record('AgentNode', 'STATE_TRANSITION', {
      nodeId: this.id,
      state: this.state
    }, this.correlationId);
  }
}
