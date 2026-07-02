/**
 * @file CapabilityManager.ts
 * @description The authoritative stateful registry for execution rights.
 * Manages the issuance, retrieval, and revocation of time-bound CapabilityLeases.
 */

import { EventBus } from './EventBus';
import { AuditLedger } from './AuditLedger';

export interface CapabilityLease {
  capability: string;
  grantedBy: 'emma';
  scope: string[];
  expiresAt: number;
  correlationId: string;
}

export class CapabilityManager {
  private static instance: CapabilityManager;
  
  // Maps correlationId -> active leases for that session
  private leases: Map<string, CapabilityLease[]> = new Map();

  private constructor() {}

  public static getInstance(): CapabilityManager {
    if (!CapabilityManager.instance) {
      CapabilityManager.instance = new CapabilityManager();
    }
    return CapabilityManager.instance;
  }

  /**
   * Records an approved capability lease into the registry.
   */
  public grantLease(lease: CapabilityLease) {
    const list = this.leases.get(lease.correlationId) || [];
    list.push(lease);
    this.leases.set(lease.correlationId, list);

    EventBus.getInstance().emit('CapabilityManager', 'LEASE_GRANTED', {
      capability: lease.capability,
      expiresAt: lease.expiresAt
    }, 'normal', lease.correlationId);

    AuditLedger.getInstance().record('CapabilityManager', 'LEASE_GRANTED', lease, lease.correlationId);
  }

  /**
   * Retrieves an active lease if it exists and has not expired.
   */
  public getActiveLease(personaId: string, capability: string, correlationId: string): CapabilityLease | undefined {
    const sessionLeases = this.leases.get(correlationId) || [];

    return sessionLeases.find(l => 
      l.capability === capability && 
      l.expiresAt > Date.now()
    );
  }

  /**
   * Explicitly revokes a lease prior to its expiration.
   */
  public revokeLease(correlationId: string, capability: string, reason: string) {
    const sessionLeases = this.leases.get(correlationId) || [];
    
    this.leases.set(
      correlationId,
      sessionLeases.filter(l => l.capability !== capability)
    );

    EventBus.getInstance().emit('CapabilityManager', 'LEASE_REVOKED', { capability, reason }, 'high', correlationId);
    AuditLedger.getInstance().record('CapabilityManager', 'LEASE_REVOKED', { capability, reason }, correlationId);
  }
}
