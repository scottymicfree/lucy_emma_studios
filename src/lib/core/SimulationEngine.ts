import {
  SimulationRequest,
  SimulationOutcome,
  ReasoningDAG,
  ReasoningNode,
} from "../../types";
import { FusionOrchestrator } from "./FusionOrchestrator";

interface ParsedCommand {
  command: string;
  flags: Record<string, string>;
  json: any | null;
}

interface ScenarioConfig {
  commands: ParsedCommand[];
  simCommand: ParsedCommand | null;
  patchCommands: ParsedCommand[];
  targetEnvironment?: string;
  historicalBaseline?: any;
  liveInjection?: any;
  predictiveVectors: string[];
  divergenceThreshold: number;
  timeDilationFactor?: string;
  autonomousProtocolsEnabled: boolean;
  anomalyProtocol?: string;
  namedAgents: string[];
}

const PROFILE_DEFAULTS: Record<
  string,
  { volatility: number; divergenceThreshold: number }
> = {
  Calm: { volatility: 5, divergenceThreshold: 0.95 },
  Fast: { volatility: 20, divergenceThreshold: 0.8 },
  Stress: { volatility: 35, divergenceThreshold: 0.6 },
  "Hyper Test": { volatility: 60, divergenceThreshold: 0.4 },
};

export class SimulationEngine {
  private static instance: SimulationEngine;
  private fusion: FusionOrchestrator;

  private constructor() {
    this.fusion = FusionOrchestrator.getInstance();
  }

  public static getInstance(): SimulationEngine {
    if (!SimulationEngine.instance) {
      SimulationEngine.instance = new SimulationEngine();
    }
    return SimulationEngine.instance;
  }

  public async runSimulation(
    request: SimulationRequest,
    onProgress?: (msg: string) => void,
  ): Promise<SimulationOutcome> {
    const profile = request.profile || "Calm";
    if (onProgress)
      onProgress(`[SimulationEngine] Parsing request | Profile: ${profile}`);

    const scenario = this.parseScenario(request.query);
    if (onProgress) {
      if (scenario.simCommand) {
        onProgress(
          `[SimulationEngine] Parsed /sim flags: ${JSON.stringify(scenario.simCommand.flags)}`,
        );
      } else {
        onProgress(
          `[SimulationEngine] No structured /sim command found in query - running on defaults + free-text goal.`,
        );
      }
      if (scenario.targetEnvironment) {
        onProgress(`[SimulationEngine] Target environment: ${scenario.targetEnvironment}`);
      }
      if (scenario.predictiveVectors.length) {
        onProgress(
          `[SimulationEngine] Tracking predictive vectors: ${scenario.predictiveVectors.join(", ")}`,
        );
      }
      if (scenario.patchCommands.length) {
        onProgress(
          `[SimulationEngine] ${scenario.patchCommands.length} /patch command(s) queued alongside this run.`,
        );
      }
    }

    const problemGraph = this.buildProblemGraph(request, scenario);

    if (onProgress)
      onProgress(
        `[SimulationEngine] Initializing simulation state for horizon: ${request.horizon}`,
      );
    let state = this.initializeState(problemGraph);

    if (onProgress) onProgress(`[SimulationEngine] Building Simulation DAG...`);
    const dag = this.buildSimulationDAG(problemGraph);

    if (onProgress)
      onProgress(
        `[SimulationEngine] Starting Temporal Engine loop over ${request.horizon} cycles...`,
      );
    const events = [];
    const timeSeriesData: any[] = [];

    const profileDefaults = PROFILE_DEFAULTS[profile] || PROFILE_DEFAULTS.Calm;
    const volatility = profileDefaults.volatility;
    const divergenceThreshold = scenario.divergenceThreshold;
    const injectionWeight = scenario.liveInjection?.injection_weight ?? 0;

    let runningDivergence = 0;

    for (let t = 0; t < request.horizon; t++) {
      if (onProgress)
        onProgress(
          `[TemporalEngine] Cycle ${t + 1}/${request.horizon}: Evolving agents and variables...`,
        );

      const stepResult = await this.fusion.runEpisode(
        `Simulation cycle ${t + 1} for: ${problemGraph.goal} (${profile} mode)`,
        problemGraph,
        dag,
      );

      const cycleProgress = (t + 1) / request.horizon;
      runningDivergence = cycleProgress * (volatility / 40) + injectionWeight * 0.15;
      runningDivergence = Math.min(1, runningDivergence);

      if (runningDivergence >= divergenceThreshold) {
        const vector =
          scenario.predictiveVectors[t % Math.max(1, scenario.predictiveVectors.length)] ||
          "structural stability";
        events.push({
          time: t + 1,
          description: scenario.targetEnvironment
            ? `${scenario.targetEnvironment}: ${vector} crossed divergence threshold (${runningDivergence.toFixed(2)} >= ${divergenceThreshold})`
            : `${stepResult.answer?.synthesis || "Emergent structural shift"}: ${vector} crossed divergence threshold`,
          impact: runningDivergence >= (divergenceThreshold + 1) / 2 ? "Critical" : "High",
        });
        if (onProgress)
          onProgress(
            `[TemporalEngine] Divergence threshold breached at cycle ${t + 1} (${runningDivergence.toFixed(2)} >= ${divergenceThreshold}).`,
          );
      }

      const cycleData: any = { time: t + 1 };
      for (const v of problemGraph.variables) {
        const prev = t === 0 ? 50 : timeSeriesData[t - 1][v];
        const drift = (Math.random() - 0.4) * volatility + injectionWeight * 5;
        cycleData[v] = Math.max(0, Math.min(100, prev + drift));
      }
      timeSeriesData.push(cycleData);

      this.updateState(state, stepResult);
    }

    if (onProgress) onProgress(`[SimulationEngine] Synthesizing outcomes...`);
    return this.synthesizeOutcome(state, events, timeSeriesData, profile, scenario);
  }

