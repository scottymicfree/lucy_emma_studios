/**
 * @file CapabilityDecay.ts
 * @description Layer 3: Transformation Pipeline (Entropy-Based Capability Decay).
 * Extends the CapabilityManager's static time-based leases with dynamic entropy decay.
 * If a node behaves suspiciously or erratically (high entropy), its capability lease 
 * collapses mathematically, enforcing Zero-Trust at runtime.
 */

import { CapabilityLease } from './CapabilityManager';

export class CapabilityDecayEngine {
  private static instance: CapabilityDecayEngine;

  private constructor() {}

  public static getInstance(): CapabilityDecayEngine {
    if (!CapabilityDecayEngine.instance) {
      CapabilityDecayEngine.instance = new CapabilityDecayEngine();
    }
    return CapabilityDecayEngine.instance;
  }

  /**
   * Calculates the entropy (unexpectedness) of a specific execution event.
   * In a real system, this compares the event payload against historical baselines.
   */
  private calculateExecutionEntropy(eventPayload: any): number {
    // Mock entropy calculation
    // Return 0.0 for completely expected behavior, 1.0 for completely anomalous
    if (eventPayload.suspiciousFlag) return 0.9;
    if (eventPayload.toolError) return 0.3;
    return 0.05;
  }

  /**
   * Mathematically decays the expiration time of a capability lease based on execution entropy.
   * Returns the new, shortened expiration timestamp.
   */
  public decayLease(lease: CapabilityLease, latestExecutionEvent: any): number {
    const entropy = this.calculateExecutionEntropy(latestExecutionEvent);
    
    if (entropy < 0.1) {
      // Normal execution, no decay applied
      return lease.expiresAt;
    }

    const timeRemaining = lease.expiresAt - Date.now();
    if (timeRemaining <= 0) return lease.expiresAt;

    // Decay formula: remaining time is slashed by the entropy percentage
    // E.g., 0.9 entropy slashes 90% of the remaining time off the lease instantly.
    const decayFactor = 1.0 - entropy;
    const newRemainingTime = timeRemaining * decayFactor;

    return Date.now() + newRemainingTime;
  }
}
