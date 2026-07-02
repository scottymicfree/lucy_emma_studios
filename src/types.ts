/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum NodeStatus {
  IDLE = "idle",
  ACTIVE = "active",
  THINKING = "thinking",
  ROUTING = "routing",
  MERGING = "merging",
  RESPONDING = "responding",
  ERROR = "error",
  ALERT = "alert",
  HEARTBEAT = "heartbeat",
  ANOMALY = "anomaly",
  FAULT = "fault",
  SYNCING = "syncing",
}

export enum EventPriority {
  CRITICAL = "critical", // Lucy Prime
  HIGH = "high", // Safety/Alerts
  NORMAL = "normal", // Emma
  LOW = "low", // Background tasks
  BACKGROUND = "background", // Little Lucys
  SYSTEM = "system", // Internal agents
}

export interface Synapse {
  to: string;
  weight: number;
  latency: number;
  signalType: "data" | "command" | "feedback";
}

export interface Proposal {
  id: string;
  nodeId: string;
  action: "activate" | "route" | "store" | "respond" | "external_call";
  actionChain?: string[];
  target?: string;
  score?: number;
  reasoning?: string;
  confidence: number;
  intentAlignment: number;
  cost: number;
  novelty?: number;
  domain?: string;
}

export interface ExecutionResult {
  proposalId: string;
  nodeId: string;
  outcome: "success" | "failure" | "partial_failure";
  impact: number;
  latencyMs: number;
  details?: any;
}

export interface DecisionRecord {
  proposalId: string;
  nodeId: string;
  outcome: "success" | "failure" | "partial_failure";
  impact: number;
  details?: any;
}

export interface MetaState {
  globalIntent: string;
  intentPriority: number;
  intentWeights: Record<string, number>;
  priorityMap: Record<string, number>;
  systemLoad: number;
  winningNodes: string[]; // NEW: Track winning nodes for UI
  winningProposals: Proposal[]; // NEW: Track full proposals for UI
  synapticVisualsEnabled?: boolean; // NEW: Toggle for Synaptic Weights visuals
  nodeHalosEnabled?: boolean; // NEW: Toggle for Node Halos
  telemetryEnabled?: boolean; // NEW: Toggle for Advanced Telemetry
}

export interface Insight {
  id: string;
  timestamp: number;
  message: string;
  score: number;
  sourceNodeId: string;
  type: "anomaly" | "critical" | "pattern";
}

export interface ThrottlingState {
  active: boolean;
  level: 0 | 1 | 2 | 3; // 0: None, 1: Reduce Visuals, 2: Batch Events, 3: Pause Non-Critical
  reason?: string;
  timestamp: number;
}

export interface FiveMServer {
  id: string;
  name: string;
  type: "txAdmin" | "custom";
  baseUrl: string;
  status: "online" | "offline" | "starting" | "error";
  players: number;
  maxPlayers: number;
  lastSync: number;
  permissions: string[];
  userId: string;
}

export interface WorkflowStep {
  id: string;
  uid: string; // Unique ID for frontend rendering
  name: string;
  action: string;
  params?: any;
  condition?: string; // Simple logic string or function name
  retry?: number;
  rollback?: string; // Action to take on failure
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: "idle" | "running" | "completed" | "failed";
  lastRun?: number;
}

export interface CognitiveNode {
  id: string;
  uid: string; // Unique ID for frontend rendering
  type:
    | "LucyPrime"
    | "Emma"
    | "LittleLucy"
    | "Tool"
    | "External"
    | "FiveMServer"
    | "Telemetry"
    | "Workflow"
    | "ToolExecution"
    | "Memory"
    | "Security";
  subsystem:
    | "core"
    | "reasoning"
    | "orchestration"
    | "execution"
    | "memory"
    | "external"
    | "telemetry"
    | "security";
  status: NodeStatus;
  priority?: EventPriority;
  position: [number, number, number];
  connections: string[]; // Legacy, keeping for backward compat during migration
  synapses: Synapse[]; // NEW: Weighted graph system

  // NEW: Agent Evolution
  weight: number;
  energy: number;
  lastDecision?: string;
  autonomyLevel: number;
  decisionHistory?: {
    proposalId: string;
    action: string;
    outcome: string;
    confidence: number;
    timestamp: number;
    impact?: number;
    latencyMs?: number;
  }[];