  private parseFlags(flagStr: string): Record<string, string> {
    const flags: Record<string, string> = {};
    const re = /--([a-zA-Z0-9_-]+)\s+(\S+)/g;
    let m;
    while ((m = re.exec(flagStr))) {
      flags[m[1]] = m[2];
    }
    return flags;
  }

  private extractBalancedJson(text: string, startIdx: number): { json: any | null; endIdx: number } {
    if (text[startIdx] !== "{") return { json: null, endIdx: startIdx };
    let depth = 0;
    for (let i = startIdx; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") {
        depth--;
        if (depth === 0) {
          const raw = text.slice(startIdx, i + 1);
          try {
            return { json: JSON.parse(raw), endIdx: i + 1 };
          } catch {
            return { json: null, endIdx: i + 1 };
          }
        }
      }
    }
    return { json: null, endIdx: text.length };
  }

  private parseCommandBlocks(query: string): ParsedCommand[] {
    const commands: ParsedCommand[] = [];
    if (!query) return commands;
    const cmdRe = /\/(\w+)((?:\s+--[\w-]+\s+\S+)*)\s*/g;
    let match: RegExpExecArray | null;
    while ((match = cmdRe.exec(query))) {
      const command = match[1];
      const flagsStr = match[2] || "";
      const flags = this.parseFlags(flagsStr);
      let idx = cmdRe.lastIndex;
      while (idx < query.length && /\s/.test(query[idx])) idx++;
      let json: any | null = null;
      if (query[idx] === "{") {
        const result = this.extractBalancedJson(query, idx);
        json = result.json;
        cmdRe.lastIndex = result.endIdx;
      }
      commands.push({ command, flags, json });
    }
    return commands;
  }

  private parseScenario(query: string): ScenarioConfig {
    const commands = this.parseCommandBlocks(query);
    const simCommand = commands.find((c) => c.command === "sim") || null;
    const patchCommands = commands.filter((c) => c.command === "patch");

    const simJson = simCommand?.json || {};
    const rules = simJson.simulation_rules || {};
    const autonomous = simJson.autonomous_protocols || {};

    const namedAgents = new Set<string>();
    const handshakeText =
      JSON.stringify(simJson) + patchCommands.map((p) => JSON.stringify(p.json)).join(" ");
    const agentMatches = handshakeText.match(/@[a-zA-Z0-9_]+/g) || [];
    agentMatches.forEach((a) => namedAgents.add(a.replace("@", "")));

    return {
      commands,
      simCommand,
      patchCommands,
      targetEnvironment: simJson.target_environment,
      historicalBaseline: simJson.historical_baseline,
      liveInjection: simJson.current_state_injection,
      predictiveVectors: rules.predictive_vectors || [],
      divergenceThreshold:
        typeof rules.divergence_threshold === "number"
          ? rules.divergence_threshold
          : PROFILE_DEFAULTS.Calm.divergenceThreshold,
      timeDilationFactor: rules.time_dilation_factor,
      autonomousProtocolsEnabled: !!autonomous.allow_self_upgrading_logic,
      anomalyProtocol: autonomous.on_anomaly_detected,
      namedAgents: Array.from(namedAgents),
    };
  }

  private buildProblemGraph(request: SimulationRequest, scenario: ScenarioConfig): any {
    const variables =
      scenario.predictiveVectors.length > 0
        ? scenario.predictiveVectors
        : request.variables || ["Stability", "Resource Drain", "Entropy"];

    const agents =
      scenario.namedAgents.length > 0
        ? Array.from(new Set([...(request.agents || []), ...scenario.namedAgents]))
        : request.agents || ["System Dynamics", "External Actors"];

    return {
      goal: scenario.targetEnvironment
        ? `${scenario.targetEnvironment}: ${request.query.split("\n")[0]}`
        : request.query,
      horizon: request.horizon,
      agents,
      variables,
      profile: request.profile || "Calm",
      scenario,
    };
  }

  private initializeState(problemGraph: any): any {
    return {
      entities: problemGraph.agents,
      factors: problemGraph.variables,
      currentValues: {},
    };
  }

  private makeNode(
    id: string,
    type: ReasoningNode["type"],
    inputRefs: string[],
    outputRefs: string[],
    payload: any,
  ): ReasoningNode {
    return {
      id,
      type,
      inputRefs,
      outputRefs,
      status: "pending",
      payload,
      metadata: { createdAt: Date.now(), tags: [] },
    };
  }

  private buildSimulationDAG(problemGraph: any): ReasoningDAG {
    const scenario: ScenarioConfig = problemGraph.scenario;
    const nodes = new Map<string, ReasoningNode>();
    const edges: ReasoningDAG["edges"] = [];

    const rootIds: string[] = [];
    if (scenario?.historicalBaseline) {
      nodes.set(
        "N_hist",
        this.makeNode("N_hist", "retrieve", [], ["N2", "N3"], {
          topic: "Historical Baseline",
          dataset: scenario.historicalBaseline.dataset,
        }),
      );
      rootIds.push("N_hist");
    }
    if (scenario?.liveInjection) {
      nodes.set(
        "N_live",
        this.makeNode("N_live", "retrieve", [], ["N2", "N3"], {
          topic: "Live Telemetry Injection",
          source: scenario.liveInjection.source,
        }),
      );
      rootIds.push("N_live");
    }
    if (rootIds.length === 0) {
      nodes.set("N1", this.makeNode("N1", "retrieve", [], ["N2", "N3"], { topic: "Grounding" }));
      rootIds.push("N1");
    }

    nodes.set("N2", this.makeNode("N2", "infer", [...rootIds], ["N4"], { topic: "Agent Modeling" }));
    nodes.set("N3", this.makeNode("N3", "infer", [...rootIds], ["N4"], { topic: "Variable Expansion" }));
    nodes.set("N4", this.makeNode("N4", "infer", ["N2", "N3"], ["N5"], { topic: "Causal Propagation" }));

    for (const id of rootIds) {
      edges.push({ from: id, to: "N2", kind: "logical" });
      edges.push({ from: id, to: "N3", kind: "logical" });
    }
    edges.push({ from: "N2", to: "N4", kind: "causal" });
    edges.push({ from: "N3", to: "N4", kind: "causal" });

    let lastEvalId = "N4";

    if (scenario?.autonomousProtocolsEnabled) {
      nodes.set(
        "N_gate",
        this.makeNode("N_gate", "evaluate", ["N4"], ["N5"], {
          checks: ["Self-Upgrade Authorization", "Anomaly Protocol Compliance"],
          anomalyProtocol: scenario.anomalyProtocol,
        }),
      );
      edges.push({ from: "N4", to: "N_gate", kind: "logical" });
      lastEvalId = "N_gate";
    }

    nodes.set(
      "N5",
      this.makeNode("N5", "evaluate", [lastEvalId], ["N6"], { checks: ["Emergence Detection"] }),
    );
    edges.push({ from: lastEvalId, to: "N5", kind: "logical" });

    nodes.set("N6", this.makeNode("N6", "synthesize", ["N5"], [], { mode: "Tick Outcome Synthesis" }));
    edges.push({ from: "N5", to: "N6", kind: "logical" });

    return {
      nodes,
      edges,
      rootNode: rootIds[0],
      goalNode: "N6",
    };
  }

  private updateState(state: any, stepResult: any): void {
    state.lastUpdate = Date.now();
  }

  private synthesizeOutcome(
    state: any,
    events: any[],
    timeSeriesData: any[],
    profile: string,
    scenario: ScenarioConfig,
  ): SimulationOutcome {
    let recommendations: string[] = [];
    let risks: string[] = [];
    let opportunities: string[] = [];

    if (profile === "Calm") {
      risks = ["Stagnation due to low entropy", "Over-optimization on stable parameters"];
      opportunities = ["Consolidation of core architecture", "Deep learning on long-term data"];
      recommendations = [
        "Implement Background Memory Defragmentation: To take advantage of low entropy states, restructure long-term memory for faster retrieval when load increases.",
        "Refine Neural Routing Weights: Minor adjustments during stable periods prevent drift.",
      ];
    } else if (profile === "Fast") {
      risks = ["High latency in decision DAGs", "Skipped validation cycles"];
      opportunities = ["Rapid prototyping of cognitive branches", "High throughput testing"];
      recommendations = [
        "Enable Aggressive Subcortical Caching: Due to high request velocity, caching intermediate RAG results will cut latency by 40%.",
        "Streamline Fusion Orchestrator: Bypass deep hypergraph traversal for routine queries to maintain speed.",
      ];
    } else if (profile === "Stress") {
      risks = ["Systemic resource exhaustion", "Cascading failure in sub-agents"];
      opportunities = ["Identify true breaking points of the DAG engine", "Test recovery protocols"];
      recommendations = [
        "Deploy Cognitive Throttling Protocol: Necessary to shed non-critical background tasks (like memory consolidation) when system load exceeds 85%.",
        "Activate Redundant Fallback Nodes: Ensure 'Emma' tier agents can take over routing if 'Lucy Prime' is overloaded.",
      ];
    } else if (profile === "Hyper Test") {
      risks = ["Complete AGI mode collapse", "Unrecoverable state corruption"];
      opportunities = ["Observe emergent self-preservation behaviors", "Map maximum theoretical limits"];
      recommendations = [
        "Activate Waveform Collapse Engine preemptively: To handle extreme entropy, force parallel realities to collapse faster, reducing processing overhead.",
        "Engage Aggressive Cognitive Immune Purge: Hyper tests introduce massive logic faults; aggressive phagocytosis of weak action chains prevents corruption.",
      ];
    }

    if (scenario.targetEnvironment) {
      risks = [
        `${scenario.targetEnvironment} destabilization: divergence crossed ${scenario.divergenceThreshold} threshold in ${events.length} of ${timeSeriesData.length} cycles.`,
        ...risks,
      ];
    }
    if (scenario.predictiveVectors.length) {
      opportunities = [
        `Direct measurement of tracked vectors: ${scenario.predictiveVectors.join(", ")}.`,
        ...opportunities,
      ];
    }
    if (scenario.autonomousProtocolsEnabled) {
      recommendations = [
        `Self-upgrade authorization was requested for this scenario (on_anomaly_detected: "${scenario.anomalyProtocol || "none specified"}"). ` +
          `Route through human sign-off before granting - this DAG only checked compliance, it did not grant authorization.`,
        ...recommendations,
      ];
    }

    return {
      finalState: state,
      keyEvents: events,
      timeSeriesData,
      risks,
      opportunities,
      recommendations,
    };
  }
}
