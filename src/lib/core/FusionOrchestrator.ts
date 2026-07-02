import {
  ReasoningDAG,
  ExecutionTrace,
  GlobalContext,
  NodeContext,
  ReasoningNode,
  FusionPlan,
} from "../../types";
import { DagReasoningEngine } from "./dagReasoningEngine";
import { TraceManager } from "./TraceManager";
import { generateIntelligence } from "../llama";

export class FusionOrchestrator {
  private static instance: FusionOrchestrator;
  private dagEngine: DagReasoningEngine;
  private traceManager: TraceManager;

  private constructor() {
    this.dagEngine = DagReasoningEngine.getInstance();
    this.traceManager = TraceManager.getInstance();
  }

  public static getInstance(): FusionOrchestrator {
    if (!FusionOrchestrator.instance) {
      FusionOrchestrator.instance = new FusionOrchestrator();
    }
    return FusionOrchestrator.instance;
  }

  public async runEpisode(
    userQuery: string,
    problemGraph: any,
    dag: ReasoningDAG,
    onProgress?: (msg: string) => void,
  ): Promise<{ answer: any; trace: ExecutionTrace }> {
    if (onProgress)
      onProgress(
        `[Fusion] Starting reasoning episode for query: "${userQuery}"`,
      );

    let global: GlobalContext = {
      sessionId: `session_${Date.now()}`,
      userQuery,
      problemGraph,
      ragContext: {},
      hyperContext: {},
      dag,
      config: {
        maxDepth: 32,
        maxTokens: 4096,
        retrievalAggressiveness: "medium",
      },
    };

    const trace = this.traceManager.startTrace(global.sessionId, dag);

    const order = this.dagEngine["topologicalSort"]
      ? this.dagEngine["topologicalSort"](dag)
      : Array.from(dag.nodes.keys());
    if (onProgress)
      onProgress(`[Fusion] Topological order computed: ${order.join(" -> ")}`);

    for (const nodeId of order) {
      const node = dag.nodes.get(nodeId);
      if (!node) continue;

      if (onProgress)
        onProgress(`[Fusion] Processing node ${node.id} (${node.type})`);

      const inputs = node.inputRefs.map((id) => dag.nodes.get(id)?.result);

      const nodeCtx = await this.buildNodeContext(
        global,
        node,
        inputs,
        onProgress,
      );
      const result = await this.runFusedNode(nodeCtx, onProgress);

      node.result = result;
      node.status = "done";

      global = this.updateGlobalContext(global, nodeCtx, result);

      this.traceManager.logStep(trace, nodeCtx, result);

      if (onProgress) onProgress(`[Fusion] Completed node ${node.id}.`);
    }

    const finalResult = dag.nodes.get(dag.goalNode)?.result;
    this.traceManager.finishTrace(trace, finalResult);

    if (onProgress) onProgress(`[Fusion] Reasoning episode completed.`);
    return { answer: finalResult, trace };
  }

  private planFusion(node: ReasoningNode, global: GlobalContext): FusionPlan {
    if (node.type === "retrieve") {
      return {
        useRag: true,
        ragPlan: node.payload.retrievalPlan,
        useHyper: false,
      };
    }

    if (node.type === "infer" || node.type === "synthesize") {
      return {
        useRag: true,
        ragPlan: node.payload.retrievalPlan ?? {
          enabled: true,
          queryTemplate: `Context for ${node.payload.topic || "general"}`,
          sources: ["hypergraph"],
          maxItems: 5,
        },
        useHyper: true,
        hyperOps: [
          {
            type: "expand_concept",
            params: { topic: node.payload.topic || node.payload.mode },
          },
          {
            type: "find_relations",
            params: { topic: node.payload.topic || node.payload.mode },
          },
        ],
      };
    }

    return { useRag: false, useHyper: false };
  }

