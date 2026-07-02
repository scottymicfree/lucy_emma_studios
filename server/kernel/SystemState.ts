/**
 * @file SystemState.ts
 * @description The authoritative single source of truth for the OS state.
 * All state mutations must be derived via the pure StateTransitionEngine.
 */

import { CapabilityLease } from './CapabilityManager';
import { MeshTask } from './MeshOrchestrator';
import { AgentNode } from './AgentNode';

export type KernelStatus = 'booting' | 'live' | 'degraded' | 'safe_mode' | 'recovery_mode' | 'hard_isolation' | 'rollback_mode';

export interface SystemState {
  kernelStatus: KernelStatus;
  
  // Active execution state
  activeTasks: Map<string, MeshTask>;
  runningNodes: Map<string, AgentNode>;
  
  // Governance state
  capabilityLeases: Map<string, CapabilityLease>;
  
  // Event sourcing pointers
  eventHead: string; // The ID of the last processed event
  
  // Recovery pointers
  snapshotId: string;
  lastCheckpoint: number; // Timestamp
}

export const initialSystemState: SystemState = {
  kernelStatus: 'booting',
  activeTasks: new Map(),
  runningNodes: new Map(),
  capabilityLeases: new Map(),
  eventHead: 'genesis',
  snapshotId: 'none',
  lastCheckpoint: Date.now()
};
