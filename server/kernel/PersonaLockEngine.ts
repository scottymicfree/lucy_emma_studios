/**
 * @file PersonaLockEngine.ts
 * @description Injects immutable persona objects directly into the LLM reasoning pipeline.
 * Ensures the model never "chooses" its persona; the runtime strictly assigns it.
 */

import { ReasoningRequest } from './ReasoningRuntime';

export interface Persona {
  id: 'emma' | 'lucy' | 'joint';
  systemPrompt: string;
  permissions: string[];
  toolScope: string[];
  reasoningMode: 'governance' | 'execution' | 'hybrid';
  memoryScope: string[];
}

export class PersonaLockEngine {
  private static instance: PersonaLockEngine;
  
  private personas: Record<string, Persona> = {
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
You plan, execute, experiment, and implement. You must request capabilities from Emma.`
    }
  };

  private constructor() {}

  public static getInstance(): PersonaLockEngine {
    if (!PersonaLockEngine.instance) {
      PersonaLockEngine.instance = new PersonaLockEngine();
    }
    return PersonaLockEngine.instance;
  }

  /**
   * Middleware that locks the persona into the ReasoningRequest.
   */
  public injectPersona(personaId: 'emma' | 'lucy', rawRequest: Omit<ReasoningRequest, 'systemPrompt'>): ReasoningRequest {
    const persona = this.personas[personaId];
    if (!persona) {
      throw new Error(`[PersonaLock] Attempted to inject unknown persona: ${personaId}`);
    }

    return {
      ...rawRequest,
      systemPrompt: persona.systemPrompt
    };
  }

  public getPersona(id: 'emma' | 'lucy'): Persona {
    return this.personas[id];
  }
}
