/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { 
  CognitiveNode, 
  NodeStatus, 
  EventPriority, 
  Handbook, 
  MemoryLayer, 
  ThrottlingState, 
  FiveMServer, 
  Workflow, 
  SystemSnapshot,
  ControlMode,
  VisualSettings,
  MetaState,
  Insight,
  Synapse,
  AgenticTask,
  TaskPhase,
  SimState
} from '../types';
import { SystemStateManager } from '../lib/core/systemStateManager';
import { ValidationLayer } from '../lib/core/validationLayer';
import { DecisionAuthorityLayer } from '../lib/core/dal';

interface NodeState {
  nodes: CognitiveNode[];
  activeSessionId: string | null;
  memory: MemoryLayer;
  isMuted: boolean;
  throttling: ThrottlingState;
  throttlingHeatmap: Record<string, number>; // nodeId -> throttleLevel
  servers: FiveMServer[];
  workflows: Workflow[];
  history: SystemSnapshot[];
  controlMode: ControlMode;
  priorityQueues: Record<EventPriority, any[]>;
  visualSettings: VisualSettings;
  limits: {
    workflows: number;
    serverCommands: number;
    agentActions: number;
  };
  nodeLogs: Record<string, any[]>;
  
  // NEW: Cognitive Engine Layer
  metaState: MetaState;
  insightStream: Insight[];
  setMetaState: (updates: Partial<MetaState>) => void;
  addInsight: (insight: Omit<Insight, 'id' | 'timestamp'>) => void;

  setNodes: (nodes: CognitiveNode[]) => void;
  toggleMute: () => void;
  updateNode: (id: string, updates: Partial<CognitiveNode>) => void;
  getQuorumStatus: () => { activeSignatures: number; isQuorumReached: boolean; byzantineMargin: number; totalWeight?: number; activeWeightSum?: number };
  setActiveSession: (id: string | null) => void;
  emitEvent: (nodeId: string, status: NodeStatus, priority: EventPriority, payload?: any) => void;
  executeAction: (action: string, params: any) => Promise<any>;
  addToMemory: (prompt: string) => Promise<void>;
  loadSessionMemory: () => Promise<void>;
  detectPatterns: () => string | null;
  setThrottling: (throttling: Partial<ThrottlingState>) => void;
  updateServer: (id: string, updates: Partial<FiveMServer>) => void;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  syncServers: () => () => void;
  syncVRNodes: (vrData: any) => void;
  captureSnapshot: () => void;
  rollback: () => void;
  reconcileMemory: () => void;
  setFallbackMode: (active: boolean) => void;
  setControlMode: (mode: ControlMode) => void;
  updateVisualSettings: (settings: Partial<VisualSettings>) => void;

  // NEW: Agentic Task-Workflow Engine State
  taskQueue: AgenticTask[];
  activeTask: AgenticTask | null;
  addTaskToQueue: (task: AgenticTask) => void;
  setActiveTask: (task: AgenticTask | null) => void;
  updateTask: (id: string, updates: Partial<AgenticTask>) => void;
  optimizeMeshForTask: (taskType: string) => void;

  // Visual Highlight Loop
  highlightedNodeIds: string[];
  highlightNodes: (nodeIds: string[], duration: number) => void;

  // NEW: Simulation & State Recovery Schema
  activeSimulation: SimState | null;
  startSimulation: (sector: string, maxTicks?: number) => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  tickSimulation: () => void;
  rehydrateSimulation: (sim: SimState) => void;

  // NEW: Sliding-Window Semantic Summarizer
  executiveSummary: string;
  isCompressingMemory: boolean;
  setExecutiveSummary: (summary: string) => void;
  setIsCompressingMemory: (isCompressing: boolean) => void;
  compressMemory: (messages: any[]) => Promise<void>;

  // NEW: Planetary Telemetry Engine State
  macroEnvironment?: { globalQuakes: number; volcanicAshPlumeMax: number; peakKpIndex: number };
  updateMacroTelemetry: (envPayload: { globalQuakes: number; volcanicAshPlumeMax: number; peakKpIndex: number }) => void;
}

const createNodeBase = (base: Partial<CognitiveNode>): CognitiveNode => ({
  id: '',
  uid: '',
  type: 'Tool',
  subsystem: 'execution',
  status: NodeStatus.IDLE,
  position: [0, 0, 0],
  connections: [],
  synapses: [],
  weight: 1.0,
  energy: 100.0,
  autonomyLevel: 0.5,
  lastUpdated: Date.now(),
  ...base
} as CognitiveNode);

