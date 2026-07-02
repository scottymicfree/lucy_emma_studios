/**
 * @file ToolRealityChecker.ts
 * @description The Tool Reality Checker (TRC). Sits between execution and reasoning.
 * Enforces the No False Agency Rule by evaluating ToolResponses and routing errors structurally.
 */

import { EventBus } from './EventBus';
import { ExecutionAuthorityLayer } from './ExecutionAuthorityLayer';

export interface ToolResponse {
  toolId: string;
  status: 'success' | 'error' | 'partial' | 'timeout' | 'unknown';
  output?: any;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  diagnostics: {
    latencyMs: number;
    retries: number;
    systemLoad?: number;
  };
  repairable: boolean;
}

export type FailureCategory = 'tool_crash' | 'missing_tool' | 'permission_denied' | 'resource_starvation' | 'syntax_error';

export interface RealityEvaluation {
  realityState: 'valid' | 'degraded' | 'failed' | 'invalid';
  actionable: boolean;
  category?: FailureCategory;
  fixabilityScore: number; // 0.0 to 1.0
  recommendedRoute: 'lucy' | 'tool_registry' | 'recovery_director' | 'emma';
}

export class ToolRealityChecker {
  private static instance: ToolRealityChecker;

  private constructor() {}

  public static getInstance(): ToolRealityChecker {
    if (!ToolRealityChecker.instance) {
      ToolRealityChecker.instance = new ToolRealityChecker();
    }
    return ToolRealityChecker.instance;
  }

  /**
   * Evaluates a raw ToolResponse and produces a deterministic RealityEvaluation.
   */
  public evaluate(response: ToolResponse): RealityEvaluation {
    if (response.status === 'success') {
      return {
        realityState: 'valid',
        actionable: false,
        fixabilityScore: 1.0,
        recommendedRoute: 'lucy'
      };
    }

    // Determine category based on error codes (mocked logic)
    let category: FailureCategory = 'tool_crash';
    let route: 'lucy' | 'tool_registry' | 'recovery_director' | 'emma' = 'recovery_director';
    let score = 0.0;

    if (response.error?.code === 'EACCES' || response.error?.code === 'UNAUTHORIZED') {
      category = 'permission_denied';
      route = 'emma';
      score = 0.2; // Requires human/Emma override
    } else if (response.error?.code === 'ENOENT') {
      category = 'missing_tool';
      route = 'tool_registry';
      score = 0.5;
    } else if (response.error?.code === 'SYNTAX') {
      category = 'syntax_error';
      route = 'lucy';
      score = 0.9; // Highly fixable by Lucy
    }

    EventBus.getInstance().emit('TRC', 'REALITY_EVALUATED', {
      toolId: response.toolId,
      category,
      route,
      score
    }, 'normal');

    return {
      realityState: 'failed',
      actionable: response.repairable,
      category,
      fixabilityScore: score,
      recommendedRoute: route
    };
  }
}
