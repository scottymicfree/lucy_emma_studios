/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NodeStatus, SystemSnapshot, PluginManifest } from "../../types";
import { useNodeStore } from "../../store/useNodeStore";
import { SupervisionTree } from "./supervisionTree";
import { PluginManager } from "./pluginManager";
import { ResourceManager } from "./resourceManager";
import { SecurityManager } from "./securityManager";
import { DagReasoningEngine } from "./dagReasoningEngine";
import { FusionOrchestrator } from "./FusionOrchestrator";
import { SimulationEngine } from "./SimulationEngine";

/**
 * SystemStateManager: Single source of truth for Lucy's global state.
 * Handles snapshots, rollbacks, and consistency checks across subsystems.
 */
export class SystemStateManager {
  private static instance: SystemStateManager;
  private history: SystemSnapshot[] = [];
  private maxHistory = 50;

  public supervision: SupervisionTree;
  public plugins: PluginManager;
  public resources: ResourceManager;
  public security: SecurityManager;
  public dagEngine: DagReasoningEngine;
  public fusion: FusionOrchestrator;
  public simulation: SimulationEngine;

  private constructor() {
    this.supervision = SupervisionTree.getInstance();
    this.plugins = PluginManager.getInstance();
    this.resources = ResourceManager.getInstance();
    this.security = SecurityManager.getInstance();
    this.dagEngine = DagReasoningEngine.getInstance();
    this.fusion = FusionOrchestrator.getInstance();
    this.simulation = SimulationEngine.getInstance();

    // Seed initial demo data for the UI
    setTimeout(() => this.seedDemoData(), 1000);
  }

  private seedDemoData() {
    if (this.plugins.getInstalledPlugins().length > 0) return; // already seeded

    this.plugins.registerPlugin({
      id: "plugin-advanced-analysis",
      name: "Advanced Analysis Toolkit",
      version: "1.2.0",
      description:
        "Provides deep AST parsing and anomaly detection for complex codebase topologies.",
      author: "Core AI Division",
      dependencies: [],
      capabilities: [
        { name: "advanced_analysis", description: "AST deep traversal" },
      ],
      entryPoint: "analysis.js",
      signature: "sig_a8b9c0d1",
    });

    this.plugins.registerPlugin({
      id: "plugin-mesh-visualizer",
      name: "Mesh Visualizer 3D",
      version: "2.0.1",
      description: "WebGL accelerated node mesh rendering engine.",
      author: "UI Lab",
      dependencies: [],
      capabilities: [
        { name: "render_3d", description: "Hardware accelerated 3D mesh" },
      ],
      entryPoint: "render.js",
      signature: "sig_x1y2z3",
    });

    // Seed a couple background processes
    this.supervision.registerProcess(
      "sys-watcher-01",
      "System Telemetry Watcher",
    );
    this.supervision.registerProcess("net-router-02", "Mesh Network Router");

    // Initial resource blocks
    this.resources.requestResources(
      "sys-watcher-01",
      { gpuMemoryMb: 256, cpuPercentage: 5, networkBandwidthKbps: 1000 },
      90,
    );
    this.resources.requestResources(
      "net-router-02",
      { gpuMemoryMb: 512, cpuPercentage: 15, networkBandwidthKbps: 50000 },
      95,
    );

    // Log initial audit
    this.security.logAudit(
      "kernel",
      "system_boot",
      "all_subsystems",
      "success",
    );
  }

  static getInstance(): SystemStateManager {
    if (!this.instance) {
      this.instance = new SystemStateManager();
    }
    return this.instance;
  }

  /**
   * Captures a point-in-time snapshot of the entire system state.
   */
  captureSnapshot(): SystemSnapshot {
    const state = useNodeStore.getState();

    const snapshot: SystemSnapshot = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      lucyState:
        state.nodes.find((n) => n.id === "CN-001" || n.id === "LP1")?.status ||
        NodeStatus.IDLE,
      activeWorkflows: state.workflows
        .filter((w) => w.status === "running")
        .map((w) => w.id),
      serverStates: state.servers.reduce(
        (acc, s) => ({ ...acc, [s.id]: s.status }),
        {},
      ),
      throttlingLevel: state.throttling.level,
      voiceState: state.isMuted ? "muted" : "idle", // Simplified for now
      hash: "",
    };

    // Simple hash for integrity check
    snapshot.hash = btoa(JSON.stringify(snapshot));

    this.history.push(snapshot);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    console.log(
      `[SystemState] Snapshot captured: ${snapshot.id} (Level ${snapshot.throttlingLevel})`,
    );
    return snapshot;
  }

  /**
   * Rolls back the system to the last stable snapshot.
   */
  rollback(): boolean {
    if (this.history.length < 2) return false;

    // Get the previous snapshot (not the current one)
    const lastStable = this.history[this.history.length - 2];
    const state = useNodeStore.getState();

    console.warn(
      `[SystemState] Rolling back to stable state: ${lastStable.id}`,
    );

    // Apply rollback logic
    // 1. Reset throttling
    state.setThrottling({
      active: lastStable.throttlingLevel > 0,
      level: lastStable.throttlingLevel as any,
    });

    // 2. Reset Lucy Prime status
    state.updateNode("CN-001", { status: lastStable.lucyState });

    // 3. Log diff
    this.logDiff(this.history[this.history.length - 1], lastStable);

    return true;
  }

  private logDiff(current: SystemSnapshot, target: SystemSnapshot) {
    const diff = {
      lucyState:
        current.lucyState !== target.lucyState
          ? `${current.lucyState} -> ${target.lucyState}`
          : "unchanged",
      throttling:
        current.throttlingLevel !== target.throttlingLevel
          ? `${current.throttlingLevel} -> ${target.throttlingLevel}`
          : "unchanged",
    };
    console.log("[SystemState] Rollback Diff:", diff);
  }

  getHistory() {
    return this.history;
  }

  /**
   * Evaluates consensus and quorum across the 351-node mesh.
   */
  validateMeshConsensus() {
    const state = useNodeStore.getState();
    const quorum = state.getQuorumStatus();
    console.log(
      `[SystemState] Consensus verification: N=351, f=116, Threshold=233. Signatures count: ${quorum.activeSignatures}. Quorum met: ${quorum.isQuorumReached}. Byzantine margin: ${quorum.byzantineMargin}`,
    );
    return quorum;
  }

  /**
   * Evaluates task safety and constraints before dispatching agentic workflows.
   */
  evaluateTaskSafety(taskType: string): boolean {
    const state = useNodeStore.getState();
    const isLockdown = state.controlMode === "lockdown";
    if (isLockdown) {
      console.warn(
        `[SystemState] Task execution blocked: Security lockdown active.`,
      );
      return false;
    }
    console.log(`[SystemState] Task safety verified for type: ${taskType}`);
    return true;
  }
}
