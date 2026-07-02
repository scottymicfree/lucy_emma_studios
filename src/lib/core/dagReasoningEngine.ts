import {
  ReasoningDAG,
  ReasoningNode,
  NodeId,
  ExecutionTrace,
} from "../../types";
import { generateIntelligence } from "../llama";

export class DagReasoningEngine {
  private static instance: DagReasoningEngine;

  private constructor() {}

  public static getInstance(): DagReasoningEngine {
    if (!DagReasoningEngine.instance) {
      DagReasoningEngine.instance = new DagReasoningEngine();
    }
    return DagReasoningEngine.instance;
  }

  public async executeDAG(dag: ReasoningDAG, globalContext: any): Promise<ExecutionTrace> {
    console.log(
      `[DagReasoningEngine] Executing DAG starting at root: ${dag.rootNode}`,
    );
    const order = this.topologicalSort(dag);
    const trace: ExecutionTrace = {
      dagId: `dag_${Date.now()}`,
      steps: [],
      finalResult: null,
    };

    for (const nodeId of order) {
      const node = dag.nodes.get(nodeId);
      if (!node) continue;

      node.status = "running";

      const inputs = node.inputRefs.map((id) => dag.nodes.get(id)?.result);
      const localContext = this.buildLocalContext(globalContext, inputs, node);
      const result = await this.runNode(node, inputs, localContext);

      node.result = result;
      node.status = "done";

      trace.steps.push({
        nodeId,
        type: node.type,
        inputSnapshot: inputs,
        resultSnapshot: result,
        contextUsed: localContext,
        timestamp: Date.now(),
      });
      console.log(
        `[DagReasoningEngine] Executed Node ${nodeId} (${node.type})`,
      );
    }

    const goalNode = dag.nodes.get(dag.goalNode);
    trace.finalResult = goalNode ? goalNode.result : null;
    return trace;
  }

  private topologicalSort(dag: ReasoningDAG): NodeId[] {
    const order: NodeId[] = [];
    const visited = new Set<NodeId>();
    const tempVisited = new Set<NodeId>();

    const visit = (nodeId: NodeId) => {
      if (tempVisited.has(nodeId)) {
        console.error(
          `[DagReasoningEngine] Cycle detected involving node ${nodeId}`,
        );
        return; // Cycle detected
      }
      if (!visited.has(nodeId)) {
        tempVisited.add(nodeId);

        const node = dag.nodes.get(nodeId);
        if (node) {
          for (const childId of node.outputRefs) {
            visit(childId);
          }
        }

        tempVisited.delete(nodeId);
        visited.add(nodeId);
        order.unshift(nodeId); // Post-order traversal
      }
    };

    // Make sure we visit all nodes just in case of disconnected components,
    // though a DAG should technically flow from the root.
    for (const nodeId of dag.nodes.keys()) {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    }

    return order;
  }

  private buildLocalContext(
    globalContext: any,
    inputs: any[],
    node: ReasoningNode,
  ): any {
    // In a real implementation, this would integrate RAG and Hypergraph context
    return {
      global: globalContext,
      nodeType: node.type,
      timestamp: Date.now(),
    };
  }

  private async runNode(node: ReasoningNode, inputs: any[], localContext: any): Promise<any> {
    const promptContext = `Task: ${node.type}\nInputs: ${JSON.stringify(inputs)}\nContext: ${JSON.stringify(localContext)}`;
    try {
      const response = await generateIntelligence(promptContext, { thinking: false });
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
      return { ...parsedData, status: "processed", inputsLength: inputs.length };
    } catch (e) {
      console.error("[DagReasoningEngine] runNode LLM error:", e);
      return { status: "error", error: String(e) };
    }
  }

  // Helper to parse JSON spec into Map-based ReasoningDAG
  public parseSpec(spec: any): ReasoningDAG {
    const nodes = new Map<NodeId, ReasoningNode>();

    spec.ReasoningDAG.nodes.forEach((n: any) => {
      nodes.set(n.id, {
        ...n,
        status: "pending",
        metadata: {
          createdAt: Date.now(),
          tags: [],
        },
      });
    });

    return {
      nodes,
      edges: spec.ReasoningDAG.edges,
      rootNode: spec.ReasoningDAG.rootNode,
      goalNode: spec.ReasoningDAG.goalNode,
    };
  }
}