  private async buildNodeContext(
    global: GlobalContext,
    node: ReasoningNode,
    inputs: any[],
    onProgress?: (msg: string) => void,
  ): Promise<NodeContext> {
    const fusionPlan = this.planFusion(node, global);

    let ragSlice = null;
    let hyperSlice = null;

    if (fusionPlan.useRag && fusionPlan.ragPlan) {
      if (onProgress)
        onProgress(
          `[Fusion-RAG] Orchestrating retrieval for: ${fusionPlan.ragPlan.queryTemplate}`,
        );
      try {
        const res = await generateIntelligence(`Act as a retrieval system. Provide 2 concise factual points about: ${fusionPlan.ragPlan.queryTemplate}`, { thinking: false });
        ragSlice = { retrievedDocs: [res.text] };
      } catch (e) {
        ragSlice = { retrievedDocs: [] };
      }
    }

    if (fusionPlan.useHyper && fusionPlan.hyperOps) {
      if (onProgress)
        onProgress(
          `[Fusion-Hypergraph] Expanding world-model concepts for node ${node.id}`,
        );
      hyperSlice = {
        expandedConcepts: fusionPlan.hyperOps.map(
          (op) => `Expanded: ${op.params.topic}`,
        ),
      };
      // Simulate delay
      await new Promise((r) => setTimeout(r, 200));
    }

    return { node, inputs, ragSlice, hyperSlice, global };
  }

  private async runFusedNode(
    ctx: NodeContext,
    onProgress?: (msg: string) => void,
  ): Promise<any> {
    let promptContext = `Task: ${ctx.node.type}\n`;
    promptContext += `Inputs: ${JSON.stringify(ctx.inputs)}\n`;
    if (ctx.ragSlice) promptContext += `RAG Context: ${JSON.stringify(ctx.ragSlice)}\n`;
    if (ctx.hyperSlice) promptContext += `Hypergraph Context: ${JSON.stringify(ctx.hyperSlice)}\n`;

    const response = await generateIntelligence(promptContext, { thinking: true });
    
    let parsedData: any = {};
    try {
        const match = response.text.match(/```json\n([\s\S]*?)\n```/);
        if (match) {
            parsedData = JSON.parse(match[1]);
        } else {
            parsedData = { result: response.text };
        }
    } catch (e) {
        parsedData = { result: response.text };
    }

    switch (ctx.node.type) {
      case "evaluate":
        return {
          confidence: parsedData.confidence || 0.9,
          checks: ctx.node.payload?.checks,
          rag: ctx.ragSlice,
          hyper: ctx.hyperSlice,
          passed: parsedData.passed ?? true,
          details: parsedData
        };
      case "decompose":
        return { subproblems: parsedData.subproblems || ["P1"], parent: ctx.global.userQuery, details: parsedData };
      case "retrieve":
        return { ...parsedData, ragContext: ctx.ragSlice };
      case "infer":
        return { inference: parsedData.result || parsedData.inference, groundedOn: ctx.ragSlice, expandedVia: ctx.hyperSlice, details: parsedData };
      case "synthesize":
        return { synthesis: parsedData.result || parsedData.synthesis, ragContext: ctx.ragSlice, hyperContext: ctx.hyperSlice, outcome: parsedData.outcome || "Coherent" };
      case "compare":
        return { selected: parsedData.selected || ctx.inputs[0], alternatives: ctx.inputs, details: parsedData };
      case "plan":
        return { plan: parsedData.plan || parsedData.result, steps: parsedData.steps || 3, details: parsedData };
      default:
        return { ...parsedData, status: "processed", inputsLength: ctx.inputs.length };
    }
  }

  private updateGlobalContext(
    global: GlobalContext,
    ctx: NodeContext,
    result: any,
  ): GlobalContext {
    return {
      ...global,
      ragContext: { ...global.ragContext, [ctx.node.id]: ctx.ragSlice },
      hyperContext: { ...global.hyperContext, [ctx.node.id]: ctx.hyperSlice },
    };
  }
}