  lastPayload?: any;
  lastUpdated: number;
  tier?: "Cortical" | "Subcortical" | "Cerebellar";
  cluster?:
    "Nucleus" | "Frontal" | "Parietal" | "Occipital" | "Temporal" | "Ledger";
  metadata?: {
    serverName?: string;
    players?: number;
    latency?: number;
    workflowId?: string;
    stepId?: string;
    currentStep?: string;
    blockProposalActive?: boolean;
    consensusLatency?: number;
    function?: string;
    promotedFrom?: string | null;
    statusDetail?: string;
    pulseRate?: string;
    precision?: string;
    syncState?: string;
    [key: string]: any;
  };
}

export interface MemoryLayer {
  shortTerm: any[];
  session: any[];
  longTerm: any[];
  embeddings: number[][]; // NEW: Vector embeddings
}

export interface VisualSettings {
  connectionSpeed: number;
  showTrails: boolean;
  showDashedLines: boolean;
}

export interface SystemSnapshot {
  id: string;
  timestamp: number;
  lucyState: NodeStatus;
  activeWorkflows: string[];
  serverStates: Record<string, "online" | "offline" | "error">;
  throttlingLevel: number;
  voiceState: "idle" | "speaking" | "listening" | "muted";
  hash: string;
}

export interface WorkflowCheckpoint {
  workflowId: string;
  stepId: string;
  context: any;
  timestamp: number;
}

export interface AgentExecutionLog {
  agentId: string;
  action: string;
  priority: number;
  timestamp: number;
  status: "success" | "blocked" | "failed";
  reason?: string;
}

export interface EventIntegrity {
  idempotencyKey: string;
  timestamp: number;
  signature: string;
  origin: string;
}

export enum ControlMode {
  NORMAL = "normal",
  SAFE = "safe",
  LOCKDOWN = "lockdown",
  RECOVERY = "recovery",
}

export interface UsageLimits {
  imagesPerDay: number;
  videoMinutesPerDay: number;
  musicTracksPerDay: number;
  lastReset: number;
}

export interface DeviceRegistration {
  id: string;
  userId: string;
  name: string;
  permissions: string[];
  lastSeen: number;
  status: "online" | "offline";
  trustState?: "trusted" | "untrusted" | "pending";
}

export interface ToolModule {
  id: string;
  name: string;
  category: "debug" | "fivem" | "social" | "memory" | "automation" | "system";
  description: string;
  permissions: string[];
  version: string;
  inputSchema?: any;
}

export interface Handbook {
  id: string;
  topic: string;
  slug: string;
  content: string;
  tags: string[];
  version: number;
  status: "draft" | "active" | "archived";
  authorUid: string;
  createdAt: number;
  updatedAt: number;
}

export interface SessionRecord {
  id: string;
  startTime: number;
  endTime?: number;
  status: "active" | "completed" | "failed";
  source: "desktop" | "web" | "mobile";
  nodePath: string[];
  toolsUsed: string[];
  errors?: any[];
  authorUid: string;
}

export enum TaskPhase {
  INTAKE = "INTAKE",
  ANALYSIS = "ANALYSIS",
  RESHAPING = "RESHAPING",
  EXECUTION = "EXECUTION",
}

// --- RECOVERY AND SUPERVISION ---
export interface ProcessState {
  pid: string;
  name: string;
  status: "running" | "stopped" | "failed" | "restarting";
  restarts: number;
  lastRestart: number;
  uptime: number;
  healthCheck: boolean;
}

export interface ProcessCheckpoint {
  id: string;
  pid: string;
  timestamp: number;
  stateData: any;
}

// --- PLUGIN ARCHITECTURE ---
export interface PluginDependency {
  pluginId: string;
  versionRange: string;
}

export interface PluginCapability {
  name: string;
  description: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  dependencies: PluginDependency[];
  capabilities: PluginCapability[];
  entryPoint: string;
  signature?: string; // For security
}

// --- RESOURCE MANAGEMENT ---
export interface ResourceBudget {
  gpuMemoryMb: number;
  cpuPercentage: number;
  networkBandwidthKbps: number;
}