// Procedural Mesh Generator: build the state array of 351 nodes on startup
const generateNeuroMesh = (): CognitiveNode[] => {
  const nodes: CognitiveNode[] = [];
  
  // Helper for 3-digit padding
  const pad = (num: number) => String(num).padStart(3, '0');

  // 1. Cortical Nucleus (Nodes 1-13) -> CN-001 to CN-013
  for (let i = 1; i <= 13; i++) {
    const angle = (i / 13) * Math.PI * 2;
    // Central ring/cluster
    const x = Math.cos(angle) * 3;
    const y = Math.sin(angle * 2) * 0.5;
    const z = Math.sin(angle) * 3;
    
    // Connect each CN node to adjacent and to CN-001 (core router)
    const nextNode = `CN-${pad(i === 13 ? 1 : i + 1)}`;
    const connections = [nextNode];
    const synapses: Synapse[] = [
      { to: nextNode, weight: 1.0, latency: 1.2, signalType: 'command' }
    ];
    if (i !== 1) {
      connections.push('CN-001');
      synapses.push({ to: 'CN-001', weight: 0.9, latency: 1.5, signalType: 'feedback' });
    }

    nodes.push(createNodeBase({
      id: `CN-${pad(i)}`,
      uid: `node-cortical-nucleus-cn${pad(i)}`,
      type: 'LucyPrime',
      subsystem: 'core',
      priority: EventPriority.CRITICAL,
      position: [x, y, z],
      connections,
      synapses,
      weight: 12.0,
      autonomyLevel: 0.95,
      tier: 'Cortical',
      cluster: 'Nucleus',
      metadata: {
        blockProposalActive: false,
        consensusLatency: 1.2,
        function: 'Cortical Nucleus Core',
        tier: 'Cortical',
        cluster: 'Nucleus'
      }
    }));
  }

  // 2. Mid-Tier (Nodes 14-117)
  // FX-014 through FX-039 (26 nodes) - Frontal Executive Cluster
  for (let i = 14; i <= 39; i++) {
    const angle = ((i - 14) / 26) * Math.PI * 2;
    const x = 7 + Math.cos(angle) * 2.5;
    const y = 3 + Math.sin(angle * 2) * 1.5;
    const z = Math.sin(angle) * 2.5;
    
    // Connect to central Core router (CN-001)
    const connections = ['CN-001'];
    const synapses: Synapse[] = [
      { to: 'CN-001', weight: 0.8, latency: 4.2, signalType: 'command' }
    ];

    nodes.push(createNodeBase({
      id: `FX-${pad(i)}`,
      uid: `node-frontal-executive-fx${pad(i)}`,
      type: 'Emma',
      subsystem: 'orchestration',
      priority: EventPriority.HIGH,
      position: [x, y, z],
      connections,
      synapses,
      weight: 5.0,
      autonomyLevel: 0.8,
      tier: 'Subcortical',
      cluster: 'Frontal',
      metadata: {
        function: 'Intent Parsing & Task Allocation',
        statusDetail: 'nominal',
        tier: 'Subcortical',
        cluster: 'Frontal',
        telemetryStub: `FX-INTENT-${pad(i)}`
      }
    }));
  }

  // PS-040 through PS-065 (26 nodes) - Parietal Somatosensory Cluster
  for (let i = 40; i <= 65; i++) {
    const angle = ((i - 40) / 26) * Math.PI * 2;
    const x = Math.cos(angle) * 2.5;
    const y = 9 + Math.sin(angle * 2) * 1.5;
    const z = 7 + Math.sin(angle) * 2.5;
    
    const connections = ['CN-001'];
    const synapses: Synapse[] = [
      { to: 'CN-001', weight: 0.75, latency: 4.8, signalType: 'data' }
    ];

    nodes.push(createNodeBase({
      id: `PS-${pad(i)}`,
      uid: `node-parietal-somatosensory-ps${pad(i)}`,
      type: 'Telemetry',
      subsystem: 'telemetry',
      priority: EventPriority.NORMAL,
      position: [x, y, z],
      connections,
      synapses,
      weight: 3.0,
      autonomyLevel: 0.6,
      tier: 'Subcortical',
      cluster: 'Parietal',
      metadata: {
        function: 'Stream Planetary Pulse data',
        pulseRate: '98.4%',
        tier: 'Subcortical',
        cluster: 'Parietal',
        telemetryStub: `PS-PULSE-${pad(i)}`
      }
    }));
  }

  // OV-066 through OV-091 (26 nodes) - Occipital Visual Mesh
  for (let i = 66; i <= 91; i++) {
    const angle = ((i - 66) / 26) * Math.PI * 2;
    const x = -7 + Math.cos(angle) * 2.5;
    const y = -3 + Math.sin(angle * 2) * 1.5;
    const z = Math.sin(angle) * 2.5;
    
    const connections = ['CN-001'];
    const synapses: Synapse[] = [
      { to: 'CN-001', weight: 0.7, latency: 4.5, signalType: 'feedback' }
    ];

    nodes.push(createNodeBase({
      id: `OV-${pad(i)}`,
      uid: `node-occipital-visual-ov${pad(i)}`,
      type: 'Tool',
      subsystem: 'execution',
      priority: EventPriority.NORMAL,
      position: [x, y, z],
      connections,
      synapses,
      weight: 4.0,
      autonomyLevel: 0.7,
      tier: 'Subcortical',
      cluster: 'Occipital',
      metadata: {
        function: 'Monitor mixed-reality spatial states',
        precision: '99.98%',
        tier: 'Subcortical',
        cluster: 'Occipital',
        telemetryStub: `OV-RASTER-${pad(i)}`
      }
    }));
  }

  // TM-092 through TM-117 (26 nodes) - Temporal Memory Array
  for (let i = 92; i <= 117; i++) {
    const angle = ((i - 92) / 26) * Math.PI * 2;
    const x = Math.cos(angle) * 2.5;
    const y = -9 + Math.sin(angle * 2) * 1.5;
    const z = -7 + Math.sin(angle) * 2.5;
    
    const connections = ['CN-001'];
    const synapses: Synapse[] = [
      { to: 'CN-001', weight: 0.85, latency: 3.8, signalType: 'data' }
    ];

    nodes.push(createNodeBase({
      id: `TM-${pad(i)}`,
      uid: `node-temporal-memory-tm${pad(i)}`,
      type: 'Memory',
      subsystem: 'memory',
      priority: EventPriority.LOW,
      position: [x, y, z],
      connections,
      synapses,
      weight: 3.5,
      autonomyLevel: 0.5,
      tier: 'Subcortical',
      cluster: 'Temporal',
      metadata: {
        function: 'Monitor context caching & epoch sync states',
        syncState: 'Epoch 1052',
        tier: 'Subcortical',
        cluster: 'Temporal',
        telemetryStub: `TM-EPOCH-${pad(i)}`
      }
    }));
  }

  // 3. Outer Rim: Cerebellar Ledger (Nodes 118-351) -> CL-118 to CL-351 (234 nodes)
  const totalCl = 234;
  for (let i = 118; i <= 351; i++) {
    const idx = i - 118;
    const phi = Math.acos(-1 + (2 * idx) / totalCl);
    const theta = Math.sqrt(totalCl * Math.PI) * phi;
    const radius = 18;
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    // Connect to adjacent ledger node and central CN core
    const adjacentId = `CL-${pad(118 + ((idx + 1) % totalCl))}`;
    const cnTarget = `CN-${pad(1 + (idx % 13))}`;
    
    const connections = [adjacentId, cnTarget];
    const synapses: Synapse[] = [
      { to: adjacentId, weight: 0.5, latency: 12.0, signalType: 'data' },
      { to: cnTarget, weight: 0.6, latency: 8.5, signalType: 'data' }
    ];

    nodes.push(createNodeBase({
      id: `CL-${pad(i)}`,
      uid: `node-cerebellar-ledger-cl${pad(i)}`,
      type: 'Security',
      subsystem: 'security',
      priority: EventPriority.BACKGROUND,
      position: [x, y, z],
      connections,
      synapses,
      weight: 1.5,
      autonomyLevel: 0.4,
      tier: 'Cerebellar',
      cluster: 'Ledger',
      metadata: {
        function: 'Audit & Historical Persistence Layer',
        promotedFrom: null,
        tier: 'Cerebellar',
        cluster: 'Ledger',
        deepMemoryAuditFlag: true,
        ledgerChecksum: `0x${(i * 73).toString(16).toUpperCase()}`
      }
    }));
  }

  return nodes;
};

