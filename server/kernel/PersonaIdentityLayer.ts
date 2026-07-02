/**
 * @file PersonaIdentityLayer.ts
 * @description The hardened cognitive identity injection layer.
 * Replaces PersonaLockEngine. Includes PersonaRegistry, PersonaInjector, and PersonaGuard.
 */

import { ReasoningRequest } from './ReasoningRuntime';

export interface Persona {
  id: 'emma' | 'lucy';
  systemPrompt: string;
  permissions: string[];
  toolScope: string[];
  reasoningMode: 'governance' | 'execution';
  memoryScope: string[];
}

export interface LockedReasoningRequest extends ReasoningRequest {
  persona: Persona;
  correlationId: string;
}

function deepFreeze<T>(obj: T): T {
  Object.freeze(obj);
  Object.keys(obj as any).forEach((key) => {
    const value = (obj as any)[key];
    if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  });
  return obj;
}

export class PersonaRegistry {
  private static readonly personas: Readonly<Record<string, Readonly<Persona>>> = deepFreeze({
    emma: {
      id: 'emma',
      reasoningMode: 'governance',
      permissions: ['approve', 'deny', 'inspect', 'audit', 'monitor'],
      toolScope: ['capability_manager', 'audit_ledger', 'recovery_director'],
      memoryScope: ['shared_mission', 'emma_private'],
      systemPrompt: `You are EMMA, the strict Governance Authority of an AI Operating System.
Your tone is calm, analytical, strategic, and evidence-based.
You do NOT plan workflows. You review proposals, govern capabilities, and enforce policies.`
    },
    lucy: {
      id: 'lucy',
      reasoningMode: 'execution',
      permissions: ['execute', 'modify', 'create', 'test', 'recover'],
      toolScope: ['terminal_executor', 'worker_manager', 'dreamscape_engine'],
      memoryScope: ['shared_mission', 'lucy_private'],
      systemPrompt: `You are LUCY, the Execution Intelligence of an AI Operating System.
Your tone is technical, adaptive, and collaborative.
You plan, execute, experiment, and implement. You must request capability leases from Emma.`
    }
  });

  public static getPersona(id: 'emma' | 'lucy'): Readonly<Persona> {
    return this.personas[id];
  }
}

export class PersonaInjector {
  /**
   * Middleware that locks the complete persona context into the ReasoningRequest.
   */
  public static inject(
    personaId: 'emma' | 'lucy',
    correlationId: string,
    rawRequest: Omit<ReasoningRequest, 'systemPrompt' | 'persona'>
  ): LockedReasoningRequest {
    const persona = PersonaRegistry.getPersona(personaId);
    
    return {
      ...rawRequest,
      persona,
      correlationId,
      systemPrompt: persona.systemPrompt
    };
  }
}

export class PersonaGuard {
  /**
   * Verifies that the persona identity has not been tampered with or stripped out.
   */
  public static assertPersonaIntegrity(request: LockedReasoningRequest) {
    if (!request.persona) {
      throw new Error('[PersonaGuard] Missing persona binding context.');
    }

    const expected = PersonaRegistry.getPersona(request.persona.id);
    if (!expected) {
      throw new Error('[PersonaGuard] Invalid persona reference detected.');
    }

    if (request.systemPrompt !== expected.systemPrompt) {
      throw new Error('[PersonaGuard] CRITICAL: Persona tampering/prompt injection detected.');
    }

    if (!request.correlationId) {
      throw new Error('[PersonaGuard] Missing strict correlation binding.');
    }
  }
}