export interface ResourceUsage {
  processId: string;
  currentUsage: ResourceBudget;
  peakUsage: ResourceBudget;
  throttled: boolean;
}

export interface TaskPriorityContext {
  taskId: string;
  priorityLevel: number;
  admissionStatus: "admitted" | "queued" | "rejected";
}

// --- SECURITY ---
export interface AuditLogEntry {
  id: string;
  timestamp: number;
  actor: string;
  action: string;
  resource: string;
  outcome: "success" | "denied" | "error";
  hash: string; // Immutable log hash
}

export interface SecurityContext {
  sandboxed: boolean;
  trustTier: "kernel" | "core" | "user" | "external";
  capabilities: string[];
}

export interface AgenticTask {
  id: string;
  description: string;
  type: string; // "Planetary Pulse Analysis", "Code Construction / Scripting", "Mixed Reality Rendering", "General"
  phase: TaskPhase;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  quorumReached: boolean;
  signaturesCount: number;
  matrix?: {
    requiredTier: string;
    targetCluster: string;
    powerAllocation: string;
    urgency: "high" | "critical" | "normal";
  };
  timestamp: number;
}

// --- DAG REASONING ENGINE ---

export type NodeId = string;

export interface RetrievalPlan {
  enabled: boolean;
  queryTemplate: string;
  sources: string[];
  maxItems: number;
}

export interface ReasoningNode {
  id: NodeId;
  type:
    | "decompose"
    | "retrieve"
    | "infer"
    | "compare"
    | "synthesize"
    | "plan"
    | "evaluate";
  inputRefs: NodeId[];
  outputRefs: NodeId[];
  status: "pending" | "running" | "done" | "failed";
  payload: any;
  result?: any;
  metadata: {
    costEstimate?: number;
    confidence?: number;
    createdAt: number;
    tags: string[];
  };
}

export interface ReasoningDAG {
  nodes: Map<NodeId, ReasoningNode>;
  edges: Array<{
    from: NodeId;
    to: NodeId;
    kind: "logical" | "causal" | "temporal" | "support";
  }>;
  rootNode: NodeId;
  goalNode: NodeId;
}

export interface ExecutionTrace {
  dagId: string;
  steps: Array<{
    nodeId: NodeId;
    type: ReasoningNode["type"];
    inputSnapshot: any;
    resultSnapshot: any;
    contextUsed: any;
    timestamp: number;
  }>;
  finalResult: any;
}

// --- SIMULATION ENGINE ---
export interface SimulationRequest {
  query: string;
  horizon: number; // e.g., years, cycles
  agents?: string[];
  variables?: string[];
  profile?: "Calm" | "Fast" | "Stress" | "Hyper Test";
}

export interface SimulationOutcome {
  finalState: any;
  keyEvents: Array<{ time: number; description: string; impact: string }>;
  risks: string[];
  opportunities: string[];
  branches?: any[];
  recommendations: string[];
  timeSeriesData?: any[]; // For recharts visualization
}

// --- FUSION ORCHESTRATOR ---
export interface GlobalContext {
  sessionId: string;
  userQuery: string;
  problemGraph: any;
  ragContext: any;
  hyperContext: any;
  dag: ReasoningDAG;
  config: {
    maxDepth: number;
    maxTokens: number;
    retrievalAggressiveness: "low" | "medium" | "high";
  };
}

export interface NodeContext {
  node: ReasoningNode;
  inputs: any[];
  ragSlice: any;
  hyperSlice: any;
  global: GlobalContext;
}

export interface FusionPlan {
  useRag: boolean;
  ragPlan?: RetrievalPlan;
  useHyper: boolean;
  hyperOps?: HyperOp[];
}

// --- HYPERGRAPH INTEGRATION ---
export interface HyperOp {
  type:
    | "expand_concept"
    | "find_relations"
    | "attach_hyperedge"
    | "suggest_new_hyperedges";
  params: any;
}

export interface SimState {
  simId: string;
  targetSector: string;          // e.g., "Fenton, MO"
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  currentTick: number;
  maxTicks: number;
  failureVectorsDetected: string[];
  checkpointTimestamp: number;
}

