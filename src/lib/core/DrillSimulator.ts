import { useNodeStore } from "../../store/useNodeStore";
import { EventPriority, NodeStatus } from "../../types";

export const triggerAnomalyDrill = () => {
  const store = useNodeStore.getState();

  // Set global intent to handle the crisis
  store.setMetaState({ globalIntent: "anomaly_mitigation_and_mr_safety" });

  store.addInsight({
    sourceNodeId: "SYSTEM",
    type: "critical",
    message:
      "INITIATING MULTI-AGENT ANOMALY DRILL. Injecting 5 simultaneous anomalies across Unreal & MR environments.",
    score: 1.0,
  });

  // Find relevant nodes to assign anomalies to
  const nodes = store.nodes;
  const getNodesBySubsystem = (sub: string) =>
    nodes.filter((n) => n.subsystem === sub);

  const executionNodes = getNodesBySubsystem("execution");
  const telemetryNodes = getNodesBySubsystem("telemetry");
  const securityNodes = getNodesBySubsystem("security");

  // 1. Unexpected NPC Behavior
  if (executionNodes[0]) {
    store.updateNode(executionNodes[0].id, { status: NodeStatus.ANOMALY });
    store.addInsight({
      sourceNodeId: executionNodes[0].id,
      type: "anomaly",
      message: "Pedestrian logic failure: 3 entities walking into traffic.",
      score: 0.8,
    });
  }

  // 2. Vehicle Path Deviation
  if (executionNodes[1]) {
    store.updateNode(executionNodes[1].id, { status: NodeStatus.ALERT });
    store.addInsight({
      sourceNodeId: executionNodes[1].id,
      type: "anomaly",
      message: "Vehicle path deviation: 2 vehicles ignoring traffic rules.",
      score: 0.6,
    });
  }

  // 3. MR User Interaction Conflict
  if (telemetryNodes[0]) {
    store.updateNode(telemetryNodes[0].id, { status: NodeStatus.ERROR });
    store.addInsight({
      sourceNodeId: telemetryNodes[0].id,
      type: "anomaly",
      message:
        "MR User Interaction Conflict: Simultaneous grab attempt on NPC_84.",
      score: 0.9,
    });
  }

  // 4. Object/Obstacle Spawn
  if (telemetryNodes[1]) {
    store.updateNode(telemetryNodes[1].id, { status: NodeStatus.ACTIVE });
    store.addInsight({
      sourceNodeId: telemetryNodes[1].id,
      type: "pattern",
      message: "Dynamic obstacle spawned in NPC path (Crate_01).",
      score: 0.5,
    });
  }

  // 5. Hidden Threat Detection
  if (securityNodes[0]) {
    store.updateNode(securityNodes[0].id, { status: NodeStatus.THINKING });
    store.addInsight({
      sourceNodeId: securityNodes[0].id,
      type: "anomaly",
      message: "Hidden threat detected: Cloaked NPC moving behind cover.",
      score: 0.7,
    });
  }

  // Fail-Safe Triggers (Simulated threshold breaches)
  setTimeout(() => {
    if (securityNodes[1]) {
      store.updateNode(securityNodes[1].id, { status: NodeStatus.ERROR });
      store.addInsight({
        sourceNodeId: securityNodes[1].id,
        type: "critical",
        message:
          "CRITICAL: NPC collisions exceeded threshold (5). Triggering N0 Guardian rollback.",
        score: 1.0,
      });
    }
  }, 8000);

  setTimeout(() => {
    if (telemetryNodes[2]) {
      store.updateNode(telemetryNodes[2].id, { status: NodeStatus.ALERT });
      store.addInsight({
        sourceNodeId: telemetryNodes[2].id,
        type: "anomaly",
        message:
          "MR latency spiked above 50ms. Activating Ghost Mode predictive smoothing.",
        score: 0.6,
      });
    }
  }, 12000);
};
