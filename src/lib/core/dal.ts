import { useNodeStore } from "../../store/useNodeStore";
import { SafetyAgent, OptimizationAgent } from "../agents/agents";
import { NodeStatus, EventPriority } from "../../types";

export type Decision = "approved" | "denied" | "delayed" | "confirm_required";

export interface DecisionResult {
  decision: Decision;
  reason?: string;
  suggestedDelay?: number;
}

export class DecisionAuthorityLayer {
  private static instance: DecisionAuthorityLayer;
  private safetyAgent = SafetyAgent.getInstance();
  private optimizationAgent = OptimizationAgent.getInstance();

  private constructor() {}

  static getInstance(): DecisionAuthorityLayer {
    if (!this.instance) {
      this.instance = new DecisionAuthorityLayer();
    }
    return this.instance;
  }

  async evaluateAction(
    action: string,
    params: any,
    userRole: string = "user",
  ): Promise<DecisionResult> {
    const state = useNodeStore.getState();

    // 1. Check Load/Throttling
    if (state.throttling.active && state.throttling.level >= 2) {
      if (userRole !== "admin") {
        return {
          decision: "delayed",
          reason: "System load high. Action queued for stability.",
          suggestedDelay: 5000,
        };
      }
    }

    // 2. Check Risk via Safety Agent
    const risk = await this.safetyAgent.evaluateRisk(action, params);

    if (risk === "high") {
      if (userRole !== "admin") {
        return {
          decision: "denied",
          reason: "High risk action restricted to administrative level.",
        };
      }
      return {
        decision: "confirm_required",
        reason: "High risk administrative action detected.",
      };
    }

    if (risk === "medium") {
      return {
        decision: "confirm_required",
        reason: "Action requires explicit verification.",
      };
    }

    // 3. Check Server State (if applicable)
    if (params.serverId) {
      const serverNode = state.nodes.find((n) => n.id === params.serverId);
      if (serverNode && serverNode.status === NodeStatus.ERROR) {
        return {
          decision: "denied",
          reason: "Target server is in ERROR state. Manual recovery required.",
        };
      }
    }

    // 4. Default Approval
    return { decision: "approved" };
  }
}
