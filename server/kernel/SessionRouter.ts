/**
 * @file SessionRouter.ts
 * @description The Dual Chat System routing engine. 
 * Routes user inputs through the PersonaLockEngine and manages the 2-phase Joint pipeline.
 */

import { EventBus } from './EventBus';
import { PersonaLockEngine } from './PersonaLockEngine';
import { ReasoningRuntime } from './ReasoningRuntime';
import { AuditLedger } from './AuditLedger';

export type ChatMode = 'lucy' | 'emma' | 'joint';

export class SessionRouter {
  private static instance: SessionRouter;

  private constructor() {}

  public static getInstance(): SessionRouter {
    if (!SessionRouter.instance) {
      SessionRouter.instance = new SessionRouter();
    }
    return SessionRouter.instance;
  }

  /**
   * Main entry point for conversational requests from the frontend UI.
   */
  public async routeRequest(userInput: string, mode: ChatMode, correlationId: string): Promise<string> {
    EventBus.getInstance().emit('SessionRouter', 'REQUEST_ROUTED', { mode, correlationId });

    try {
      if (mode === 'lucy') {
        return await this.executeLucyPipeline(userInput, correlationId);
      } else if (mode === 'emma') {
        return await this.executeEmmaPipeline(userInput, correlationId);
      } else {
        return await this.executeJointPipeline(userInput, correlationId);
      }
    } catch (err: any) {
      console.error('[SessionRouter] Pipeline failed:', err);
      return `Pipeline Failure: ${err.message}`;
    }
  }

  private async executeLucyPipeline(input: string, correlationId: string): Promise<string> {
    const lockedRequest = PersonaLockEngine.getInstance().injectPersona('lucy', {
      userPrompt: input
    });
    const response = await ReasoningRuntime.getInstance().generate(lockedRequest, correlationId);
    
    AuditLedger.getInstance().record('Lucy', 'CHAT_RESPONSE', { input, output: response.text }, correlationId);
    return response.text;
  }

  private async executeEmmaPipeline(input: string, correlationId: string): Promise<string> {
    const lockedRequest = PersonaLockEngine.getInstance().injectPersona('emma', {
      userPrompt: input
    });
    const response = await ReasoningRuntime.getInstance().generate(lockedRequest, correlationId);
    
    AuditLedger.getInstance().record('Emma', 'CHAT_RESPONSE', { input, output: response.text }, correlationId);
    return response.text;
  }

  /**
   * Joint Mode: A strict 2-phase pipeline (Emma critique -> Lucy plan -> Emma validation)
   */
  private async executeJointPipeline(input: string, correlationId: string): Promise<string> {
    EventBus.getInstance().emit('SessionRouter', 'JOINT_PIPELINE_STARTED', { phase: 1 }, 'normal', correlationId);
    
    // Phase 1: Emma critiques the request and provides constraints
    const emmaConstraintRequest = PersonaLockEngine.getInstance().injectPersona('emma', {
      userPrompt: `Analyze this user request and provide strict constraints for Lucy to follow: ${input}`
    });
    const emmaConstraints = await ReasoningRuntime.getInstance().generate(emmaConstraintRequest, correlationId);

    EventBus.getInstance().emit('SessionRouter', 'JOINT_PIPELINE_PHASE2', { phase: 2 }, 'normal', correlationId);

    // Phase 2: Lucy generates a plan based on Emma's constraints
    const lucyPlanRequest = PersonaLockEngine.getInstance().injectPersona('lucy', {
      userPrompt: `User Request: ${input}\n\nConstraints from Governance: ${emmaConstraints.text}\n\nGenerate your response.`
    });
    const lucyResponse = await ReasoningRuntime.getInstance().generate(lucyPlanRequest, correlationId);

    EventBus.getInstance().emit('SessionRouter', 'JOINT_PIPELINE_PHASE3', { phase: 3 }, 'normal', correlationId);

    // Phase 3: Emma performs final validation on Lucy's plan
    const emmaValidationRequest = PersonaLockEngine.getInstance().injectPersona('emma', {
      userPrompt: `User asked: ${input}\nLucy replied: ${lucyResponse.text}\n\nDoes Lucy's reply violate any safety or governance constraints? If yes, provide a safe alternative. If no, repeat her reply exactly.`
    });
    const finalResponse = await ReasoningRuntime.getInstance().generate(emmaValidationRequest, correlationId);

    AuditLedger.getInstance().record('JointPipeline', 'CHAT_RESPONSE', { 
      input, 
      emmaConstraints: emmaConstraints.text, 
      lucyDraft: lucyResponse.text, 
      finalOutput: finalResponse.text 
    }, correlationId);

    return finalResponse.text;
  }
}
