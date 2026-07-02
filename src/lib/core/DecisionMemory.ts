import { DecisionRecord } from "../../types";
import { useNodeStore } from "../../store/useNodeStore";

export const decisionMemory: DecisionRecord[] = [];

export function recordDecision(record: DecisionRecord) {
  decisionMemory.push(record);
}

export function adjustNodeWeight(
  nodeId: string,
  outcome: "success" | "failure" | "partial_failure",
) {
  const state = useNodeStore.getState();
  const node = state.nodes.find((n) => n.id === nodeId);
  if (!node) return;

  if (outcome === "success") {
    state.updateNode(nodeId, { weight: Math.min(node.weight + 0.05, 10) });
  } else if (outcome === "failure") {
    state.updateNode(nodeId, { weight: Math.max(node.weight - 0.05, 0.1) });
  } else if (outcome === "partial_failure") {
    state.updateNode(nodeId, { weight: Math.max(node.weight - 0.02, 0.1) });
  }
}