export const useNodeStore = create<NodeState>((set, get) => ({
  nodes: generateNeuroMesh(),
  activeSessionId: null,
  memory: {
    shortTerm: [],
    session: [],
    longTerm: [],
    embeddings: []
  },
  isMuted: false,
  throttling: {
    active: false,
    level: 0,
    timestamp: Date.now()
  },
  throttlingHeatmap: {},
  servers: [],
  workflows: [],
  history: [],
  controlMode: ControlMode.NORMAL,
  priorityQueues: {
    [EventPriority.CRITICAL]: [],
    [EventPriority.HIGH]: [],
    [EventPriority.NORMAL]: [],
    [EventPriority.LOW]: [],
    [EventPriority.BACKGROUND]: [],
    [EventPriority.SYSTEM]: []
  },
  visualSettings: {
    connectionSpeed: 1.5,
    showTrails: true,
    showDashedLines: true,
  },
  limits: {
    workflows: 5,
    serverCommands: 10,
    agentActions: 20
  },
  nodeLogs: {},
  
  // Cognitive Engine Layer State
  metaState: {
    globalIntent: 'idle',
    intentPriority: 1.0,
    intentWeights: { processing: 1, load_shedding: 1, idle_optimization: 1, exploration_mode: 1 },
    priorityMap: {},
    systemLoad: 0,
    winningNodes: [],
    winningProposals: []
  },
  insightStream: [],
  
  setMetaState: (updates) => set((state) => ({
    metaState: { ...state.metaState, ...updates }
  })),
  
  addInsight: (insight) => set((state) => {
    const newInsight = {
      ...insight,
      id: `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    return {
      insightStream: [newInsight, ...state.insightStream].slice(0, 50) // Keep last 50 insights
    };
  }),

  setNodes: (nodes) => set({ nodes }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setControlMode: (mode) => set({ controlMode: mode }),
  updateVisualSettings: (settings) => set((state) => ({
    visualSettings: { ...state.visualSettings, ...settings }
  })),

  // NEW: Agentic Task-Workflow Engine State
  taskQueue: [],
  activeTask: null,
  addTaskToQueue: (task) => set((state) => ({ taskQueue: [...state.taskQueue, task] })),
  setActiveTask: (task) => set({ activeTask: task }),
  updateTask: (id, updates) => set((state) => ({
    taskQueue: state.taskQueue.map((t) => t.id === id ? { ...t, ...updates } : t),
    activeTask: state.activeTask?.id === id ? { ...state.activeTask, ...updates } : state.activeTask
  })),
  highlightedNodeIds: [],
  highlightNodes: (nodeIds: string[], duration: number) => {
    set({ highlightedNodeIds: nodeIds });
    if (duration > 0) {
      setTimeout(() => {
        if (JSON.stringify(get().highlightedNodeIds) === JSON.stringify(nodeIds)) {
          set({ highlightedNodeIds: [] });
        }
      }, duration);
    }
  },
  activeSimulation: null,
  startSimulation: (sector: string, maxTicks?: number) => {
    const simId = `sim-${Date.now()}`;
    const newSim: SimState = {
      simId,
      targetSector: sector,
      status: 'RUNNING',
      currentTick: 0,
      maxTicks: maxTicks || 100,
      failureVectorsDetected: [],
      checkpointTimestamp: Date.now()
    };
    set({ activeSimulation: newSim });
    // Highlight nodes of target sectors to create nice visual effect
    const nodes = get().nodes;
    const targetClusterNodes = nodes.filter(n => n.cluster === 'Temporal' || n.cluster === 'Parietal' || n.cluster === 'Ledger').map(n => n.id);
    get().highlightNodes(targetClusterNodes, 8000);
    
    // Auto-save to local storage
    localStorage.setItem('lucy_sim_recovery_matrix', JSON.stringify(newSim));
    
    // Also send start log to SQLite
    fetch("/api/simulation/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSim)
    }).catch(err => console.warn("Could not save simulation starting event to daemon:", err));
  },
  pauseSimulation: () => {
    const sim = get().activeSimulation;
    if (sim) {
      const updated = { ...sim, status: 'PAUSED' as const, checkpointTimestamp: Date.now() };
      set({ activeSimulation: updated });
      localStorage.setItem('lucy_sim_recovery_matrix', JSON.stringify(updated));
      fetch("/api/simulation/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      }).catch(err => console.warn("Could not save simulation state update:", err));
    }
  },
  resumeSimulation: () => {
    const sim = get().activeSimulation;
    if (sim) {
      const updated = { ...sim, status: 'RUNNING' as const, checkpointTimestamp: Date.now() };
      set({ activeSimulation: updated });
      localStorage.setItem('lucy_sim_recovery_matrix', JSON.stringify(updated));
      fetch("/api/simulation/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      }).catch(err => console.warn("Could not save simulation state update:", err));
    }
  },
  tickSimulation: () => {
    const sim = get().activeSimulation;
    if (sim && sim.status === 'RUNNING') {
      const nextTick = sim.currentTick + 1;
      const completed = nextTick >= sim.maxTicks;
      
      const newFailures = [...sim.failureVectorsDetected];
      if (nextTick === Math.floor(sim.maxTicks * 0.25) && !newFailures.includes("Substation Overload")) {
        newFailures.push("Substation Overload");
      }
      if (nextTick === Math.floor(sim.maxTicks * 0.55) && !newFailures.includes("Flood Threshold Exceeded (Fenton MO)")) {
        newFailures.push("Flood Threshold Exceeded (Fenton MO)");
      }
      if (nextTick === Math.floor(sim.maxTicks * 0.85) && !newFailures.includes("Optic Link Latency Spike")) {
        newFailures.push("Optic Link Latency Spike");
      }

      const updated: SimState = {
        ...sim,
        currentTick: nextTick,
        status: completed ? 'COMPLETED' : 'RUNNING',
        failureVectorsDetected: newFailures,
        checkpointTimestamp: Date.now()
      };
      set({ activeSimulation: updated });
      localStorage.setItem('lucy_sim_recovery_matrix', JSON.stringify(updated));
      
      if (nextTick % 10 === 0 || completed) {
        fetch("/api/simulation/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated)
        }).catch(err => console.warn("Could not sync simulation tick to daemon:", err));
      }
    }
  },
  rehydrateSimulation: (sim: SimState) => {
    set({ activeSimulation: sim });
    localStorage.setItem('lucy_sim_recovery_matrix', JSON.stringify(sim));
  },
  executiveSummary: "System initiated. No historical drift recorded.",
  isCompressingMemory: false,
  setExecutiveSummary: (summary: string) => set({ executiveSummary: summary }),
  setIsCompressingMemory: (isCompressing: boolean) => set({ isCompressingMemory: isCompressing }),
  compressMemory: async (messages: any[]) => {
    set({ isCompressingMemory: true });
    try {
      const response = await fetch("/api/memory/compress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, currentSummary: get().executiveSummary })
      });
      const data = await response.json();
      if (data.success && data.summary) {
        set({ executiveSummary: data.summary });
      }
    } catch (err) {
      console.warn("Memory compression failed:", err);
    } finally {
      set({ isCompressingMemory: false });
    }
  },
  optimizeMeshForTask: (taskType: string) => {
    const nodes = get().nodes;
    const updatedNodes = nodes.map((node) => {
      let isTarget = false;
      if (taskType === "Planetary Pulse Analysis" && node.cluster === "Parietal") {
        isTarget = true;
      } else if (taskType === "Code Construction / Scripting" && node.cluster === "Frontal") {
        isTarget = true;
      } else if (taskType === "Mixed Reality Rendering" && node.cluster === "Occipital") {
        isTarget = true;
      }

      if (isTarget) {
        // Maximize signal weights and drop their latencies down to core levels (1.2ms)
        const updatedSynapses = node.synapses.map(s => ({
          ...s,
          weight: 1.0,
          latency: 1.2,
        }));

        return {
          ...node,
          status: NodeStatus.ACTIVE,
          weight: node.weight * 2.0,
          energy: 100.0,
          synapses: updatedSynapses,
          metadata: {
            ...node.metadata,
            statusDetail: "MAXIMUM_THROUGHPUT_REALLOCATED",
            precision: "100.00%",
            pulseRate: "120Hz"
          }
        };
      } else {
        // Reset non-target nodes to baseline if they were previously optimized
        const updatedSynapses = node.synapses.map(s => {
          let baseLat = 4.5;
          if (node.cluster === "Frontal") baseLat = 4.2;
          else if (node.cluster === "Parietal") baseLat = 4.8;
          else if (node.cluster === "Occipital") baseLat = 4.5;
          else if (node.cluster === "Temporal") baseLat = 3.8;
          else if (node.cluster === "Nucleus") baseLat = 1.2;
          else if (node.cluster === "Ledger") baseLat = 8.5;

          return {
            ...s,
            weight: s.weight === 1.0 && s.latency === 1.2 ? 0.7 : s.weight,
            latency: s.latency === 1.2 && node.cluster !== "Nucleus" ? baseLat : s.latency,
          };
        });

        let baseWeight = node.weight;
        if (node.cluster === "Frontal" && node.weight > 5.0) baseWeight = 5.0;
        if (node.cluster === "Parietal" && node.weight > 3.0) baseWeight = 3.0;
        if (node.cluster === "Occipital" && node.weight > 4.0) baseWeight = 4.0;

        return {
          ...node,
          weight: baseWeight,
          synapses: updatedSynapses
        };
      }
    });

    set({ nodes: updatedNodes });
  },
  getQuorumStatus: () => {
    const nodes = get().nodes;
    // Total (N) = 351, Max Byzantine (f) = 116, Quorum Certificate Threshold = 233.
    // Continuously sums the active node weights.
    // Active nodes are any nodes NOT in ERROR or FAULT status.
    const activeNodes = nodes.filter(
      (n) => n.status !== NodeStatus.ERROR && n.status !== NodeStatus.FAULT
    );
    const activeSignatures = activeNodes.length;
    const isQuorumReached = activeSignatures >= 233;
    const byzantineMargin = Math.max(0, 116 - nodes.filter((n) => n.status === NodeStatus.ERROR || n.status === NodeStatus.FAULT).length);
    const totalWeight = nodes.reduce((sum, n) => sum + n.weight, 0);
    const activeWeightSum = activeNodes.reduce((sum, n) => sum + n.weight, 0);

    return {
      activeSignatures,
      isQuorumReached,
      byzantineMargin,
      totalWeight,
      activeWeightSum,
    };
  },
  updateNode: (id, updates) => set((state) => {
    const targetId = id === 'LP1' ? 'CN-001' : id === 'E1' ? 'CN-002' : id;
    
    // Check if the update contains FAULT or ERROR status
    const isFaultStatus = updates.status === NodeStatus.FAULT || updates.status === NodeStatus.ERROR || (updates as any).status === 'fault' || (updates as any).status === 'FAULT';
    
    // Find failed node parameters to clone
    const failedNode = state.nodes.find((n) => n.id === targetId);
    const isCorticalOrSubcortical = failedNode && (failedNode.tier === 'Cortical' || failedNode.tier === 'Subcortical');
    
    let finalNodes = state.nodes.map((n) => n.id === targetId ? { ...n, ...updates, lastUpdated: Date.now() } : n);
    
    // EMMA Kernel Failover State Machine:
    // If any node in the Cortical or Subcortical tiers shifts to a 'FAULT' state,
    // the machine must instantly splice/find the first active 'Cerebellar' node,
    // update its tier/cluster status to match the failed node, promote its signature weight,
    // and set its status to 'SYNCING' before stabilization.
    if (isFaultStatus && isCorticalOrSubcortical && failedNode) {
      // Find a Cerebellar node that is active/idle and not already promoted
      const clToPromote = finalNodes.find(
        (n) => n.tier === 'Cerebellar' && n.status !== NodeStatus.ERROR && n.status !== NodeStatus.FAULT && !n.metadata?.promotedFrom
      );
      
      if (clToPromote) {
        console.log(`[EMMA Kernel Failover] Critical Fault on ${targetId} (${failedNode.tier}/${failedNode.cluster}). Instantly promoting Cerebellar Ledger Node ${clToPromote.id}.`);
        
        // Clone subsystem details and promote its signature weight
        const targetTier = failedNode.tier;
        const targetCluster = failedNode.cluster;
        const clonedSubsystem = failedNode.subsystem;
        const clonedType = failedNode.type;
        const promotedWeight = Number((failedNode.weight * 1.5).toFixed(2));
        
        // Mutate finalNodes to set the CL node to SYNCING with cloned status
        finalNodes = finalNodes.map((n) => n.id === clToPromote.id ? {
          ...n,
          status: NodeStatus.SYNCING,
          tier: targetTier,
          cluster: targetCluster,
          subsystem: clonedSubsystem,
          type: clonedType,
          weight: promotedWeight,
          lastUpdated: Date.now(),
          metadata: {
            ...n.metadata,
            function: `Promoted Replacer for ${targetId}`,
            promotedFrom: targetId,
            originalTier: 'Cerebellar',
            originalCluster: 'Ledger',
            syncState: 'Syncing ledger checkpoints...'
          }
        } : n);
        
        // Push failover trigger insight
        setTimeout(() => {
          const addInsight = get().addInsight;
          if (addInsight) {
            addInsight({
              message: `[EMMA Failover System] Instantly splicing failed node ${targetId} with Cerebellar node ${clToPromote.id}. Status set to SYNCING.`,
              score: 0.98,
              sourceNodeId: clToPromote.id,
              type: 'critical'
            });
          }
        }, 50);

        // Schedule stabilization after exactly 3000ms
        setTimeout(() => {
          // Find the current node structure and transition to ACTIVE
          const currentStore = useNodeStore.getState();
          const targetCLNode = currentStore.nodes.find(n => n.id === clToPromote.id);
          if (targetCLNode && targetCLNode.status === NodeStatus.SYNCING) {
            currentStore.updateNode(clToPromote.id, {
              status: NodeStatus.ACTIVE,
              metadata: {
                ...targetCLNode.metadata,
                syncState: 'Synchronized & Stable'
              }
            });
            
            const addInsight = currentStore.addInsight;
            if (addInsight) {
              addInsight({
                message: `[EMMA Failover System] Node ${clToPromote.id} has successfully synchronized ledger logs. Transitioned to ACTIVE state.`,
                score: 0.99,
                sourceNodeId: clToPromote.id,
                type: 'critical'
              });
            }
          }
        }, 3000);
      }
    }
    
    return { nodes: finalNodes };
  }),
  setActiveSession: (id) => set({ activeSessionId: id }),
  emitEvent: (nodeId, status, priority, payload) => {
    const state = get();
    const now = Date.now();
    const validator = ValidationLayer.getInstance();

    const targetNodeId = nodeId === 'LP1' ? 'CN-001' : nodeId === 'E1' ? 'CN-002' : nodeId;

    // 0. Control Mode Overrides
    if (state.controlMode === ControlMode.LOCKDOWN && priority !== EventPriority.CRITICAL && priority !== EventPriority.SYSTEM) {
      console.warn('[Lockdown] Blocking non-critical event:', targetNodeId);
      return;
    }

    // 1. Event Integrity Check
    if (!validator.validateEvent(targetNodeId, status, priority, payload)) {
      return;
    }
    
    // 2. Advanced Adaptive Self-Throttling (Final Form)
    const recentEvents = state.nodes.filter(n => now - n.lastUpdated < 1000).length;
    const userTier = 'admin'; // This would be dynamic in a real app
    
    // Predictive Throttling: Start throttling before overload
    const threshold = userTier === 'admin' ? 150 : 100;
    let currentLevel: 0 | 1 | 2 | 3 = 0;
    let reason = '';

    if (recentEvents > threshold) {
      currentLevel = 3;
      reason = 'Critical Event Rate Overflow';
    } else if (recentEvents > threshold * 0.7) {
      currentLevel = 2;
      reason = 'High Event Traffic';
    } else if (recentEvents > threshold * 0.4) {
      currentLevel = 1;
      reason = 'Moderate Load Detected';
    }

    // Per-node throttling indicator (Heatmap)
    const nodeThrottle = currentLevel > 0 ? currentLevel : 0;
    set(state => ({
      throttlingHeatmap: { ...state.throttlingHeatmap, [targetNodeId]: nodeThrottle }
    }));

    if (currentLevel > 0 && !state.throttling.active) {
      set({ throttling: { active: true, level: currentLevel, reason, timestamp: now } });
    } else if (currentLevel === 0 && state.throttling.active) {
      set({ throttling: { active: false, level: 0, timestamp: now } });
    }

    // Drop logic based on level and priority
    if (priority !== EventPriority.CRITICAL && priority !== EventPriority.SYSTEM) {
      if (currentLevel === 3) return; // Pause non-critical
      if (currentLevel === 2 && Math.random() > 0.5) return; // Batch/Drop 50%
      if (currentLevel === 1 && Math.random() > 0.8) return; // Batch/Drop 20%
    }

    state.updateNode(targetNodeId, { status, priority, lastPayload: payload });
    
    // Update node logs
    set(state => {
      const logs = state.nodeLogs[targetNodeId] || [];
      const newLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: now,
        status,
        priority,
        payload
      };
      return {
        nodeLogs: {
          ...state.nodeLogs,
          [targetNodeId]: [newLog, ...logs].slice(0, 20) // Keep last 20 logs
        }
      };
    });

    // Priority-based UI timing (simulated)
    const delay = priority === EventPriority.CRITICAL ? 0 : priority === EventPriority.NORMAL ? 500 : 1000;
    setTimeout(() => {
      if (status !== NodeStatus.IDLE) {
        get().updateNode(targetNodeId, { status: NodeStatus.IDLE });
      }
    }, 3000 + delay);

    // Enhanced Error Handling: Log critical errors to LocalStorage
    if (status === NodeStatus.ERROR && priority === EventPriority.CRITICAL) {
      try {
        const errors = JSON.parse(localStorage.getItem('lucy_errors') || '[]');
        errors.push({
          nodeId: targetNodeId,
          payload,
          priority,
          timestamp: Date.now(),
          trace: new Error().stack
        });
        localStorage.setItem('lucy_errors', JSON.stringify(errors.slice(-50)));
      } catch (err) {
        console.warn('Failed to log error to local storage:', err);
      }
    }
  },
  executeAction: async (action, params) => {
    const dal = DecisionAuthorityLayer.getInstance();
    const result = await dal.evaluateAction(action, params);

    if (result.decision === 'denied') {
      get().emitEvent('LP1', NodeStatus.ERROR, EventPriority.CRITICAL, { action, error: result.reason });
      throw new Error(result.reason);
    }

    if (result.decision === 'confirm_required') {
      get().emitEvent('LP1', NodeStatus.ALERT, EventPriority.HIGH, { action, message: result.reason });
      // In a real app, this would trigger a UI modal.
      console.log('[DAL] Confirmation required for:', action);
    }

    if (result.decision === 'delayed') {
      get().emitEvent('LP1', NodeStatus.ROUTING, EventPriority.NORMAL, { action, message: result.reason });
      await new Promise(resolve => setTimeout(resolve, result.suggestedDelay || 2000));
    }

    // Proceed with action
    get().emitEvent('TX1', NodeStatus.ACTIVE, EventPriority.NORMAL, { action, params });
    get().emitEvent('LP1', NodeStatus.ACTIVE, EventPriority.NORMAL, { action, params });
    return { status: 'success', action };
  },
  setThrottling: (throttling) => set((state) => ({ 
    throttling: { ...state.throttling, ...throttling, timestamp: Date.now() } 
  })),
  updateServer: (id, updates) => set((state) => ({
    servers: state.servers.map((s) => s.id === id ? { ...s, ...updates } : s)
  })),
  updateWorkflow: (id, updates) => set((state) => ({
    workflows: state.workflows.map((w) => w.id === id ? { ...w, ...updates } : w)
  })),
  syncServers: () => {
    // Local-first: load servers from local storage
    const loadServers = () => {
      try {
        const stored = localStorage.getItem('lucy_linked_servers');
        if (stored) {
          const serverList = JSON.parse(stored) as FiveMServer[];
          set({ servers: serverList });
          
          // Update NodeMesh with server nodes
          const currentNodes = get().nodes;
          const serverNodes = serverList.map((s, i) => createNodeBase({
            id: `SVR_${s.id}`,
            uid: `node-external-server-${s.id}-${i}`,
            type: 'FiveMServer' as const,
            subsystem: 'external' as const,
            status: s.status === 'online' ? NodeStatus.IDLE : NodeStatus.ERROR,
            position: [20, (i - serverList.length / 2) * 5, 0] as [number, number, number],
            connections: ['E1'],
            synapses: [{ to: 'E1', weight: 0.5, latency: 50, signalType: 'data' }],
            weight: 1.0,
            autonomyLevel: 0.1,
            lastUpdated: Date.now(),
            metadata: { serverName: s.name, players: s.players }
          }));
          
          const otherNodes = currentNodes.filter(n => !n.id.startsWith('SVR_'));
          set({ nodes: [...otherNodes, ...serverNodes] });
        }
      } catch (err) {
        console.warn('[syncServers] LocalStorage error:', err);
      }
    };
    
    loadServers();
    // Simulate real-time by polling or listening to a custom event
    const interval = setInterval(loadServers, 10000);
    return () => clearInterval(interval);
  },
  syncVRNodes: (vrData) => {
    if (!vrData) return;
    try {
      const currentNodes = get().nodes;
      
      const vrNodesList = [
        createNodeBase({
          id: 'VR_HDST',
          uid: 'node-vr-headset',
          type: 'Telemetry',
          subsystem: 'telemetry',
          status: NodeStatus.ACTIVE,
          position: [vrData.headset?.x || 0, vrData.headset?.y || 1.6, vrData.headset?.z || 0],
          connections: ['CN-001'],
          synapses: [{ to: 'CN-001', weight: 0.95, latency: 15, signalType: 'data' }],
          weight: 4.5,
          autonomyLevel: 0.8,
          lastUpdated: Date.now(),
          tier: 'Cortical',
          cluster: 'Occipital',
          metadata: { function: 'OpenXR Headset Tracking', precision: '99.9%' }
        }),
        createNodeBase({
          id: 'VR_LHND',
          uid: 'node-vr-left-hand',
          type: 'Tool',
          subsystem: 'execution',
          status: NodeStatus.ACTIVE,
          position: [(vrData.headset?.x || 0) - 0.3, (vrData.headset?.y || 1.6) - 0.6, (vrData.headset?.z || 0) - 0.2],
          connections: ['VR_HDST'],
          synapses: [{ to: 'VR_HDST', weight: 0.85, latency: 20, signalType: 'data' }],
          weight: 3.0,
          autonomyLevel: 0.7,
          lastUpdated: Date.now(),
          tier: 'Subcortical',
          cluster: 'Parietal',
          metadata: { function: 'Left Hand Tracking Gesture', statusDetail: vrData.hands?.left || 'open' }
        }),
        createNodeBase({
          id: 'VR_RHND',
          uid: 'node-vr-right-hand',
          type: 'Tool',
          subsystem: 'execution',
          status: NodeStatus.ACTIVE,
          position: [(vrData.headset?.x || 0) + 0.3, (vrData.headset?.y || 1.6) - 0.6, (vrData.headset?.z || 0) - 0.2],
          connections: ['VR_HDST'],
          synapses: [{ to: 'VR_HDST', weight: 0.85, latency: 20, signalType: 'data' }],
          weight: 3.0,
          autonomyLevel: 0.7,
          lastUpdated: Date.now(),
          tier: 'Subcortical',
          cluster: 'Parietal',
          metadata: { function: 'Right Hand Tracking Gesture', statusDetail: vrData.hands?.right || 'grip' }
        })
      ];

      // Add Anchor Nodes if present
      if (vrData.anchors && Array.isArray(vrData.anchors)) {
        vrData.anchors.forEach((anc: any, index: number) => {
          const id = `VR_ANC_${index}`;
          vrNodesList.push(createNodeBase({
            id,
            uid: `node-vr-anchor-${index}`,
            type: 'External',
            subsystem: 'external',
            status: NodeStatus.IDLE,
            position: [anc.x || 0, anc.y || 0, anc.z || 0],
            connections: ['CN-001'],
            synapses: [{ to: 'CN-001', weight: 0.6, latency: 40, signalType: 'feedback' }],
            weight: 2.0,
            autonomyLevel: 0.5,
            lastUpdated: Date.now(),
            tier: 'Cerebellar',
            cluster: 'Ledger',
            metadata: { function: 'VR Spatial Anchor', label: typeof anc === 'string' ? anc : (anc.id || id) }
          }));
        });
      }

      const otherNodes = currentNodes.filter(n => !n.id.startsWith('VR_'));
      set({ nodes: [...otherNodes, ...vrNodesList] });
    } catch (e) {
      console.warn('[syncVRNodes] failed:', e);
    }
  },
  captureSnapshot: () => {
    const manager = SystemStateManager.getInstance();
    const snapshot = manager.captureSnapshot();
    set(state => ({ history: [...state.history, snapshot].slice(-50) }));
  },
  rollback: () => {
    const manager = SystemStateManager.getInstance();
    if (manager.rollback()) {
      set({ history: manager.getHistory() });
    }
  },
  reconcileMemory: () => {
    const { memory } = get();
    console.log('[Memory] Starting reconciliation job...');
    
    // 1. Duplicate Detection
    const uniqueShortTerm = Array.from(new Set(memory.shortTerm));
    const uniqueSession = Array.from(new Set(memory.session));
    
    // 2. Stale Memory Cleanup (Simplified: keep only last 50)
    const cleanedSession = uniqueSession.slice(0, 50);
    
    set({ memory: { ...memory, shortTerm: uniqueShortTerm, session: cleanedSession } });
    console.log('[Memory] Reconciliation complete.');
  },
  setFallbackMode: (active) => {
    if (active) {
      console.warn('[FailureContainment] Activating FALLBACK MODE. Limiting subsystems.');
      set({ 
        throttling: { active: true, level: 3, reason: 'System Failure Containment', timestamp: Date.now() },
        isMuted: true 
      });
    } else {
      set({ throttling: { active: false, level: 0, timestamp: Date.now() } });
    }
  },
  addToMemory: async (prompt) => {
    set((state) => {
      const newShortTerm = [prompt, ...state.memory.shortTerm].slice(0, 10);
      const newSession = [prompt, ...state.memory.session].slice(0, 50);
      return {
        memory: { ...state.memory, shortTerm: newShortTerm, session: newSession }
      };
    });

    // Handbook Suggestion Scoring & Topic Clustering
    const pattern = get().detectPatterns();
    if (pattern) {
      console.log(`[Handbook] Suggestion score increased for topic: ${pattern}`);
      // In a real app, we'd check if a suggestion already exists and increment its score
    }

    // Persist to LocalStorage
    try {
      const stored = JSON.parse(localStorage.getItem('lucy_sessions') || '[]');
      stored.unshift({
        prompt,
        timestamp: Date.now(),
        status: 'active',
        source: 'web',
        nodePath: ['LP1'],
        toolsUsed: [],
        version: 1
      });
      localStorage.setItem('lucy_sessions', JSON.stringify(stored.slice(0, 50)));
    } catch (err) {
      console.warn('Failed to persist memory to local storage:', err);
    }
  },
  loadSessionMemory: async () => {
    try {
      const stored = JSON.parse(localStorage.getItem('lucy_sessions') || '[]');
      const session = stored.map((doc: any) => doc.prompt as string);
      set(state => ({ memory: { ...state.memory, session } }));
    } catch (err) {
      console.warn('Failed to load session memory from local storage:', err);
    }
  },
  detectPatterns: () => {
    const { shortTerm } = get().memory;
    if (shortTerm.length < 3) return null;
    
    // Simple repetition detection
    const counts: Record<string, number> = {};
    shortTerm.forEach(p => {
      const words = p.toLowerCase().split(' ').filter(w => w.length > 3);
      words.forEach(w => counts[w] = (counts[w] || 0) + 1);
    });
    
    const topWord = Object.entries(counts).find(([_, count]) => count >= 3);
    return topWord ? topWord[0] : null;
  },
  macroEnvironment: { globalQuakes: 0, volcanicAshPlumeMax: 0, peakKpIndex: 0 },
  updateMacroTelemetry: (envPayload) => {
    set((state) => ({
      ...state,
      macroEnvironment: envPayload
    }));
    
    if (envPayload.peakKpIndex >= 5 || envPayload.globalQuakes > 0) {
      const store = get();
      if (store.highlightNodes) {
        // Find matching nodes from Cortical or Temporal clusters dynamically
        const targetNodes = store.nodes
          .filter(n => n.tier === 'Cortical' || n.cluster === 'Temporal')
          .map(n => n.id);
        console.log(`[Macro-Disruption Activated]: Altering rendering states across simulation nodes:`, targetNodes);
        store.highlightNodes(targetNodes, 10000);
      }
    }
  }
}));
