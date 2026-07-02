/**
 * @file ReasoningRuntime.ts
 * @description Decouples Lucy and Emma from a specific LLM provider (e.g. Ollama).
 * Supports standardizing inputs and outputs for reasoning and validation.
 */

import { ConfigurationManager } from './ConfigurationManager';
import { DiagnosticsEngine } from './DiagnosticsEngine';
import { EventBus } from './EventBus';

export interface ReasoningRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  jsonMode?: boolean;
}

export interface ReasoningResponse {
  text: string;
  durationMs: number;
  tokensGenerated: number;
  error?: string;
}

/**
 * The generic interface all providers must implement.
 */
export interface RuntimeProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  generate(request: ReasoningRequest): Promise<ReasoningResponse>;
}

export class ReasoningRuntime {
  private static instance: ReasoningRuntime;
  private activeProvider: RuntimeProvider;

  private constructor() {
    this.activeProvider = this.initializeProvider();
    this.performHealthCheck();
  }

  public static getInstance(): ReasoningRuntime {
    if (!ReasoningRuntime.instance) {
      ReasoningRuntime.instance = new ReasoningRuntime();
    }
    return ReasoningRuntime.instance;
  }

  private initializeProvider(): RuntimeProvider {
    const config = ConfigurationManager.getInstance().getConfig('Models');
    
    // Abstract factory logic. Currently we only have the Ollama skeleton built.
    if (config?.primaryRuntime === 'OpenAI-Compatible') {
      return new OllamaProvider('OpenAI-Compatible', config.endpoint); // Fallback to ollama for now
    }
    
    return new OllamaProvider('Ollama', config?.endpoint || 'http://localhost:11434');
  }

  private async performHealthCheck() {
    try {
      const isUp = await this.activeProvider.isAvailable();
      DiagnosticsEngine.getInstance().reportHealth(
        'ReasoningRuntime', 
        isUp ? 'Healthy' : 'Critical', 
        0, 
        [this.activeProvider.name]
      );
    } catch (err) {
      DiagnosticsEngine.getInstance().reportHealth('ReasoningRuntime', 'Offline', 0, [this.activeProvider.name]);
    }
  }

  /**
   * Universal entry point for Emma and Lucy to request reasoning.
   */
  public async generate(request: ReasoningRequest, correlationId: string): Promise<ReasoningResponse> {
    EventBus.getInstance().emit('ReasoningRuntime', 'GENERATION_STARTED', { provider: this.activeProvider.name }, 'normal', correlationId);
    
    const response = await this.activeProvider.generate(request);
    
    if (response.error) {
      EventBus.getInstance().emit('ReasoningRuntime', 'GENERATION_FAILED', { error: response.error }, 'high', correlationId);
      DiagnosticsEngine.getInstance().reportHealth('ReasoningRuntime', 'Degraded');
    } else {
      EventBus.getInstance().emit('ReasoningRuntime', 'GENERATION_COMPLETED', { durationMs: response.durationMs }, 'normal', correlationId);
      DiagnosticsEngine.getInstance().reportHealth('ReasoningRuntime', 'Healthy', response.durationMs);
    }

    return response;
  }
}

/**
 * Standard Ollama Provider Implementation
 */
class OllamaProvider implements RuntimeProvider {
  public name: string;
  private endpoint: string;

  constructor(name: string, endpoint: string) {
    this.name = name;
    this.endpoint = endpoint;
  }

  public async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.endpoint}/api/tags`);
      return res.ok;
    } catch {
      return false;
    }
  }

  public async generate(request: ReasoningRequest): Promise<ReasoningResponse> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3', // Configurable in the future
          system: request.systemPrompt,
          prompt: request.userPrompt,
          stream: false,
          format: request.jsonMode ? 'json' : undefined,
          options: {
            temperature: request.temperature ?? 0.7,
          }
        })
      });

      if (!res.ok) {
        throw new Error(`Ollama HTTP Error: ${res.statusText}`);
      }

      const data = await res.json();
      return {
        text: data.response,
        durationMs: Date.now() - start,
        tokensGenerated: data.eval_count || 0
      };
    } catch (err: any) {
      return {
        text: '',
        durationMs: Date.now() - start,
        tokensGenerated: 0,
        error: err.message
      };
    }
  }
}
