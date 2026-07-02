/**
 * @file ExecutionAuthorityLayer.ts
 * @description The Execution Authority Layer (EAL). The absolute final gate before anything runs.
 * Funnels all SystemCalls through the 9-layer dominance hierarchy.
 */

import { CapabilityFirewall } from './CapabilityFirewall';
import { ResourceManager, ResourceRequest } from './ResourceManager';
import { SystemState } from './SystemState';
import { EventBus } from './EventBus';

export type SystemCallType = 'execute_tool' | 'spawn_node' | 'device_io' | 'repair_system' | 'narrative_update';

export interface SystemCall {
  id: string;
  type: SystemCallType;
  payload: any;
  correlationId: string;
  requiredCapabilities: string[];
  resourceRequest: ResourceRequest;
}

export class ExecutionAuthorityLayer {
  private static instance: ExecutionAuthorityLayer;

  private constructor() {}

  public static getInstance(): ExecutionAuthorityLayer {
    if (!ExecutionAuthorityLayer.instance) {
      ExecutionAuthorityLayer.instance = new ExecutionAuthorityLayer();
    }
    return ExecutionAuthorityLayer.instance;
  }

  /**
   * The single entrypoint for ALL execution.
   */
  public async execute(syscall: SystemCall, currentState: SystemState): Promise<any> {
    
    // 1. Kernel Status Check (Kernel overrides all)
    if (currentState.kernelStatus === 'safe_mode' || currentState.kernelStatus === 'rollback_mode') {
      if (syscall.type !== 'repair_system') {
        throw new Error(`[EAL] Execution denied. Kernel is in ${currentState.kernelStatus}.`);
      }
    }

    // 2. Capability Firewall (Permission gate)
    for (const cap of syscall.requiredCapabilities) {
      const isAuthorized = await CapabilityFirewall.getInstance().verifyCapability(cap, syscall.correlationId);
      if (!isAuthorized) {
        throw new Error(`[EAL] Capability Denied: ${cap}`);
      }
    }

    // 3. Resource Manager (Capacity gate)
    const resourceGranted = await ResourceManager.getInstance().requestResources(syscall.id, syscall.resourceRequest);
    if (!resourceGranted) {
        throw new Error(`[EAL] Resource starvation. Call ${syscall.id} denied.`);
    }

    // 4. TRC / Execution Routing
    try {
      EventBus.getInstance().emit('EAL', 'SYSCALL_STARTED', { syscallId: syscall.id, type: syscall.type }, 'normal', syscall.correlationId);

      // In a full implementation, this routes to the Scheduler, which then executes the payload
      // For now, we simulate execution success.
      
      const result = { status: 'success', data: 'Simulated Execution' };
      
      EventBus.getInstance().emit('EAL', 'SYSCALL_COMPLETED', { syscallId: syscall.id }, 'normal', syscall.correlationId);
      
      return result;
    } finally {
      // 5. Release Resources
      ResourceManager.getInstance().releaseResources(syscall.id);
    }
  }
}
