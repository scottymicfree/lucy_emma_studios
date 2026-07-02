/**
 * @file CapabilityFirewall.ts
 * @description Hard enforcement layer sitting between reasoning outputs and tool execution.
 * Intercepts tool requests and prevents execution without an active, correlation-bound CapabilityLease.
 */

import { CapabilityManager } from './CapabilityManager';
import { LockedReasoningRequest, PersonaGuard } from './PersonaIdentityLayer';
import { EventBus } from './EventBus';
import { AuditLedger } from './AuditLedger';
import { Emma } from './Emma';

export interface ToolRequest {
  personaContext: LockedReasoningRequest;
  toolId: string;
  requiredCapability: string;
  payload: any;
  correlationId: string;
}

export class CapabilityFirewall {
  private static instance: CapabilityFirewall;

  private constructor() {}

  public static getInstance(): CapabilityFirewall {
    if (!CapabilityFirewall.instance) {
      CapabilityFirewall.instance = new CapabilityFirewall();
    }
    return CapabilityFirewall.instance;
  }

  /**
   * Evaluates if a tool request is authorized to proceed to the ToolRegistry.
   * Throws an error or escalates to Emma if unauthorized.
   */
  public async authorizeToolExecution(request: ToolRequest): Promise<boolean> {
    // 1. Verify Persona Identity Integrity
    PersonaGuard.assertPersonaIntegrity(request.personaContext);

    const persona = request.personaContext.persona;

    // 2. Validate Baseline Tool Scope
    if (!persona.toolScope.includes(request.toolId)) {
      this.logRejection(request, 'TOOL_OUT_OF_SCOPE');
      throw new Error(`[Firewall] Tool not in persona scope: ${request.toolId}`);
    }

    // 3. Lookup Active Capability Lease
    const lease = CapabilityManager.getInstance().getActiveLease(
      persona.id,
      request.requiredCapability,
      request.correlationId
    );

    if (!lease) {
      EventBus.getInstance().emit('CapabilityFirewall', 'LEASE_MISSING_ESCALATING', { 
        capability: request.requiredCapability 
      }, 'high', request.correlationId);

      // Escalate to Emma for Governance Approval
      return await Emma.getInstance().evaluateCapability(request, request.requiredCapability);
    }

    // 4. Enforce Expiration TTL
    if (Date.now() > lease.expiresAt) {
      this.logRejection(request, 'LEASE_EXPIRED');
      throw new Error(`[Firewall] Capability lease expired for ${request.requiredCapability}.`);
    }

    // 5. Authorized
    EventBus.getInstance().emit('CapabilityFirewall', 'EXECUTION_AUTHORIZED', { 
      toolId: request.toolId, 
      leaseId: lease.capability 
    }, 'normal', request.correlationId);

    return true;
  }

  private logRejection(request: ToolRequest, reason: string) {
    EventBus.getInstance().emit('CapabilityFirewall', 'EXECUTION_REJECTED', { 
      toolId: request.toolId, 
      reason 
    }, 'high', request.correlationId);

    AuditLedger.getInstance().record('CapabilityFirewall', 'EXECUTION_REJECTED', {
      toolId: request.toolId,
      reason,
      persona: request.personaContext.persona.id
    }, request.correlationId);
  }
}
