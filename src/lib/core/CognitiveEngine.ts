import { useNodeStore } from "../../store/useNodeStore";
import { NodeStatus, EventPriority, Insight, Proposal } from "../../types";
import { collectProposals } from "./ProposalSystem";
import { selectProposals } from "./ProposalSelection";
import { recordDecision, adjustNodeWeight } from "./DecisionMemory";

import { STM } from "./Memory/STM";
import { LTM } from "./Memory/LTM";
import { Embeddings } from "./Memory/Embeddings";

import { generateEmbedding } from "./Llama/EmbeddingAPI";

class CognitiveEngine {
  private static instance: CognitiveEngine;
  private loopInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private previousWinningNodes: string = "";
  private loopVariationCounter: number = 0;
  private loopCount: number = 0;
  private consecutiveFailures: number = 0;

  private constructor() {}

  public static getInstance(): CognitiveEngine {
    if (!CognitiveEngine.instance) {
      CognitiveEngine.instance = new CognitiveEngine();
    }
    return CognitiveEngine.instance;
  }

  private isProcessingTick = false;

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[CognitiveEngine] Autonomous loop started.");

    // Run the cognitive loop every 2 seconds
    this.loopInterval = setInterval(() => {
      this.tick();
    }, 2000);
  }

  public stop() {
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
    this.isRunning = false;
    this.isProcessingTick = false;
    console.log("[CognitiveEngine] Autonomous loop stopped.");
  }

  private async tick() {
    if (this.isProcessingTick) return;
    this.isProcessingTick = true;
    try {
      this.perceive();
      await this.evaluate();
      this.decide();
      await this.act();
    } catch (e) {
      console.error("[CognitiveEngine] Tick error:", e);
    } finally {
      this.isProcessingTick = false;
    }
  }

  // 1. Perceive: Ingest node states and logs
  private perceive() {
    const state = useNodeStore.getState();
    const activeNodes = state.nodes.filter((n) => n.status !== NodeStatus.IDLE);

    // Calculate system load based on active nodes and their energy/weight
    const load = activeNodes.reduce(
      (acc, node) => acc + (node.weight * (100 - node.energy)) / 100,
      0,
    );
    const normalizedLoad = Math.min(100, (load / state.nodes.length) * 100);

    state.setMetaState({ systemLoad: normalizedLoad });
  }

  // 2. Evaluate: Score relevance and anomalies
  private async evaluate() {
    const state = useNodeStore.getState();
    const now = Date.now();

    // Signal Compression Layer: Evaluate recent logs for insights
    for (const [nodeId, logs] of Object.entries(state.nodeLogs)) {
      if (!logs || logs.length === 0) continue;

      const recentLogs = logs.filter((l) => now - l.timestamp < 2000); // Only evaluate logs from the last tick

      for (const log of recentLogs) {
        let novelty = 0.5;
        try {
          const logText = log.message || log.action || JSON.stringify(log);
          const vector = await generateEmbedding(logText);
          const similar = await Embeddings.querySimilar(vector, 0.7);
          novelty = similar.length > 0 ? Math.max(0.1, 1.0 - (similar.length * 0.1)) : 0.9;
        } catch (e) {
          console.error("[CognitiveEngine] Novelty embedding failed:", e);
        }

        let impact =
          log.priority === EventPriority.CRITICAL
            ? 1.0
            : log.priority === EventPriority.HIGH
              ? 0.8
              : 0.4;
        let frequency = 0.5; // Placeholder

        if (
          log.status === NodeStatus.ERROR ||
          log.status === NodeStatus.ANOMALY
        ) {
          impact = 1.0;
          novelty = 0.9;
        }

        const score = novelty * 0.4 + impact * 0.4 + frequency * 0.2;

        // Only surface top 5% events globally (score > 0.85)
        if (score > 0.85) {
          let type: "anomaly" | "critical" | "pattern" = "pattern";
          if (log.status === NodeStatus.ANOMALY) type = "anomaly";
          if (
            log.priority === EventPriority.CRITICAL ||
            log.status === NodeStatus.ERROR
          )
            type = "critical";

          state.addInsight({
            message: `High-value signal detected: ${log.status} in ${log.subsystem}`,
            score,
            sourceNodeId: nodeId,
            type,
          });
        }
      }
    }
  }

  // 3. Decide: Route tasks and update meta-state
  private decide() {
    const state = useNodeStore.getState();

    // Meta-Orchestrator logic
    let newIntent = state.metaState.globalIntent;
    if (state.metaState.systemLoad > 80) {
      newIntent = "load_shedding";
    } else if (state.metaState.systemLoad < 20) {
      newIntent = "idle_optimization";
    } else {
      newIntent = "processing";
    }

    if (newIntent !== state.metaState.globalIntent) {
      state.setMetaState({ globalIntent: newIntent });
      console.log(`[MetaOrchestrator] Global intent shifted to: ${newIntent}`);
    }
  }

  // 4. Act: Trigger execution nodes or adjust weights
  private async act() {
    this.loopCount++;
    const state = useNodeStore.getState();

    // Proposal System
    const activeNodes = state.nodes.filter((n) => n.status !== NodeStatus.IDLE);
    const proposals = collectProposals(
      activeNodes,
      state.metaState.globalIntent,
    );

    // Boost confidence using Embeddings
    for (const p of proposals) {
      try {
        const chainStr = (p.actionChain || [p.action]).join(" ");
        const vector = await generateEmbedding(chainStr);
        const similar = await Embeddings.querySimilar(vector, 0.85);

        const successfulMatches = similar.filter((s) => s.success);
        if (successfulMatches.length > 0) {
          p.confidence = Math.min(1.0, p.confidence + 0.15);
          if (this.loopCount <= 50) {
            console.log(
              `[CognitiveEngine] Boosted confidence for proposal ${p.id} based on past success.`,
            );
          }
        }
      } catch (e) {
        console.error("[CognitiveEngine] Embedding boost failed:", e);
      }
    }

    let winners: Proposal[] = [];

    try {
      let response: Response | null = null;
      let retryCount = 0;
      while (retryCount < 3) {
        try {
          response = await fetch("/api/evaluate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              proposals,
              globalIntent: state.metaState.globalIntent,
            }),
          });
          if (response) break;
        } catch (err) {
          retryCount++;
          if (retryCount >= 3) throw err;
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      if (!response || !response.ok) throw new Error("Backend evaluation failed");

      const { evaluations } = await response.json();

      // Merge Llama scores and reasoning into proposals
      const evaluatedProposals = proposals.map((p) => {
        const evalData = evaluations.find((e: any) => e.proposalId === p.id);
        return {
          ...p,
          score: evalData ? evalData.score : undefined,
          reasoning: evalData ? evalData.reasoning : undefined,
        };
      });

      // Sort by score and pick top 3
      winners = evaluatedProposals
        .filter((p) => p.score !== undefined)
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 3);
    } catch (error) {
      console.warn(
        "[CognitiveEngine] Llama evaluation failed, falling back to local deterministic selection.",
        error,
      );
      winners = selectProposals(proposals, state.metaState.globalIntent);
    }

    // Update UI with winning nodes and proposals
    state.setMetaState({
      winningNodes: winners.map((w) => w.nodeId),
      winningProposals: winners,
    });

    // Loop Variation Check
    const currentWinningNodeIds = winners
      .map((w) => w.nodeId)
      .sort()
      .join(",");
    if (
      this.previousWinningNodes === currentWinningNodeIds &&
      winners.length > 0
    ) {
      this.loopVariationCounter++;
      if (this.loopVariationCounter >= 3) {
        state.setMetaState({
          globalIntent: "exploration_mode",
          intentPriority: 1.0,
        });
        console.log(
          `[MetaOrchestrator] Loop variation detected. Triggering exploration_mode.`,
        );
        this.loopVariationCounter = 0;
      }
    } else {
      this.loopVariationCounter = 0;
    }
    this.previousWinningNodes = currentWinningNodeIds;

    // Intent Decay
    state.setMetaState({
      intentPriority: state.metaState.intentPriority * 0.98,
    });

    let successCount = 0;
    let failureCount = 0;

    // Execute winning proposals via backend sequentially
    for (const w of winners) {
      if (this.loopCount <= 50) {
        console.log(
          `[CognitiveEngine] Loop ${this.loopCount} | Proposal generated: ${w.nodeId}, actionChain: ${w.actionChain?.join("->") || w.action}, score: ${w.score}`,
        );
      }

      let outcome: "success" | "failure" | "partial_failure" = "failure";
      let impact = 0;
      let latencyMs = 0;
      let details: any = null;

      try {
        if (this.consecutiveFailures >= 3) {
          console.warn(
            `[CognitiveEngine] Sandbox Fallback Triggered. Simulating execution for ${w.id}`,
          );
          outcome = "success";
          impact = 0.1;
          latencyMs = 10;
          details = { simulated: true };
          // Reset after simulating one tick
          this.consecutiveFailures = 0;
        } else {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          let execRes: Response | null = null;
          let retryCount = 0;
          while (retryCount < 3) {
            try {
              execRes = await fetch("/api/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ proposal: w }),
                signal: controller.signal,
              });
              if (execRes) break;
            } catch (err: any) {
              if (err.name === "AbortError") throw err;
              retryCount++;
              if (retryCount >= 3) throw err;
              await new Promise(r => setTimeout(r, 1000));
            }
          }

          clearTimeout(timeoutId);

          if (execRes && execRes.ok) {
            const result = await execRes.json();
            outcome = result.outcome;
            impact = result.impact;
            latencyMs = result.latencyMs;
            details = result.details;
          } else {
            throw new Error(`HTTP ${execRes ? execRes.status : 'Unknown'}`);
          }
        }
      } catch (e: any) {
        if (e.name === "AbortError") {
          console.warn(
            `[CognitiveEngine] Execution timeout for proposal ${w.id}`,
          );
          outcome = "failure";
          impact = 0;
          latencyMs = 2000;
          details = { error: "timeout" };
        } else {
          console.error(
            `[CognitiveEngine] Execution failed for proposal ${w.id}:`,
            e,
          );
          outcome = "failure";
          impact = 0;
          latencyMs = 0;
          details = { error: e.message };
        }
      }

      const success = outcome === "success";
      if (success || outcome === "partial_failure") {
        successCount++;
        this.consecutiveFailures = 0;
      } else {
        failureCount++;
        this.consecutiveFailures++;
      }

      if (this.loopCount <= 50) {
        console.log(
          `[CognitiveEngine] Loop ${this.loopCount} | Proposal executed: ${w.id}, outcome: ${outcome}, impact: ${impact}, latency: ${latencyMs}ms`,
        );
      }

      recordDecision({
        proposalId: w.id,
        nodeId: w.nodeId,
        outcome,
        impact,
        details,
      });

      const node = state.nodes.find((n) => n.id === w.nodeId);
      const oldWeight = node?.weight || 1.0;
      adjustNodeWeight(w.nodeId, outcome);
      const newWeight =
        useNodeStore.getState().nodes.find((n) => n.id === w.nodeId)?.weight ||
        1.0;

      if (this.loopCount <= 50) {
        console.log(
          `[CognitiveEngine] Loop ${this.loopCount} | Node ${w.nodeId} weight adjusted: ${oldWeight.toFixed(2)} -> ${newWeight.toFixed(2)}`,
        );
      }

      const history = node?.decisionHistory || [];
      const newHistory = [
        ...history,
        {
          proposalId: w.id,
          action: w.actionChain ? w.actionChain.join(" → ") : w.action,
          outcome,
          confidence: w.confidence,
          timestamp: Date.now(),
          impact,
          latencyMs,
        },
      ].slice(-5); // keep last 5

      // Update node's last decision and history
      state.updateNode(w.nodeId, {
        lastDecision: w.action,
        decisionHistory: newHistory,
      });

      // Memory Integration
      const execResult = {
        proposalId: w.id,
        nodeId: w.nodeId,
        outcome,
        impact,
        latencyMs,
        details,
      };
      STM.add(w, execResult).catch((e) =>
        console.error("[CognitiveEngine] STM add failed:", e),
      );
      LTM.recordPattern(w, execResult).catch((e) =>
        console.error("[CognitiveEngine] LTM record failed:", e),
      );
      Embeddings.store(
        w,
        state.metaState.globalIntent,
        outcome === "success",
      ).catch((e) =>
        console.error("[CognitiveEngine] Embeddings store failed:", e),
      );
    }

    // Adaptive MetaIntent
    const currentIntent = state.metaState.globalIntent;
    const weights = { ...state.metaState.intentWeights };
    if (successCount > failureCount) {
      weights[currentIntent] = Math.min(
        (weights[currentIntent] || 1) + 0.1,
        2.0,
      );
    } else if (failureCount > successCount) {
      weights[currentIntent] = Math.max(
        (weights[currentIntent] || 1) - 0.1,
        0.1,
      );
    }
    state.setMetaState({ intentWeights: weights });

    // Stability guards
    state.nodes.forEach((node) => {
      if (node.energy < 20) {
        // Node is too low on energy, disable or rest
        if (node.status !== NodeStatus.IDLE) {
          state.updateNode(node.id, { status: NodeStatus.IDLE });
        }
      }
    });

    // Example: If load shedding, reduce energy of non-critical nodes
    if (state.metaState.globalIntent === "load_shedding") {
      state.nodes.forEach((node) => {
        if (
          node.priority !== EventPriority.CRITICAL &&
          node.priority !== EventPriority.HIGH
        ) {
          if (node.energy > 10) {
            state.updateNode(node.id, { energy: node.energy - 5 });
          }
        }
      });
    }

    // Broadcast state to other clients via WebSocket
    fetch("/api/broadcast/mesh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        winningNodes: state.metaState.winningNodes,
        winningProposals: state.metaState.winningProposals,
      }),
    }).catch(() => {});
  }
}

export const cognitiveEngine = CognitiveEngine.getInstance();
