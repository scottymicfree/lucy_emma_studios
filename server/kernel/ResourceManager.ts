/**
 * @file ResourceManager.ts
 * @description The Resource Arbitration Layer. Enforces hard limits on compute resources
 * to ensure that parallel task graphs do not starve the host OS or crash the reasoning engine.
 */

import { EventBus } from './EventBus';

export interface ResourceRequest {
  cpu?: number; // 0.0 to 1.0 (percent of allocated core)
  gpu?: boolean; // Requires VRAM access
  memoryMB?: number; 
  threads?: number;
}

export class ResourceManager {
  private static instance: ResourceManager;

  // Mock global limits
  private MAX_MEMORY_MB = 8192; // 8GB
  private usedMemory = 0;
  
  private activeAllocations: Map<string, ResourceRequest> = new Map();

  private constructor() {}

  public static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  /**
   * Attempts to allocate resources for a given system call.
   * Returns true if granted, false if delayed/denied.
   */
  public async requestResources(syscallId: string, req: ResourceRequest): Promise<boolean> {
    const memReq = req.memoryMB || 0;
    
    if (this.usedMemory + memReq > this.MAX_MEMORY_MB) {
      EventBus.getInstance().emit('ResourceManager', 'RESOURCE_DENIED', { syscallId, reason: 'OOM Threshold' }, 'critical');
      return false; // Denial propagates back up to EAL
    }

    this.usedMemory += memReq;
    this.activeAllocations.set(syscallId, req);
    
    return true;
  }

  public releaseResources(syscallId: string) {
    const req = this.activeAllocations.get(syscallId);
    if (req) {
      this.usedMemory -= (req.memoryMB || 0);
      this.activeAllocations.delete(syscallId);
    }
  }
}
