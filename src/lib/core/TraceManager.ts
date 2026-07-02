import { ExecutionTrace, NodeContext, ReasoningDAG } from "../../types";

export class TraceManager {
  private static instance: TraceManager;

  private constructor() {}

  public static getInstance(): TraceManager {
    if (!TraceManager.instance) {
      TraceManager.instance = new TraceManager();
    }
    return TraceManager.instance;
  }

  public startTrace(sessionId: string, dag: ReasoningDAG): ExecutionTrace {
    return {
      dagId: `dag_fusion_${sessionId}_${Date.now()}`,
      steps: [],
      finalResult: null,
    };
  }

  public logStep(
    trace: ExecutionTrace,
    nodeCtx: NodeContext,
    result: any,
  ): void {
    trace.steps.push({
      nodeId: nodeCtx.node.id,
      type: nodeCtx.node.type,
      inputSnapshot: nodeCtx.inputs,
      resultSnapshot: result,
      contextUsed: { rag: nodeCtx.ragSlice, hyper: nodeCtx.hyperSlice },
      timestamp: Date.now(),
    });
  }

  public finishTrace(trace: ExecutionTrace, finalResult: any): void {
    trace.finalResult = finalResult;
  }
}
