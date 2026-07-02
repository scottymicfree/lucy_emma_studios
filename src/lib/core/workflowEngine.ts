/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Workflow,
  WorkflowStep,
  NodeStatus,
  EventPriority,
  WorkflowCheckpoint,
} from "../../types";
import { useNodeStore } from "../../store/useNodeStore";
import { txAdminAdapter } from "../server_adapters/txAdminAdapter";

export class WorkflowEngine {
  private static instance: WorkflowEngine;
  private activeWorkflows: Map<
    string,
    { workflow: Workflow; startTime: number }
  > = new Map();
  private maxExecutionTime = 300000; // 5 minutes

  private constructor() {
    // Start deadlock detection loop
    setInterval(() => this.detectDeadlocks(), 30000);
  }

  public static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  public async execute(workflow: Workflow, context: any = {}) {
    const state = useNodeStore.getState();
    const emitEvent = state.emitEvent;
    const updateWorkflow = state.updateWorkflow;

    this.activeWorkflows.set(workflow.id, { workflow, startTime: Date.now() });
    updateWorkflow(workflow.id, { status: "running", lastRun: Date.now() });

    // 1. Initialize Workflow Node in NodeMesh
    const workflowNodeId = `WF_${workflow.id}`;
    state.updateNode(workflowNodeId, {
      id: workflowNodeId,
      type: "Workflow",
      subsystem: "orchestration",
      status: NodeStatus.ACTIVE,
      priority: EventPriority.NORMAL,
      position: [15, 15, 0],
      connections: ["E1"],
      lastUpdated: Date.now(),
    });

    emitEvent("E1", NodeStatus.ACTIVE, EventPriority.CRITICAL, {
      action: "workflow_start",
      workflowId: workflow.id,
      name: workflow.name,
    });

    try {
      // Check for existing checkpoint
      const checkpoint = await this.getCheckpoint(workflow.id);
      let startIndex = 0;

      if (checkpoint) {
        console.log(
          `[WorkflowEngine] Resuming workflow ${workflow.id} from step ${checkpoint.stepId}`,
        );
        startIndex = workflow.steps.findIndex(
          (s) => s.id === checkpoint.stepId,
        );
        if (startIndex === -1) startIndex = 0;
        context = { ...context, ...checkpoint.context };
      }

      for (let i = startIndex; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];

        // Update Workflow Node Status
        state.updateNode(workflowNodeId, {
          status: NodeStatus.THINKING,
          metadata: { currentStep: step.name },
        });
        state.emitEvent(
          workflowNodeId,
          NodeStatus.THINKING,
          EventPriority.NORMAL,
          { step: step.name },
        );

        // Create checkpoint before each step
        await this.saveCheckpoint(workflow.id, step.id, context);

        await this.executeStep(step, context, workflow.id, i);
      }

      // Clear checkpoint on success
      await this.clearCheckpoint(workflow.id);

      state.updateNode(workflowNodeId, { status: NodeStatus.IDLE });
      updateWorkflow(workflow.id, { status: "completed" });
      emitEvent("E1", NodeStatus.RESPONDING, EventPriority.CRITICAL, {
        action: "workflow_success",
        workflowId: workflow.id,
      });
    } catch (error) {
      console.error(`[WorkflowEngine] Workflow ${workflow.id} failed:`, error);
      state.updateNode(workflowNodeId, { status: NodeStatus.ERROR });
      updateWorkflow(workflow.id, { status: "failed" });

      // Emit failure trace for observability
      emitEvent("E1", NodeStatus.ERROR, EventPriority.CRITICAL, {
        action: "workflow_failure",
        workflowId: workflow.id,
        error: error instanceof Error ? error.message : "Unknown error",
        trace: new Error().stack,
      });

      // Suggest handbook if failure is recurring
      if (workflow.status === "failed") {
        emitEvent("LP1", NodeStatus.ALERT, EventPriority.SYSTEM, {
          action: "handbook_suggestion",
          topic: `Workflow Failure: ${workflow.name}`,
          reason: "Recurring execution failure detected",
        });
      }

      // Attempt rollback if defined
      await this.handleRollback(workflow, context);
    } finally {
      this.activeWorkflows.delete(workflow.id);
    }
  }

  private async saveCheckpoint(
    workflowId: string,
    stepId: string,
    context: any,
  ) {
    try {
      const stored = JSON.parse(localStorage.getItem('lucy_checkpoints') || '{}');
      stored[workflowId] = {
        workflowId,
        stepId,
        context,
        timestamp: Date.now(),
        userId: 'local-user',
      };
      localStorage.setItem('lucy_checkpoints', JSON.stringify(stored));
    } catch (err) {
      console.error("[WorkflowEngine] Failed to save checkpoint:", err);
    }
  }

  private async getCheckpoint(
    workflowId: string,
  ): Promise<WorkflowCheckpoint | null> {
    try {
      const stored = JSON.parse(localStorage.getItem('lucy_checkpoints') || '{}');
      return stored[workflowId] as WorkflowCheckpoint || null;
    } catch (err) {
      return null;
    }
  }

  private async clearCheckpoint(workflowId: string) {
    try {
      const stored = JSON.parse(localStorage.getItem('lucy_checkpoints') || '{}');
      delete stored[workflowId];
      localStorage.setItem('lucy_checkpoints', JSON.stringify(stored));
    } catch (err) {}
  }

  private detectDeadlocks() {
    const now = Date.now();
    this.activeWorkflows.forEach((data, id) => {
      if (now - data.startTime > this.maxExecutionTime) {
        console.error(
          `[WorkflowEngine] Deadlock detected in workflow ${id}. Terminating.`,
        );
        // In a real app, we'd force terminate the execution context
        this.activeWorkflows.delete(id);
        useNodeStore.getState().updateWorkflow(id, { status: "failed" });
      }
    });
  }

  private async executeStep(
    step: WorkflowStep,
    context: any,
    workflowId: string,
    index: number,
  ) {
    const state = useNodeStore.getState();
    const emitEvent = state.emitEvent;
    emitEvent("E1", NodeStatus.THINKING, EventPriority.NORMAL, {
      action: "workflow_step",
      workflowId,
      stepId: step.id,
    });

    // If step involves a tool, emit ToolExecution event
    if (step.action.includes("tool") || step.action.includes("restart")) {
      const toolNodeId = `TE_${workflowId}_${index}`;
      state.updateNode(toolNodeId, {
        id: toolNodeId,
        type: "ToolExecution",
        subsystem: "execution",
        status: NodeStatus.ACTIVE,
        priority: EventPriority.NORMAL,
        position: [20, 15, 0],
        connections: [`WF_${workflowId}`],
        lastUpdated: Date.now(),
      });
      state.emitEvent(toolNodeId, NodeStatus.ACTIVE, EventPriority.NORMAL, {
        action: step.action,
      });

      // Simulate execution
      await new Promise((resolve) => setTimeout(resolve, 1000));
      state.updateNode(toolNodeId, { status: NodeStatus.IDLE });
    }

    // Handle condition if present
    if (step.condition) {
      const conditionMet = this.evaluateCondition(step.condition, context);
      if (!conditionMet) {
        console.log(
          `[WorkflowEngine] Step ${step.id} skipped - condition not met.`,
        );
        return;
      }
    }

    let retries = step.retry || 0;
    while (retries >= 0) {
      try {
        await this.performAction(step.action, step.params, context);
        return;
      } catch (error) {
        if (retries === 0) throw error;
        retries--;
        console.warn(
          `[WorkflowEngine] Step ${step.id} failed, retrying... (${retries} left)`,
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  private evaluateCondition(condition: string, context: any): boolean {
    // Simple evaluation logic (can be expanded)
    try {
      if (condition === "server_offline")
        return context.serverStatus === "offline";
      if (condition === "high_latency") return context.latency > 500;
      return true;
    } catch (error) {
      return false;
    }
  }

  private async performAction(action: string, params: any, context: any) {
    const adapter = txAdminAdapter.getInstance();

    switch (action) {
      case "restart_resource":
        await adapter.executeAction(
          context.server,
          context.token,
          "restart_resource",
          params,
        );
        break;
      case "notify_mobile":
        console.log(`[WorkflowEngine] Notifying mobile: ${params.message}`);
        // In a real app, this would call a push notification service
        break;
      case "log_event":
        console.log(`[WorkflowEngine] Logging: ${params.message}`);
        break;
      case "wait":
        await new Promise((resolve) =>
          setTimeout(resolve, params.duration || 1000),
        );
        break;
      default:
        throw new Error(`Unsupported workflow action: ${action}`);
    }
  }

  private async handleRollback(workflow: Workflow, context: any) {
    console.log(
      `[WorkflowEngine] Attempting rollback for workflow ${workflow.id}...`,
    );
    for (const step of [...workflow.steps].reverse()) {
      if (step.rollback) {
        try {
          await this.performAction(step.rollback, {}, context);
        } catch (error) {
          console.error(
            `[WorkflowEngine] Rollback step ${step.id} failed:`,
            error,
          );
        }
      }
    }
  }
}
