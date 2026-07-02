import React, { useState, useEffect, useRef } from "react";
import {
  Terminal as TerminalIcon,
  Database,
  Cpu,
  Play,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Code,
  FileCode,
  GitBranch,
  ArrowRight,
  CornerDownRight,
  Lock,
  Layers,
  Search,
  Activity,
  User,
  Shield,
  FileText,
  AlertTriangle,
  Flame,
  Send,
  Sparkles,
  Trash2,
  AlertCircle,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNodeStore } from "../store/useNodeStore";
import {
  NodeStatus,
  EventPriority,
  CognitiveNode,
  AgenticTask,
  TaskPhase,
} from "../types";
import { Network } from "lucide-react";
import { SystemStateManager } from "../lib/core/systemStateManager";

interface ASTNode {
  name: string;
  type: string;
  lines: number;
  functions: string[];
  imports: string[];
}

const INITIAL_AST_NODES: Record<string, ASTNode> = {
  "server.ts": {
    name: "server.ts",
    type: "Backend Entrypoint",
    lines: 389,
    functions: [
      "startServer",
      "onConnection",
      "api/health",
      "api/embedding",
      "api/execute",
    ],
    imports: ["express", "socket.io", "better-sqlite3", "dotenv"],
  },
  "src/App.tsx": {
    name: "src/App.tsx",
    type: "SPA Root & Navigation",
    lines: 743,
    functions: [
      "App",
      "checkApiKey",
      "validateEnvironment",
      "exportDiagnostics",
      "handleLogin",
      "handleLogout",
    ],
    imports: ["react", "lucide-react", "motion/react", "socket.io-client"],
  },
  "src/components/LiveVoicePanel.tsx": {
    name: "src/components/LiveVoicePanel.tsx",
    type: "Interactive Audio UI",
    lines: 258,
    functions: [
      "LiveVoicePanel",
      "startSession",
      "stopSession",
      "onresult",
      "onerror",
    ],
    imports: ["react", "lucide-react", "motion/react"],
  },
  "src/lib/core/CognitiveEngine.ts": {
    name: "src/lib/core/CognitiveEngine.ts",
    type: "Cognitive Loop Orchestrator",
    lines: 398,
    functions: [
      "CognitiveEngine",
      "start",
      "stop",
      "evaluateProposals",
      "executeProposal",
    ],
    imports: ["socket.io-client", "store/useNodeStore"],
  },
};

const PRESETS = [
  {
    label: "Initialize Local Scope",
    cmd: "agy init --workspace-scope=local-first",
  },
  {
    label: "Mount Partition",
    cmd: "agy workspace add coding-station ./coding",
  },
  {
    label: "Link Memory Bank Skill",
    cmd: "agy skills link ~/.gemini/antigravity/skills/adk-memory-bank-initializer .",
  },
  {
    label: "Link Armor Shield Skill",
    cmd: "agy skills link ~/.gemini/antigravity/skills/gcp-agent-model-armor-shield .",
  },
  {
    label: "Attach Agent Zero",
    cmd: "agy agent attach coding-station --executor=agent-zero",
  },
  {
    label: "Enable Sandbox (Docker)",
    cmd: "agy agent-zero enable --sandbox=docker",
  },
  { label: "Mount CodexMemory", cmd: "agy codexmemory mount ./coding" },
  {
    label: "Index AST Structures",
    cmd: "agy codexmemory index --ast --zero-copy",
  },
  {
    label: "Start Compute (ALFA)",
    cmd: "agy start --scheduler=active-inference --potential-field=ALFA",
  },
  { label: "Monitor Telemetry", cmd: "agy telemetry monitor --field-gradient" },
  { label: "Attach All to Router", cmd: "agy router attach all" },
  { label: "Enable ALFA Scheduler", cmd: "agy scheduler enable --mode=ALFA" },
  {
    label: "Solve Potential Field",
    cmd: "agy scheduler field-solve --method=FEM",
  },
  { label: "Attach All to Stabilizer", cmd: "agy stabilize attach all" },
  { label: "Register All in Manager", cmd: "agy manager add-engine all" },
  {
    label: "Compile Unified Func",
    cmd: 'agy function create cross-platform --engines="unreal,fivem,alpha-matrix,agent-zero,skyvern,n8n" --router=AIF --scheduler=ALFA --memory=zero-copy --stabilization=full',
  },
  {
    label: "Refactor Workspace (AST)",
    cmd: 'agy exec /goal "Analyze and refactor the coding workspace using AST parsing"',
  },
  {
    label: "Inject Fault (TTY Hang)",
    cmd: "agy test inject-fault --target-node=coding-station --type=tty-hang",
  },
  { label: "Check Workspaces", cmd: "ls -R" },
  {
    label: "Run Agent Zero Fix",
    cmd: "agent-zero --goal='fix tts errors' --sandbox",
  },
  { label: "Analyze 351 Nodes", cmd: "agy telemetry analyze-nodes" },
  { label: "Reshape Node Mesh (351)", cmd: "agy mesh reshape --nodes=351" },
  {
    label: "Inject Fault (CN-004)",
    cmd: "agy test inject-fault --target-node=CN-004 --type=drop",
  },
];

export function CodingStationPanel() {
  const [activeSubTab, setActiveSubTab] = useState<
    "terminal" | "codex" | "agentzero" | "mesh" | "supervision"
  >("terminal");

  // Antigravity Local-First workspace states
  const [isWorkspaceInit, setIsWorkspaceInit] = useState(false);
  const [isPartitionAdded, setIsPartitionAdded] = useState(false);
  const [linkedSkills, setLinkedSkills] = useState<string[]>([]);

  // Extended Antigravity state variables
  const [isAgentAttached, setIsAgentAttached] = useState(false);
  const [isSandboxEnabled, setIsSandboxEnabled] = useState(false);
  const [isCodexMounted, setIsCodexMounted] = useState(false);
  const [isCodexIndexed, setIsCodexIndexed] = useState(false);
  const [isComputeStarted, setIsComputeStarted] = useState(false);
  const [isTelemetryMonitoring, setIsTelemetryMonitoring] = useState(false);

  // Potential Field & Router states
  const [isSchedulerAlfaEnabled, setIsSchedulerAlfaEnabled] = useState(false);
  const [isFieldSolvedFem, setIsFieldSolvedFem] = useState(false);
  const [isCrossPlatformCreated, setIsCrossPlatformCreated] = useState(false);

  // 137-Node Mesh Telemetry & Optimization states
  const storeNodes = useNodeStore((state) => state.nodes);
  const setStoreNodes = useNodeStore((state) => state.setNodes);
  const taskQueue = useNodeStore((state) => state.taskQueue);
  const activeTask = useNodeStore((state) => state.activeTask);
  const [intakeText, setIntakeText] = useState("");
  const [isMeshOptimized, setIsMeshOptimized] = useState(false);
  const [meshReshapingState, setMeshReshapingState] = useState<
    "idle" | "analyzing" | "reshaping" | "completed"
  >("idle");

  // Force update for SystemStateManager changes
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(interval);
  }, []);
  const [meshLog, setMeshLog] = useState<string[]>([
    "System nominal. 351 active cryptographic nodes registered in Neuro-Consensus Mesh.",
    "Consensus engine initialized: N=351, f=116, Quorum Certificate Threshold=233.",
    "EMMA kernel governance activated. Ready for network topology simulation.",
  ]);
  const [selectedSubsystemFilter, setSelectedSubsystemFilter] =
    useState<string>("all");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("CN-001");
  const [telemetryTickingMetrics, setTelemetryTickingMetrics] = useState({
    cpu: 84.6,
    mem: 9.12,
    netLatency: 44.2,
    reasoningEfficiency: 42.4,
    efeMinimization: 0.81,
    queueDepth: 64,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryTickingMetrics((prev) => {
        const noise = (Math.random() - 0.5) * 1.5;
        const noiseMem = (Math.random() - 0.5) * 0.08;
        const noiseLat = (Math.random() - 0.5) * 2;
        const noiseEFE = (Math.random() - 0.5) * 0.01;

        if (isMeshOptimized) {
          return {
            cpu: Math.max(18, Math.min(26, prev.cpu + noise * 0.3)),
            mem: Math.max(1.6, Math.min(2.1, prev.mem + noiseMem * 0.2)),
            netLatency: Math.max(
              1.8,
              Math.min(3.2, prev.netLatency + noiseLat * 0.1),
            ),
            reasoningEfficiency: Math.max(
              97.2,
              Math.min(99.8, prev.reasoningEfficiency + noise * 0.1),
            ),
            efeMinimization: Math.max(
              0.01,
              Math.min(0.04, prev.efeMinimization + noiseEFE * 0.1),
            ),
            queueDepth: 128,
          };
        } else {
          return {
            cpu: Math.max(78, Math.min(91, prev.cpu + noise)),
            mem: Math.max(8.4, Math.min(9.6, prev.mem + noiseMem)),
            netLatency: Math.max(38, Math.min(52, prev.netLatency + noiseLat)),
            reasoningEfficiency: Math.max(
              39,
              Math.min(46, prev.reasoningEfficiency + noise),
            ),
            efeMinimization: Math.max(
              0.74,
              Math.min(0.88, prev.efeMinimization + noiseEFE),
            ),
            queueDepth: Math.random() > 0.7 ? 64 : 48,
          };
        }
      });
    }, 1500);
    return () => clearInterval(timer);
  }, [isMeshOptimized]);

  const runMeshAnalysis = () => {
    setMeshReshapingState("analyzing");
    setMeshLog((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ⚡ Initiating core orchestration telemetry diagnostics...`,
      `[${new Date().toLocaleTimeString()}] ✔ Polled telemetry across exactly 351 active cryptographic nodes.`,
      `[${new Date().toLocaleTimeString()}] ⚠️ Potential field scheduling bottlenecks parsed in Frontal Executive Cluster (FX-014 through FX-039).`,
      `[${new Date().toLocaleTimeString()}] ⚠️ Expected Free Energy (EFE) policy variance identified across Subcortical regional arrays.`,
      `[${new Date().toLocaleTimeString()}] ⚠️ Occipital Visual Mesh (OV-066 through OV-091) exhibiting high context-switching latency.`,
      `[${new Date().toLocaleTimeString()}] ⚠️ Temporal Memory Array (TM-092 through TM-117) epoch synchronization lagging: threshold = 233 matches.`,
      `[${new Date().toLocaleTimeString()}] OS Telemetry status: CPU scheduling congested, network routing paths unaligned.`,
      `[${new Date().toLocaleTimeString()}] Analysis complete. Topology optimization recommended. Run 'agy mesh reshape'.`,
    ]);
    setMeshReshapingState("idle");
  };

  const runMeshReshaping = () => {
    setMeshReshapingState("reshaping");
    setMeshLog((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] 🚀 Reshaping 351-Node Neuro-Consensus Mesh to minimize Expected Free Energy...`,
      `[${new Date().toLocaleTimeString()}] ⚙️ Step 1: Solving Finite Element Method (FEM) potential field equations for 351 nodes...`,
      `[${new Date().toLocaleTimeString()}] ⚙️ Step 2: Transitioning Mid-Tier regional clusters (FX, PS, OV, TM) to ALFA Potential Field Scheduling...`,
      `[${new Date().toLocaleTimeString()}] ⚙️ Step 3: Binding 351 nodes to Zero-Copy shared memory buffers and setting Quorum Certificate Threshold to 233...`,
      `[${new Date().toLocaleTimeString()}] ⚙️ Step 4: Activating EMMA kernel governance self-stabilizing layers & wave crash recovery hooks...`,
    ]);

    const optimizedNodes = storeNodes.map((node) => {
      let updatedSynapses = node.synapses.map((s) => ({
        ...s,
        latency: Math.max(1.0, Number((s.latency * 0.1).toFixed(1))),
        weight: Math.min(1.0, s.weight * 1.5),
      }));
      return {
        ...node,
        status: NodeStatus.ACTIVE,
        weight: node.weight * 1.2,
        energy: 100.0,
        synapses: updatedSynapses,
      };
    });
    setStoreNodes(optimizedNodes);

    setIsMeshOptimized(true);
    setMeshReshapingState("completed");
    setMeshLog((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ✔ Active Inference Router (AIF) EFE policy minimizer wired successfully.`,
      `[${new Date().toLocaleTimeString()}] ✔ Distributed token ring mutual exclusion initialized for 351 nodes.`,
      `[${new Date().toLocaleTimeString()}] ✔ Mesh stabilized. N=351 nodes operating in perfect alignment. Quorum certificate = 233 matching signatures.`,
      `[${new Date().toLocaleTimeString()}] Optimized Topology Nominal: Average Cortical Nucleus latency reduced to 1.2ms, reasoning efficiency maximized to 99.4%.`,
    ]);
  };

  const runTriggerChaos = (targetNode: string | any = "CN-004") => {
    const actualTarget = typeof targetNode === "string" ? targetNode : "CN-004";
    setMeshLog((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ⚠️ Artificial Fault Injected: Disconnecting memory boundary/node ${actualTarget}...`,
    ]);

    // update store node to error state
    const errorNode = storeNodes.map((n) =>
      n.id === actualTarget
        ? { ...n, status: NodeStatus.ERROR, energy: 0.0 }
        : n,
    );
    setStoreNodes(errorNode);

    setTelemetryTickingMetrics((prev) => ({
      ...prev,
      netLatency: 75.4,
      cpu: 92.1,
    }));

    const recoveredNodes = storeNodes.map((node) => {
      if (node.id === actualTarget) {
        return { ...node, status: NodeStatus.ACTIVE, energy: 100.0 };
      }
      return node;
    });
    setStoreNodes(recoveredNodes);

    setMeshLog((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ⚡ Stabilization Layer Alert: Decentralized spanning tree detected node drop of ${actualTarget}.`,
      `[${new Date().toLocaleTimeString()}] 🔄 Launching wave-reset reset propagation across the mesh...`,
      `[${new Date().toLocaleTimeString()}] 🛡️ EMMA Kernel Governance Rule Triggered: Promoting background ledger CL node...`,
      `[${new Date().toLocaleTimeString()}] ✔ CRDT log delta synchronized. Memory consistency reconstructed.`,
      `[${new Date().toLocaleTimeString()}] ✔ Node ${actualTarget} self-stabilized successfully. System converged to nominal state.`,
    ]);

    setTelemetryTickingMetrics((prev) => ({
      ...prev,
      netLatency: isMeshOptimized ? 1.2 : 44.2,
      cpu: isMeshOptimized ? 21.5 : 84.6,
    }));
  };

  const executeTaskWorkflow = (taskDescription: string) => {
    if (!taskDescription.trim()) return;

    // Determine task type based on keywords
    let taskType = "General";
    if (/pulse|planetary|parietal/i.test(taskDescription)) {
      taskType = "Planetary Pulse Analysis";
    } else if (/code|script|compile|construct|front/i.test(taskDescription)) {
      taskType = "Code Construction / Scripting";
    } else if (/reality|render|mixed|occipital|visual/i.test(taskDescription)) {
      taskType = "Mixed Reality Rendering";
    }

    const taskId = `task-${Date.now()}`;

    // Set target configurations for visualization matrix
    let requiredTier = "Subcortical";
    let targetCluster = "Temporal (TM)";
    let powerAllocation = "70%";
    let urgency: "critical" | "high" | "normal" = "normal";

    if (taskType === "Planetary Pulse Analysis") {
      targetCluster = "Parietal (PS)";
      powerAllocation = "95%";
      urgency = "critical";
    } else if (taskType === "Code Construction / Scripting") {
      targetCluster = "Frontal (FX)";
      powerAllocation = "90%";
      urgency = "high";
    } else if (taskType === "Mixed Reality Rendering") {
      targetCluster = "Occipital (OV)";
      powerAllocation = "98%";
      urgency = "critical";
    }

    const newTask: AgenticTask = {
      id: taskId,
      description: taskDescription,
      type: taskType,
      phase: TaskPhase.INTAKE,
      status: "running",
      progress: 0,
      quorumReached: false,
      signaturesCount: 0,
      matrix: {
        requiredTier,
        targetCluster,
        powerAllocation,
        urgency,
      },
      timestamp: Date.now(),
    };

    // Update Zustand Store
    useNodeStore.getState().addTaskToQueue(newTask);
    useNodeStore.getState().setActiveTask(newTask);

    // Switch view to terminal so logs are visible
    setActiveSubTab("terminal");

    // Start timeline simulation
    setTerminalHistory((prev) => [
      ...prev,
      `$ agy workflow deploy --task="${taskDescription}"`,
      `[${new Date().toLocaleTimeString()}] 🚀 Initiating End-to-End Agentic Task-Workflow Engine...`,
      `[${new Date().toLocaleTimeString()}] 📥 [PHASE 1: INTAKE] Parsing incoming objectives...`,
    ]);

    const systemState = SystemStateManager.getInstance();
    const safetyResult = systemState.evaluateTaskSafety(taskType);

    systemState.security.logAudit(
      "lucy-core",
      "deploy_workflow",
      taskId,
      safetyResult ? "success" : "denied",
    );
    const isAdmitted = systemState.resources.requestResources(
      taskId,
      { gpuMemoryMb: 4096, cpuPercentage: 45, networkBandwidthKbps: 50000 },
      85,
    );
    const hasPlugin = systemState.plugins.isCapabilityAvailable("advanced_analysis");

    useNodeStore.getState().optimizeMeshForTask(taskType);
    setIsMeshOptimized(true);

    SystemStateManager.getInstance().supervision.registerProcess(
      taskId,
      `Workflow Engine: ${taskType}`,
    );
    SystemStateManager.getInstance().supervision.createCheckpoint(taskId, {
      phase: "RESHAPING_COMPLETE",
    });

    const finalSignatures = Math.floor(Math.random() * (351 - 233 + 1)) + 233;
    const ledgerBlock = `0x${Math.floor(Math.random() * 16777215).toString(16).toUpperCase()}`;

    SystemStateManager.getInstance().resources.releaseResources(taskId);

    useNodeStore.getState().updateTask(taskId, {
      status: "completed",
      progress: 100,
      phase: TaskPhase.EXECUTION,
      signaturesCount: finalSignatures,
      quorumReached: true,
    });

    setTerminalHistory((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] 📥 [PHASE 1: INTAKE] Input successfully parsed. Generated abstracted JSON task matrix.`,
      `[${new Date().toLocaleTimeString()}] 🧠 [PHASE 2: ANALYSIS] Structural alignment verified. Core nodes match objective signature.`,
      `[${new Date().toLocaleTimeString()}] 🛡️ [SECURITY] Task evaluation: ${safetyResult ? "PASSED (Trust Tier: Kernel, Sandboxing: ACTIVE)" : "BLOCKED"}`,
      `[${new Date().toLocaleTimeString()}] 📊 [RESOURCE MGR] Admission Control: ${isAdmitted ? "ADMITTED (GPU: 4GB, CPU: 45%)" : "QUEUED"}`,
      `[${new Date().toLocaleTimeString()}] 🌀 [PHASE 3: RESHAPING] Mesh reshaping solver output received successfully.`,
      `[${new Date().toLocaleTimeString()}] ⚡ [PHASE 4: EXECUTION] Quorum poll completed: ${finalSignatures} signatures. Processing data vectors...`,
      `[${new Date().toLocaleTimeString()}] 📜 [CEREBELLAR LEDGER] Task successfully committed to Cerebellar Ledger (Block #${ledgerBlock})`,
      `[${new Date().toLocaleTimeString()}] ✔ Workflow complete. All systems returned to autonomous steady-state.`,
      `[${new Date().toLocaleTimeString()}] ------------------------------------------------------------`,
    ]);

    setMeshLog((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] 🌀 Workflow-driven mesh optimization requested for "${taskType}"...`,
      `[${new Date().toLocaleTimeString()}] ✔ Optimized potential levels for ${targetCluster} nodes to maximize throughput.`,
      `[${new Date().toLocaleTimeString()}] ✔ Ledger verified. Workflow task committed to Block #${ledgerBlock}.`,
    ]);
  };

  // Registered Engines for Compute Mesh Ω
  const [engines, setEngines] = useState<
    Array<{
      name: string;
      type: string;
      addr: string;
      sharedMemory: "NONE" | "ZERO-COPY";
      status: "ACTIVE" | "INACTIVE";
      isRouterAttached?: boolean;
      isStabilized?: boolean;
      isManagerAdded?: boolean;
    }>
  >([
    {
      name: "unreal",
      type: "visualizer",
      addr: "localhost:7001",
      sharedMemory: "NONE",
      status: "INACTIVE",
      isRouterAttached: false,
      isStabilized: false,
      isManagerAdded: false,
    },
    {
      name: "fivem",
      type: "gameworld",
      addr: "localhost:30120",
      sharedMemory: "NONE",
      status: "INACTIVE",
      isRouterAttached: false,
      isStabilized: false,
      isManagerAdded: false,
    },
    {
      name: "alpha-matrix",
      type: "ui-engine",
      addr: "localhost:3005",
      sharedMemory: "NONE",
      status: "INACTIVE",
      isRouterAttached: false,
      isStabilized: false,
      isManagerAdded: false,
    },
    {
      name: "agent-zero",
      type: "executor",
      addr: "localhost:9000",
      sharedMemory: "NONE",
      status: "INACTIVE",
      isRouterAttached: false,
      isStabilized: false,
      isManagerAdded: false,
    },
    {
      name: "skyvern",
      type: "browser",
      addr: "localhost:8080",
      sharedMemory: "NONE",
      status: "INACTIVE",
      isRouterAttached: false,
      isStabilized: false,
      isManagerAdded: false,
    },
    {
      name: "n8n",
      type: "workflow",
      addr: "localhost:5678",
      sharedMemory: "NONE",
      status: "INACTIVE",
      isRouterAttached: false,
      isStabilized: false,
      isManagerAdded: false,
    },
  ]);

  // Terminal State
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    "LUCY PRIME [Coding Station v1.0.0]",
    "Initializing CodexMemory AST mappings...",
    "Local terminal engine started. Ready for secure commands.",
    "Type 'help' or click a preset to begin.",
  ]);
  const [isTerminalRunning, setIsTerminalRunning] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // CodexMemory State
  const [selectedFile, setSelectedFile] = useState<string>("server.ts");
  const [searchQuery, setSearchQuery] = useState("");

  // Agent Zero Task State
  const [taskGoal, setTaskGoal] = useState(
    "Optimize cognitive router evaluation loops to prevent latency spikes",
  );
  const [isTaskRunning, setIsTaskRunning] = useState(false);
  const [taskSteps, setTaskSteps] = useState<
    Array<{
      name: string;
      status: "pending" | "running" | "completed";
      details?: string;
    }>
  >([
    {
      name: "Parse Goal & Intent",
      status: "pending",
      details: "Extract target constraints & action list",
    },
    {
      name: "Query CodexMemory AST",
      status: "pending",
      details: "Identify files and functions matching query",
    },
    {
      name: "Configure Sandbox",
      status: "pending",
      details: "Launch secure isolated docker boundary",
    },
    {
      name: "Execute Refactor Pass",
      status: "pending",
      details: "Write non-breaking local-first modifications",
    },
    {
      name: "Verify Build & Lint",
      status: "pending",
      details: "Ensure zero compilation errors",
    },
  ]);
  const [taskOutput, setTaskOutput] = useState<string[]>([]);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalHistory]);

  const handleRegisterAllEngines = () => {
    setIsTerminalRunning(true);
    setTerminalHistory((prev) => [
      ...prev,
      "$ agy engine register [batch-mode]",
    ]);

    setTimeout(() => {
      setEngines((prev) =>
        prev.map((e) => ({ ...e, status: "ACTIVE" as const })),
      );
      setTerminalHistory((prev) => [
        ...prev,
        "Registering 6 engine nodes inside the compute mesh Ω...",
        "✔ Mapped node ID: unreal (visualizer) at localhost:7001",
        "✔ Mapped node ID: fivem (gameworld) at localhost:30120",
        "✔ Mapped node ID: alpha-matrix (ui-engine) at localhost:3005",
        "✔ Mapped node ID: agent-zero (executor) at localhost:9000",
        "✔ Mapped node ID: skyvern (browser) at localhost:8080",
        "✔ Mapped node ID: n8n (workflow) at localhost:5678",
        "✔ Added 6 nodes to multi-dimensional scheduling coordinates",
        "Batch engine registration completed successfully.",
      ]);
      setIsTerminalRunning(false);
    }, 1200);
  };

  const handleBindAllEngines = () => {
    setIsTerminalRunning(true);
    setTerminalHistory((prev) => [...prev, "$ agy engine bind [batch-mode]"]);

    setTimeout(() => {
      setEngines((prev) =>
        prev.map((e) => ({ ...e, sharedMemory: "ZERO-COPY" as const })),
      );
      setTerminalHistory((prev) => [
        ...prev,
        "Binding 6 registered engines to zero-copy shared memory plane...",
        "✔ Mount zero-copy memory buffers for unreal, fivem, alpha-matrix, agent-zero, skyvern, n8n",
        "✔ Attached io_uring asynchronous ring submissions",
        "✔ Synchronized CRDT status deltas with SynapticGrid pointers",
        "All 6 engines successfully bound to zero-copy shared memory plane.",
      ]);
      setIsTerminalRunning(false);
    }, 1200);
  };

  const handleAttachAllRouter = () => {
    setIsTerminalRunning(true);
    setTerminalHistory((prev) => [
      ...prev,
      "$ agy router attach all [batch-mode]",
    ]);

    setTimeout(() => {
      setEngines((prev) => prev.map((e) => ({ ...e, isRouterAttached: true })));
      setTerminalHistory((prev) => [
        ...prev,
        "Connecting ALL registered engines to Active Inference Router (AIF-Router)...",
        "✔ Minimizing Expected Free Energy (EFE) values across Ω coordinates",
        "✔ Enabled exploration-exploitation balance routines for unreal, fivem, alpha-matrix, agent-zero, skyvern, n8n",
        "✔ Zero token loss buffers allocated for synaptic grid telemetry",
        "All engines successfully connected and active on AIF-Router!",
      ]);
      setIsTerminalRunning(false);
    }, 1200);
  };

  const handleSolveFem = () => {
    setIsTerminalRunning(true);
    setTerminalHistory((prev) => [
      ...prev,
      "$ agy scheduler field-solve --method=FEM",
    ]);

    setTimeout(() => {
      setIsSchedulerAlfaEnabled(true);
      setIsFieldSolvedFem(true);
      setTerminalHistory((prev) => [
        ...prev,
        "Solving continuous potential field across all 6 engines using Finite Element Method (FEM)...",
        "✔ Created mesh boundaries and coordinates for Ω",
        "✔ Discretized continuous gradient field equation with active-inference nodes",
        "✔ Solved ALFA Potential Field: Nominal stability confirmed",
        "✔ Potential Field Gradient Monitor activated",
        "Tasks successfully distributed: visual tasks ➔ unreal, browser tasks ➔ skyvern, ui tasks ➔ alpha-matrix, workflows ➔ n8n, executor tasks ➔ agent-zero, gameworld tasks ➔ fivem.",
      ]);
      setIsTerminalRunning(false);
    }, 1200);
  };

  const handleStabilizeAll = () => {
    setIsTerminalRunning(true);
    setTerminalHistory((prev) => [
      ...prev,
      "$ agy stabilize attach [batch-mode]",
    ]);

    setTimeout(() => {
      setEngines((prev) => prev.map((e) => ({ ...e, isStabilized: true })));
      setTerminalHistory((prev) => [
        ...prev,
        "Attaching ALL registered engines to self-stabilizing layers...",
        "✔ Linked decentralized spanning tree recovery network to unreal, fivem, alpha-matrix, agent-zero, skyvern, n8n",
        "✔ Activated wave/reset crash recovery handlers across the mesh",
        "✔ Synced local state ledgers for real-time CRDT delta reconstruction",
        "✔ Initialized token ring mutual exclusion and distributed consensus",
        "All 6 engines successfully secured with fault-tolerant self-stabilization.",
      ]);
      setIsTerminalRunning(false);
    }, 1200);
  };

  const handleManagerAddAll = () => {
    setIsTerminalRunning(true);
    setTerminalHistory((prev) => [
      ...prev,
      "$ agy manager add-engine [batch-mode]",
    ]);

    setTimeout(() => {
      setEngines((prev) => prev.map((e) => ({ ...e, isManagerAdded: true })));
      setTerminalHistory((prev) => [
        ...prev,
        "Registering 6 engines into the Agent Manager Control Plane...",
        "✔ Exposing live dependency maps and active subprocess topologies",
        "✔ Registered unreal (visualizer) on manager console",
        "✔ Registered fivem (gameworld) on manager console",
        "✔ Registered alpha-matrix (ui-engine) on manager console",
        "✔ Registered agent-zero (executor) on manager console",
        "✔ Registered skyvern (browser) on manager console",
        "✔ Registered n8n (workflow) on manager console",
        "✔ Compiled live routing paths and browser portal proxies",
        "All 6 engines successfully registered in Agent Manager Control Plane.",
      ]);
      setIsTerminalRunning(false);
    }, 1200);
  };

  const handleCreateCrossPlatform = () => {
    setIsTerminalRunning(true);
    setTerminalHistory((prev) => [
      ...prev,
      '$ agy function create cross-platform --engines="unreal,fivem,alpha-matrix,agent-zero,skyvern,n8n" --router=AIF --scheduler=ALFA --memory=zero-copy --stabilization=full',
    ]);

    setTimeout(() => {
      setIsCrossPlatformCreated(true);
      setTerminalHistory((prev) => [
        ...prev,
        "Compiling cross-platform orchestrator function 'cross-platform'...",
        "✔ Verified 6-engine coordination topology: unreal, fivem, alpha-matrix, agent-zero, skyvern, n8n",
        "✔ Bound Active Inference Router (AIF) Expected Free Energy (EFE) router policies",
        "✔ Configured ALFA Potential Field scheduler coordinates",
        "✔ Wired zero-copy shared memory plane and io_uring ring submissions",
        "✔ Activated full self-stabilizing layers (spanning-tree/reset-waves)",
        "✔ Expatched code to Agent Manager control plane: Nominal state",
        "Unified cross-platform function created successfully!",
        "This function is now capable of executing code, automating browsers, triggering workflows, driving 3D render loops, controlling sandbox environments, and managing UI state as a single unified system.",
      ]);
      setIsTerminalRunning(false);
    }, 1500);
  };

  // Terminal Handler
  const executeTerminalCommand = (cmdText: string) => {
    if (!cmdText.trim()) return;
    const cleanCmd = cmdText.trim();

    setTerminalHistory((prev) => [...prev, `$ ${cleanCmd}`]);
    setIsTerminalRunning(true);

    setTimeout(() => {
      let response: string[] = [];
      const lower = cleanCmd.toLowerCase();

      if (lower === "help") {
        response = [
          "Available Commands:",
          "  help                               - Show this guide",
          "  ls / ls -R                         - List files in workspace",
          "  agy init --workspace-scope=local-first - Initialize local-first engine",
          "  agy workspace add coding-station ./coding - Mount coding-station partition",
          "  agy skills link <skill_path> .     - Link advanced AST/security engine rules",
          "  agy engine register --name=<name> --type=<type> --addr=<address> - Register engine node inside Ω mesh",
          "  agy engine bind <name> --shared-memory=zero-copy - Bind engine to zero-copy memory plane",
          "  codexmemory --ast <file>           - Extract AST schema details",
          "  agent-zero --goal <g>              - Trigger autonomous code execution loop",
          "  clear                              - Clear terminal scrollback",
        ];
      } else if (lower === "clear") {
        setTerminalHistory([]);
        setIsTerminalRunning(false);
        setTerminalInput("");
        return;
      } else if (lower === "ls" || lower === "ls -r") {
        response = [
          "Workspace Files:",
          " ├── README.md",
          " ├── AGENTS.md",
          " ├── package.json",
          " ├── server.ts",
          " └── src/",
          "      ├── App.tsx",
          "      ├── types.ts",
          "      └── components/",
          "           ├── ChatPanel.tsx",
          "           ├── CodingStationPanel.tsx",
          "           └── LiveVoicePanel.tsx",
        ];
        if (isPartitionAdded) {
          response.push(
            " └── coding/                  [Partition: coding-station Mounted]",
          );
        }
      } else if (lower.startsWith("agy init")) {
        if (cleanCmd.includes("workspace-scope=local-first")) {
          setIsWorkspaceInit(true);
          response = [
            "Initializing Antigravity local-first workspace scope...",
            "✔ Mapped workspace-scope to 'local-first'",
            "✔ Loaded local configuration templates inside './.agent/'",
            "✔ Configured mmap-backed memory bounds",
            "✔ Setup CRDT state consistency ledger",
            "Antigravity local-first environment initialized successfully.",
          ];
        } else {
          response = ["Usage: agy init --workspace-scope=local-first"];
        }
      } else if (lower.startsWith("agy workspace add")) {
        if (
          cleanCmd.includes("coding-station") &&
          cleanCmd.includes("./coding")
        ) {
          if (!isWorkspaceInit) {
            response = [
              "Error: Workspace scope not initialized. Run 'agy init --workspace-scope=local-first' first.",
            ];
          } else {
            setIsPartitionAdded(true);
            response = [
              "Adding workspace partition 'coding-station'...",
              "✔ Mount directory path './coding' verified",
              "✔ Initialized zero-copy shared memory access structures",
              "✔ Bound local-first agent permissions key with Docker container context",
              "Partition 'coding-station' added and active.",
            ];
          }
        } else {
          response = ["Usage: agy workspace add coding-station ./coding"];
        }
      } else if (lower.startsWith("agy skills link")) {
        if (!isWorkspaceInit) {
          response = [
            "Error: Workspace scope not initialized. Run 'agy init --workspace-scope=local-first' first.",
          ];
        } else {
          const path = cleanCmd.split(" ").slice(3, 4)[0] || "";
          if (path.includes("adk-memory-bank-initializer")) {
            setLinkedSkills((prev) => [
              ...new Set([...prev, "adk-memory-bank-initializer"]),
            ]);
            response = [
              "Linking AST memory bank initializer rules...",
              "✔ Loaded skill matching template: 'adk-memory-bank-initializer'",
              "✔ Initialized mmap-backed AST parsing protocols",
              "✔ Configured CRDT-backed write consistency boundaries",
              "Skill link verified and established.",
            ];
          } else if (path.includes("gcp-agent-model-armor-shield")) {
            setLinkedSkills((prev) => [
              ...new Set([...prev, "gcp-agent-model-armor-shield"]),
            ]);
            response = [
              "Linking secure agent model armor shield protection gates...",
              "✔ Loaded skill matching template: 'gcp-agent-model-armor-shield'",
              "✔ Initialized zero-copy shared memory boundaries",
              "✔ Armor Shield policy enforced: terminal.exec, workspace.write, codexmemory.ast",
              "Skill link verified and established.",
            ];
          } else {
            response = [
              `Linking custom skill: '${path}'`,
              "✔ Loaded skill layout configurations",
              "Skill successfully linked.",
            ];
          }
        }
      } else if (lower.startsWith("agy agent attach")) {
        if (
          cleanCmd.includes("coding-station") &&
          cleanCmd.includes("--executor=agent-zero")
        ) {
          setIsAgentAttached(true);
          response = [
            "Attaching executor to coding-station...",
            "✔ Checked permissions block for 'coding-station'",
            "✔ Linked executor 'agent-zero' safely",
            "✔ Configured crash recovery via the Wave Layer active listeners",
            "Executor 'agent-zero' attached to 'coding-station' successfully.",
          ];
        } else {
          response = [
            "Usage: agy agent attach coding-station --executor=agent-zero",
          ];
        }
      } else if (lower.startsWith("agy agent-zero enable")) {
        if (cleanCmd.includes("--sandbox=docker")) {
          if (!isAgentAttached) {
            response = [
              "Error: Agent must be attached before sandbox configuration. Run 'agy agent attach coding-station --executor=agent-zero' first.",
            ];
          } else {
            setIsSandboxEnabled(true);
            response = [
              "Configuring Agent Zero runtime sandbox...",
              "✔ Checked local Docker daemon socket connection",
              "✔ Provisioned isolated scratch space for safe script execution",
              "✔ Enabled persistent execution log streaming",
              "✔ Safe Docker isolated execution sandbox is now ACTIVE.",
            ];
          }
        } else {
          response = ["Usage: agy agent-zero enable --sandbox=docker"];
        }
      } else if (lower.startsWith("agy codexmemory mount")) {
        if (cleanCmd.includes("./coding")) {
          setIsCodexMounted(true);
          response = [
            "Mounting CodexMemory virtual semantic storage system...",
            "✔ Verified directory mount path './coding'",
            "✔ Mounted semantic structure indexing points",
            "CodexMemory mounted on './coding' successfully.",
          ];
        } else {
          response = ["Usage: agy codexmemory mount ./coding"];
        }
      } else if (lower.startsWith("agy codexmemory index")) {
        if (cleanCmd.includes("--ast") && cleanCmd.includes("--zero-copy")) {
          if (!isCodexMounted) {
            response = [
              "Error: CodexMemory must be mounted first. Run 'agy codexmemory mount ./coding' first.",
            ];
          } else {
            setIsCodexIndexed(true);
            response = [
              "Starting zero-copy AST semantic indexing phase...",
              "✔ Initializing mmap-backed token parsers",
              "✔ Indexing codebase schemas and class dependencies",
              "✔ Saved index to local footprint database (< 200MB footprint established)",
              "CodexMemory indexing complete! Real-time code structural lookup active.",
            ];
          }
        } else {
          response = ["Usage: agy codexmemory index --ast --zero-copy"];
        }
      } else if (lower.startsWith("agy start")) {
        if (
          cleanCmd.includes("--scheduler=active-inference") &&
          cleanCmd.includes("--potential-field=ALFA")
        ) {
          setIsComputeStarted(true);
          response = [
            "Booting Antigravity local-first Compute Engine...",
            "✔ Initializing 'active-inference' potential-field scheduler",
            "✔ Loaded load-balancing potential field gradient [ALFA]",
            "✔ Created zero-copy shared memory plane",
            "✔ Hooked io_uring async syscall submission queues",
            "✔ Initialized speculative tool execution pipelines",
            "Compute Engine status: ACTIVE [ALFA Mode]",
          ];
        } else {
          response = [
            "Usage: agy start --scheduler=active-inference --potential-field=ALFA",
          ];
        }
      } else if (lower.startsWith("agy telemetry monitor")) {
        if (cleanCmd.includes("--field-gradient")) {
          if (!isComputeStarted) {
            response = [
              "Error: Compute engine must be active to stream telemetry. Run 'agy start --scheduler=active-inference --potential-field=ALFA' first.",
            ];
          } else {
            setIsTelemetryMonitoring(true);
            response = [
              "Establishing active-inference telemetry listener streams...",
              "✔ Telemetry monitor bound to potential-field ALFA gradient",
              "✔ io_uring submission queues linked to performance monitor",
              "Telemetry monitor is ACTIVE. Use the visual widgets to watch performance.",
            ];
          }
        } else {
          response = ["Usage: agy telemetry monitor --field-gradient"];
        }
      } else if (lower.startsWith("agy exec")) {
        if (
          cleanCmd.includes(
            '/goal "Analyze and refactor the coding workspace using AST parsing"',
          ) ||
          cleanCmd.includes("Analyze and refactor")
        ) {
          response = [
            "Initiating speculative goal execution via ALFA Compute scheduler...",
            "Goal: Analyze and refactor the coding workspace using AST parsing",
            "✔ Initializing active-inference speculative paths with potential-field ALFA",
            "✔ Queried CodexMemory AST node indexing database",
            "✔ Loaded zero-copy shared memory AST descriptors from server.ts and src/App.tsx",
            "✔ Dispatched autonomous agent-zero script runner in isolated Docker sandbox",
            "✔ Executed code refactor safely on local partition 'coding-station'",
            "✔ Spanning tree recovery state verified: Nominal",
            "Result: 100% stable execution complete. 0 compilation errors. Speculative routes resolved successfully.",
          ];
        } else {
          response = [
            "Executing goal via local execution engine...",
            `Goal: ${cleanCmd.split("/goal").pop()?.trim() || "Analyze and refactor workspace"}`,
            "✔ Dispatched to Agent Zero sandbox",
            "✔ AST integrity validated",
            "Result: completed with exit code 0.",
          ];
        }
      } else if (lower.startsWith("agy test inject-fault")) {
        if (
          cleanCmd.includes("coding-station") &&
          cleanCmd.includes("type=tty-hang")
        ) {
          response = [
            "[FAULT INJECTION] Injecting 'tty-hang' fault into target node 'coding-station'...",
            "⚠ WARNING: Terminal TTY hang detected! Connection on terminal stream lost.",
            "⚡ [Wave Layer] Triggering Wave reset layer recovery...",
            "🔄 [Spanning Tree] Initializing spanning tree recovery protocols...",
            "🔄 [Spanning Tree] Found stable backup node path. Re-establishing link...",
            "✔ [CRDT State] Executing CRDT state restoration from secure local ledger...",
            "✔ [CRDT State] State synchronized. Zero token loss verified.",
            "✔ Recovery complete! Coding station is fully STABLE and restored.",
          ];
        } else {
          response = [
            "Usage: agy test inject-fault --target-node=coding-station --type=tty-hang",
          ];
        }
      } else if (lower.startsWith("agy engine register")) {
        // Parse --name, --type, and --addr from command line
        const nameMatch = cleanCmd.match(/--name=([^\s]+)/);
        const typeMatch = cleanCmd.match(/--type=([^\s]+)/);
        const addrMatch = cleanCmd.match(/--addr=([^\s]+)/);

        if (nameMatch && typeMatch && addrMatch) {
          const name = nameMatch[1];
          const type = typeMatch[1];
          const addr = addrMatch[1];

          setEngines((prev) => {
            const exists = prev.some((e) => e.name === name);
            if (exists) {
              return prev.map((e) =>
                e.name === name
                  ? { ...e, type, addr, status: "ACTIVE" as const }
                  : e,
              );
            } else {
              return [
                ...prev,
                {
                  name,
                  type,
                  addr,
                  sharedMemory: "NONE" as const,
                  status: "ACTIVE" as const,
                },
              ];
            }
          });

          response = [
            `Registering engine node '${name}' inside the compute mesh Ω...`,
            `✔ Mapped node ID: ${name}`,
            `✔ Registered type: ${type}`,
            `✔ Verified address binding: ${addr}`,
            `✔ Added to scheduling topology coordinates`,
            `Engine node '${name}' registered successfully.`,
          ];
        } else {
          response = [
            "Usage: agy engine register --name=<name> --type=<type> --addr=<address>",
            "Example: agy engine register --name=unreal --type=visualizer --addr=localhost:7001",
          ];
        }
      } else if (lower.startsWith("agy engine bind")) {
        // e.g. agy engine bind unreal --shared-memory=zero-copy
        const parts = cleanCmd.split(" ");
        const engineName = parts[3] || "";
        const shmMatch = cleanCmd.match(/--shared-memory=([^\s]+)/);

        if (engineName && shmMatch) {
          const shm = shmMatch[1];
          const bindingType = shm.toUpperCase() as "ZERO-COPY";

          setEngines((prev) => {
            return prev.map((e) =>
              e.name === engineName ? { ...e, sharedMemory: bindingType } : e,
            );
          });

          response = [
            `Binding engine '${engineName}' to shared memory plane...`,
            `✔ Mounted zero-copy memory buffers for ${engineName}`,
            `✔ Attached io_uring asynchronous ring submissions`,
            `✔ Synchronized CRDT status deltas with SynapticGrid`,
            `Engine '${engineName}' successfully bound to zero-copy shared memory.`,
          ];
        } else {
          response = [
            "Usage: agy engine bind <engine_name> --shared-memory=zero-copy",
            "Example: agy engine bind unreal --shared-memory=zero-copy",
          ];
        }
      } else if (lower.startsWith("agy router attach")) {
        // e.g. agy router attach unreal
        const parts = cleanCmd.split(" ");
        const targetEngine = parts[3] || "";

        if (targetEngine) {
          if (targetEngine.toLowerCase() === "all") {
            setEngines((prev) =>
              prev.map((e) => ({ ...e, isRouterAttached: true })),
            );
            response = [
              "Connecting ALL registered engines to Active Inference Router (AIF-Router)...",
              "✔ Minimizing Expected Free Energy (EFE) values across Ω coordinates",
              "✔ Enabled exploration-exploitation balance routines for unreal, fivem, alpha-matrix, agent-zero, skyvern, n8n",
              "✔ Zero token loss buffers allocated for synaptic grid telemetry",
              "All engines successfully connected and active on AIF-Router!",
            ];
          } else {
            const exists = engines.some(
              (e) => e.name.toLowerCase() === targetEngine.toLowerCase(),
            );
            if (exists) {
              setEngines((prev) =>
                prev.map((e) =>
                  e.name.toLowerCase() === targetEngine.toLowerCase()
                    ? { ...e, isRouterAttached: true }
                    : e,
                ),
              );
              response = [
                `Connecting engine '${targetEngine}' to Active Inference Router (AIF-Router)...`,
                "✔ Evaluated Expected Free Energy (EFE) routing profiles",
                `✔ Bound node ID: ${targetEngine}`,
                `✔ Verified link telemetry with zero load spikes`,
                `Engine '${targetEngine}' successfully attached to Active Inference Router.`,
              ];
            } else {
              response = [
                `Error: Engine '${targetEngine}' not found in Compute Mesh Ω.`,
                "Register the engine first using 'agy engine register'.",
              ];
            }
          }
        } else {
          response = [
            "Usage: agy router attach <engine_name> | all",
            "Example: agy router attach unreal",
          ];
        }
      } else if (lower.startsWith("agy scheduler enable")) {
        if (cleanCmd.includes("--mode=ALFA")) {
          setIsSchedulerAlfaEnabled(true);
          response = [
            "Activating ALFA Potential Field Scheduling across all compute engines...",
            "✔ Initialized continuous potential field model on multi-dimensional mesh Ω",
            "✔ Configured gradient flows along steepest task routing paths",
            "✔ SynapticGrid routing priorities activated",
            "ALFA Potential Field Scheduler is now ENABLED. System is ready to solve.",
          ];
        } else {
          response = ["Usage: agy scheduler enable --mode=ALFA"];
        }
      } else if (lower.startsWith("agy scheduler field-solve")) {
        if (cleanCmd.includes("--method=FEM")) {
          if (!isSchedulerAlfaEnabled) {
            response = [
              "Warning: ALFA scheduler mode is not enabled yet. Enabling automatically...",
              "Solving continuous potential field across all 6 engines using Finite Element Method (FEM)...",
              "✔ Created mesh boundaries and coordinates for Ω",
              "✔ Discretized continuous gradient field equation with active-inference nodes",
              "✔ Solved ALFA Potential Field: Nominal stability confirmed",
              "✔ Potential Field Gradient Monitor activated",
              "Tasks successfully distributed: visual tasks ➔ unreal, browser tasks ➔ skyvern, ui tasks ➔ alpha-matrix, workflows ➔ n8n, executor tasks ➔ agent-zero, gameworld tasks ➔ fivem.",
            ];
            setIsSchedulerAlfaEnabled(true);
            setIsFieldSolvedFem(true);
          } else {
            setIsFieldSolvedFem(true);
            response = [
              "Solving continuous potential field across all 6 engines using Finite Element Method (FEM)...",
              "✔ Created mesh boundaries and coordinates for Ω",
              "✔ Discretized continuous gradient field equation with active-inference nodes",
              "✔ Solved ALFA Potential Field: Nominal stability confirmed",
              "✔ Potential Field Gradient Monitor activated",
              "Tasks successfully distributed: visual tasks ➔ unreal, browser tasks ➔ skyvern, ui tasks ➔ alpha-matrix, workflows ➔ n8n, executor tasks ➔ agent-zero, gameworld tasks ➔ fivem.",
            ];
          }
        } else {
          response = ["Usage: agy scheduler field-solve --method=FEM"];
        }
      } else if (lower.startsWith("agy stabilize attach")) {
        const parts = cleanCmd.split(" ");
        const targetEngine = parts[3] || "";

        if (targetEngine) {
          if (targetEngine.toLowerCase() === "all") {
            setEngines((prev) =>
              prev.map((e) => ({ ...e, isStabilized: true })),
            );
            response = [
              "Attaching ALL registered engines to self-stabilizing layers...",
              "✔ Linked decentralized spanning tree recovery network to unreal, fivem, alpha-matrix, agent-zero, skyvern, n8n",
              "✔ Activated wave/reset crash recovery handlers across the mesh",
              "✔ Synced local state ledgers for real-time CRDT delta reconstruction",
              "✔ Initialized token ring mutual exclusion and distributed consensus",
              "All 6 engines successfully secured with fault-tolerant self-stabilization.",
            ];
          } else {
            const exists = engines.some(
              (e) => e.name.toLowerCase() === targetEngine.toLowerCase(),
            );
            if (exists) {
              setEngines((prev) =>
                prev.map((e) =>
                  e.name.toLowerCase() === targetEngine.toLowerCase()
                    ? { ...e, isStabilized: true }
                    : e,
                ),
              );
              response = [
                `Attaching engine '${targetEngine}' to self-stabilizing layers...`,
                "✔ Linked decentralized spanning tree recovery path",
                "✔ Registered wave/reset layer handlers",
                "✔ Synchronized local CRDT ledger deltas",
                `Engine '${targetEngine}' successfully secured with self-stabilization.`,
              ];
            } else {
              response = [
                `Error: Engine '${targetEngine}' not found in Compute Mesh Ω.`,
                "Register the engine first using 'agy engine register'.",
              ];
            }
          }
        } else {
          response = [
            "Usage: agy stabilize attach <engine_name> | all",
            "Example: agy stabilize attach unreal",
          ];
        }
      } else if (lower.startsWith("agy manager add-engine")) {
        const parts = cleanCmd.split(" ");
        const targetEngine = parts[3] || "";

        if (targetEngine) {
          if (targetEngine.toLowerCase() === "all") {
            setEngines((prev) =>
              prev.map((e) => ({ ...e, isManagerAdded: true })),
            );
            response = [
              "Registering ALL 6 engines into the Agent Manager Control Plane...",
              "✔ Exposing live dependency maps and active subprocess topologies",
              "✔ Registered unreal, fivem, alpha-matrix, agent-zero, skyvern, n8n on manager console",
              "All engines successfully registered in Agent Manager Control Plane.",
            ];
          } else {
            const exists = engines.some(
              (e) => e.name.toLowerCase() === targetEngine.toLowerCase(),
            );
            if (exists) {
              setEngines((prev) =>
                prev.map((e) =>
                  e.name.toLowerCase() === targetEngine.toLowerCase()
                    ? { ...e, isManagerAdded: true }
                    : e,
                ),
              );
              response = [
                `Registering engine '${targetEngine}' into Agent Manager Control Plane...`,
                "✔ Exposing active live dependency mapping info",
                `✔ Bound subprocess logger for ${targetEngine}`,
                `Engine '${targetEngine}' successfully registered in Agent Manager.`,
              ];
            } else {
              response = [
                `Error: Engine '${targetEngine}' not found in Compute Mesh Ω.`,
                "Register the engine first using 'agy engine register'.",
              ];
            }
          }
        } else {
          response = [
            "Usage: agy manager add-engine <engine_name>",
            "Example: agy manager add-engine unreal",
          ];
        }
      } else if (lower.startsWith("agy function create")) {
        if (cleanCmd.includes("cross-platform")) {
          setIsCrossPlatformCreated(true);
          response = [
            "Compiling cross-platform orchestrator function 'cross-platform'...",
            "✔ Verified 6-engine coordination topology: unreal, fivem, alpha-matrix, agent-zero, skyvern, n8n",
            "✔ Bound Active Inference Router (AIF) Expected Free Energy (EFE) router policies",
            "✔ Configured ALFA Potential Field scheduler coordinates",
            "✔ Wired zero-copy shared memory plane and io_uring ring submissions",
            "✔ Activated full self-stabilizing layers (spanning-tree/reset-waves)",
            "✔ Expatched code to Agent Manager control plane: Nominal state",
            "Unified cross-platform function created successfully!",
            "This function is now capable of executing code, automating browsers, triggering workflows, driving 3D render loops, controlling sandbox environments, and managing UI state as a single unified system.",
          ];
        } else {
          response = [
            'Usage: agy function create cross-platform --engines="unreal,fivem,alpha-matrix,agent-zero,skyvern,n8n" --router=AIF --scheduler=ALFA --memory=zero-copy --stabilization=full',
          ];
        }
      } else if (lower.startsWith("codexmemory --ast")) {
        const file = cleanCmd.split(" ").pop() || "server.ts";
        const metadata = INITIAL_AST_NODES[file];
        if (metadata) {
          response = [
            `[CodexMemory AST Extracted for ${file}]`,
            `  Path: /${file}`,
            `  Type: ${metadata.type}`,
            `  Total Lines: ${metadata.lines}`,
            `  Imports found: ${metadata.imports.join(", ")}`,
            `  Functions:`,
            ...metadata.functions.map((f) => `    - function ${f}()`),
          ];
        } else {
          response = [
            `Error: File '${file}' not parsed in memory mesh yet. Try server.ts`,
          ];
        }
      } else if (
        lower.startsWith("agy telemetry analyze-nodes") ||
        lower.startsWith("agy mesh analyze")
      ) {
        setActiveSubTab("mesh");
        runMeshAnalysis();

        // Run a full .map() iteration over all 351 nodes to evaluate structural health
        const allNodes = useNodeStore.getState().nodes;
        let activeCount = 0;
        let errorCount = 0;
        let syncingCount = 0;
        let totalLatency = 0;

        const healthReport = allNodes.map((node) => {
          const isFaulty =
            node.status === NodeStatus.ERROR ||
            node.status === NodeStatus.FAULT;
          const isSyncing = node.status === NodeStatus.SYNCING;
          if (isFaulty) errorCount++;
          else if (isSyncing) syncingCount++;
          else activeCount++;

          const baselineLatency =
            node.metadata?.latency ||
            (node.tier === "Cortical"
              ? 1.2
              : node.tier === "Subcortical"
                ? 4.2
                : 8.5);
          totalLatency += baselineLatency;

          return {
            id: node.id,
            tier: node.tier || "Cerebellar",
            health: isFaulty ? 0 : isSyncing ? 50 : 100,
            status: node.status,
            latency: baselineLatency,
          };
        });

        const avgLatency = Number((totalLatency / allNodes.length).toFixed(2));
        const overallIntegrity = Number(
          (
            ((activeCount + syncingCount * 0.5) / allNodes.length) *
            100
          ).toFixed(2),
        );
        const quorumStatus = useNodeStore.getState().getQuorumStatus();

        response = [
          `[Neuro-Consensus Telemetry System Diagnostic]`,
          `  Total parsed nodes: ${allNodes.length}`,
          `  Active/Online: ${activeCount}`,
          `  Syncing/Stabilizing: ${syncingCount}`,
          `  Degraded/Faulty: ${errorCount}`,
          `  Average node latency: ${avgLatency}ms`,
          `  Overall Mesh Integrity score: ${overallIntegrity}%`,
          `  Quorum Status: ${quorumStatus.isQuorumReached ? "REACHED" : "LOCKED"} (${quorumStatus.activeSignatures}/351 active signatures, margin: ${quorumStatus.byzantineMargin})`,
          `  Anomalous/degraded nodes list:`,
          ...healthReport
            .filter((r) => r.health < 100)
            .map(
              (r) =>
                `    - Node ${r.id} [${r.tier.toUpperCase()}]: Status = ${r.status.toUpperCase()} (Health: ${r.health}%)`,
            ),
        ];
        if (errorCount === 0 && syncingCount === 0) {
          response.push(
            "    - No anomalous or degraded nodes found in the 351-node mesh topology.",
          );
        }
      } else if (lower.startsWith("agy mesh reshape")) {
        setActiveSubTab("mesh");
        runMeshReshaping();
        response = [
          "Dispatched continuous potential field solver sequence...",
          "✔ Computing optimal topology against current OS telemetry",
          "✔ Active Inference Expected Free Energy (EFE) minimization routine triggered",
          "Routing to MESH TELEMETRY tab to view active reshaping animation...",
        ];
      } else if (lower.startsWith("agy test inject-fault")) {
        let targetNode = "CN-004";
        const targetMatch = cleanCmd.match(/--target-node=([A-Za-z0-9-]+)/);
        if (targetMatch && targetMatch[1]) {
          targetNode = targetMatch[1].toUpperCase();
        }
        setActiveSubTab("mesh");

        // Directly mutate the targeted node's status to 'FAULT' in live state
        useNodeStore
          .getState()
          .updateNode(targetNode, { status: NodeStatus.FAULT });

        runTriggerChaos(targetNode);

        response = [
          `[Artificial Fault Injection Dispatcher]`,
          `  Targeting node ID: ${targetNode}`,
          `  Mutating live status to FAULT...`,
          `  [EMMA Kernel Triggered] Instantly running failover state transitions...`,
          `  Routing to 351-NODE MESH TELEMETRY tab to view active failover and self-stabilization.`,
        ];
      } else if (lower.startsWith("agent-zero")) {
        response = [
          "Starting Agent Zero Engine execution...",
          "Permissions validated: [terminal.exec, workspace.write, codexmemory.read]",
          "Setting up environment sandboxes...",
          "Checking Docker network configuration...",
          "Ready. Use the AGENT ZERO tab for a full visual task execution flow.",
        ];
      } else {
        response = [
          `Executing: ${cleanCmd}`,
          "Simulation: command dispatched directly to terminal engine bridge.",
          "Result: completed with exit code 0.",
        ];
      }

      setTerminalHistory((prev) => [...prev, ...response]);
      setIsTerminalRunning(false);
    }, 800);

    setTerminalInput("");
  };

  // Agent Zero loop runner
  const runAgentZeroTask = () => {
    if (isTaskRunning) return;
    setIsTaskRunning(true);
    setTaskOutput([]);

    // Reset steps
    setTaskSteps((prev) => prev.map((s) => ({ ...s, status: "pending" })));

    let currentStepIdx = 0;

    const runNextStep = () => {
      if (currentStepIdx >= 5) {
        setIsTaskRunning(false);
        setTaskOutput((prev) => [
          ...prev,
          "✔ All tasks verified. Refactored changes committed successfully to workspace!",
        ]);
        return;
      }

      setTaskSteps((prev) =>
        prev.map((s, idx) => {
          if (idx === currentStepIdx) return { ...s, status: "running" };
          if (idx < currentStepIdx) return { ...s, status: "completed" };
          return s;
        }),
      );

      // Simulate output details
      const stepMessages = [
        [
          `[Agent Zero] Instantiating goal: "${taskGoal}"`,
          "[Agent Zero] Constraints verified: max_context=1M, local_fs=true, docker=true",
          "[Agent Zero] Goal parse complete.",
        ],
        [
          "[CodexMemory] Loading class structure trees...",
          "[CodexMemory] Mapping references to /src/lib/core/CognitiveEngine.ts",
          "[CodexMemory] AST match found: CognitiveEngine.executeProposal() -> optimized 3 recursive sub-calls.",
        ],
        [
          "[Docker] Creating container context 'agent-zero-sandbox-c21'...",
          "[Docker] Safe isolation mounted on workspace workspace.write key.",
          "[Docker] Local file system mirrors successfully initialized.",
        ],
        [
          "[Refactor] Generating semantic diff block for executeProposal()...",
          "[Refactor] Replacing nested promise arrays with optimized batch stream logic.",
          "[Refactor] Applied non-breaking refactoring pass safely.",
        ],
        [
          "[Verify] Running 'tsc --noEmit' lint validation...",
          "[Verify] Run completed. 0 compilation errors.",
          "[Verify] Applet compiled and dev server automatically refreshed.",
        ],
      ];

      setTaskOutput((prev) => [...prev, ...stepMessages[currentStepIdx]]);

      currentStepIdx++;
      setTimeout(runNextStep, 2500);
    };

    runNextStep();
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] text-white overflow-hidden rounded-xl border border-white/10 shadow-2xl">
      {/* Top Header - Info Panel */}
      <div className="p-5 border-b border-white/10 bg-[#0a0a0a] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/30 text-blue-400">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wider font-mono">
                AGENT "CODING-STATION"
              </h2>
              <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/30 text-[9px] font-mono rounded font-bold">
                ONLINE
              </span>
            </div>
            <p className="text-xs text-white/40 font-mono mt-0.5">
              Local-first code execution and refactoring kernel
            </p>
          </div>
        </div>

        {/* Profile Permissions Info */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg border border-white/10 text-white/60">
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>CONTEXT: 1M</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg border border-white/10 text-white/60">
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            <span>LOCAL DOCKER: PERMITTED</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg border border-white/10 text-white/60">
            <Shield className="w-3.5 h-3.5 text-green-400" />
            <span>WORKSPACE: R/W</span>
          </div>
        </div>
      </div>

      {/* Agentic Task-Workflow Engine Control Deck */}
      <div className="bg-[#090911] border-b border-white/10 p-4 px-6 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeTask?.status === "running" ? "bg-amber-400" : "bg-blue-400"}`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${activeTask?.status === "running" ? "bg-amber-500" : "bg-blue-500"}`}
              ></span>
            </span>
            <div>
              <h3 className="text-xs font-bold tracking-wider font-mono text-white flex items-center gap-2">
                AGENTIC TASK-WORKFLOW ENGINE
              </h3>
              <p className="text-[10px] text-white/40 font-mono mt-0.5">
                Consensus mesh routing, potential field solvers & cerebellar
                ledger sync
              </p>
            </div>
          </div>

          {/* Input and Deploy button */}
          <div className="flex items-center gap-2 flex-1 max-w-2xl">
            <div className="relative flex-1 flex items-center bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 focus-within:border-blue-500/50 transition-colors">
              <span className="text-[10px] text-white/30 font-mono font-bold uppercase mr-2 select-none">
                Intake New Objective:
              </span>
              <input
                type="text"
                value={intakeText}
                onChange={(e) => setIntakeText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    executeTaskWorkflow(intakeText);
                    setIntakeText("");
                  }
                }}
                placeholder="planetary pulse analysis, codeconstruction, mixed reality..."
                className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-white placeholder:text-white/20"
              />
            </div>
            <button
              onClick={() => {
                executeTaskWorkflow(intakeText);
                setIntakeText("");
              }}
              disabled={activeTask?.status === "running"}
              className={`px-4 py-2 text-xs font-bold font-mono tracking-wider rounded-lg transition-all flex items-center gap-1.5 border uppercase ${
                activeTask?.status === "running"
                  ? "bg-white/5 border-white/10 text-white/30 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 border-blue-500/30 text-white cursor-pointer active:scale-95"
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              Deploy Workflow
            </button>
          </div>
        </div>

        {/* Real-time Stage Progression Timeline */}
        {activeTask && (
          <div className="mt-1 bg-black/30 border border-white/5 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-white/60 flex items-center gap-1">
                  <span>ACTIVE OBJECTIVE:</span>
                  <span className="text-blue-400 font-bold truncate max-w-[200px] md:max-w-md">
                    "{activeTask.description}"
                  </span>
                </span>
                <span className="text-white/40 flex items-center gap-2">
                  <span>PROGRESS:</span>
                  <span className="font-bold text-white font-mono">
                    {activeTask.progress}%
                  </span>
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${activeTask.progress}%` }}
                />
              </div>
            </div>

            {/* Stepper Timeline Visuals */}
            <div className="flex items-center gap-4 text-[10px] font-mono select-none">
              {[
                { phase: TaskPhase.INTAKE, label: "INTAKE" },
                { phase: TaskPhase.ANALYSIS, label: "ANALYSIS" },
                { phase: TaskPhase.RESHAPING, label: "RESHAPING" },
                { phase: TaskPhase.EXECUTION, label: "EXECUTION" },
              ].map((step, idx) => {
                const isCompleted =
                  activeTask.progress === 100 ||
                  (step.phase === TaskPhase.INTAKE &&
                    activeTask.phase !== TaskPhase.INTAKE) ||
                  (step.phase === TaskPhase.ANALYSIS &&
                    activeTask.phase !== TaskPhase.INTAKE &&
                    activeTask.phase !== TaskPhase.ANALYSIS) ||
                  (step.phase === TaskPhase.RESHAPING &&
                    activeTask.phase === TaskPhase.EXECUTION);
                const isActive =
                  activeTask.phase === step.phase &&
                  activeTask.status === "running";

                return (
                  <div key={idx} className="flex items-center gap-2">
                    {idx > 0 && <span className="text-white/10">→</span>}
                    <div
                      className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-all ${
                        isCompleted
                          ? "bg-green-500/10 border-green-500/20 text-green-400 font-bold"
                          : isActive
                            ? "bg-amber-500/15 border-amber-500/30 text-amber-400 font-bold animate-pulse"
                            : "bg-white/5 border-white/5 text-white/30"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      )}
                      <span>{step.label}</span>
                    </div>
                  </div>
                );
              })}

              {/* Quorum Badge */}
              <div
                className={`px-2.5 py-1 rounded border text-[9px] font-bold flex items-center gap-1 ${
                  activeTask.quorumReached
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-white/5 border-white/5 text-white/20"
                }`}
              >
                <Shield className="w-3 h-3" />
                <span>
                  QUORUM:{" "}
                  {activeTask.quorumReached
                    ? `REACHED (${activeTask.signaturesCount}/351)`
                    : "LOCKED"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Primary Navigation Tabs */}
      <div className="border-b border-white/5 bg-[#070707] flex items-center px-6">
        <button
          onClick={() => setActiveSubTab("terminal")}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold font-mono tracking-widest transition-all ${
            activeSubTab === "terminal"
              ? "border-blue-500 text-blue-400 bg-white/5"
              : "border-transparent text-white/40 hover:text-white"
          }`}
        >
          <TerminalIcon className="w-3.5 h-3.5" />
          TERMINAL ENGINE
        </button>
        <button
          onClick={() => setActiveSubTab("codex")}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold font-mono tracking-widest transition-all ${
            activeSubTab === "codex"
              ? "border-purple-500 text-purple-400 bg-white/5"
              : "border-transparent text-white/40 hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          CODEXMEMORY AST
        </button>
        <button
          onClick={() => setActiveSubTab("agentzero")}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold font-mono tracking-widest transition-all ${
            activeSubTab === "agentzero"
              ? "border-amber-500 text-amber-400 bg-white/5"
              : "border-transparent text-white/40 hover:text-white"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          AGENT ZERO EXECUTION
        </button>
        <button
          onClick={() => setActiveSubTab("mesh")}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold font-mono tracking-widest transition-all ${
            activeSubTab === "mesh"
              ? "border-emerald-500 text-emerald-400 bg-white/5"
              : "border-transparent text-white/40 hover:text-white"
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          351-NODE MESH TELEMETRY
        </button>
        <button
          onClick={() => setActiveSubTab("supervision")}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold font-mono tracking-widest transition-all ${
            activeSubTab === "supervision"
              ? "border-cyan-500 text-cyan-400 bg-white/5"
              : "border-transparent text-white/40 hover:text-white"
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          SUPERVISION & SEC
        </button>
      </div>

      {/* Main Section Inner */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sub-tab 1: Terminal Engine */}
        {activeSubTab === "terminal" && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#030303]">
            {/* Terminal Panel */}
            <div className="flex-1 flex flex-col border-r border-white/5 h-full">
              <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-2 text-blue-300">
                {terminalHistory.map((line, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {line.startsWith("$") ? (
                      <span className="text-white font-bold">{line}</span>
                    ) : line.startsWith("Error:") ||
                      line.startsWith("Result:") ? (
                      <span className="text-amber-400">{line}</span>
                    ) : (
                      <span className="text-blue-300/80">{line}</span>
                    )}
                  </div>
                ))}
                {isTerminalRunning && (
                  <div className="flex items-center gap-2 text-blue-400 animate-pulse mt-1">
                    <span className="w-1.5 h-3.5 bg-blue-400" />
                    <span>Executing task zero local kernel...</span>
                  </div>
                )}
                <div ref={terminalEndRef} />
              </div>

              {/* Bottom Quick-Actions Tray */}
              <div className="p-2 bg-black/40 border-t border-white/5 flex flex-wrap items-center gap-2 px-4">
                <span className="text-[9px] font-bold tracking-wider font-mono text-white/30 uppercase mr-1">
                  Quick Actions:
                </span>

                {/* Analyze 351 Nodes Button */}
                <button
                  onClick={() =>
                    executeTerminalCommand("agy telemetry analyze-nodes")
                  }
                  className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 hover:border-blue-500/45 rounded-md font-mono text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Run automated 351-node telemetry mapping diagnostics"
                >
                  <Activity className="w-3 h-3 animate-pulse" />
                  Analyze 351 Nodes
                </button>

                {/* Inject Fault (CN-004) Button */}
                <button
                  onClick={() =>
                    executeTerminalCommand(
                      "agy test inject-fault --target-node=CN-004",
                    )
                  }
                  className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/45 rounded-md font-mono text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Inject artificial memory-boundary fault into node CN-004"
                >
                  <AlertCircle className="w-3 h-3 animate-pulse" />
                  Inject Fault (CN-004)
                </button>

                {/* System Reboot Button */}
                <button
                  onClick={() => {
                    setTerminalHistory((prev) => [
                      ...prev,
                      `$ agy system reboot`,
                      `[${new Date().toLocaleTimeString()}] 🔄 Initiating complete hardware and software state reboot...`,
                      `[${new Date().toLocaleTimeString()}] ⚙️ Step 1: Stopping all active subprocesses and cleaning IPC message lanes...`,
                      `[${new Date().toLocaleTimeString()}] ⚙️ Step 2: Unmounting file tables and syncing dirty data cache blocks...`,
                      `[${new Date().toLocaleTimeString()}] ⚙️ Step 3: Performing hot kernel bootstrap (System Reboot Sequence)...`,
                      `[${new Date().toLocaleTimeString()}] ✔ System restarted successfully. All 351 active-inference nodes stabilized on startup.`,
                    ]);
                  }}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/20 hover:border-amber-500/45 rounded-md font-mono text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Reboot the system kernel"
                >
                  <RefreshCw className="w-3 h-3" />
                  System Reboot
                </button>

                {/* Memory Flush Button */}
                <button
                  onClick={() => {
                    setTerminalHistory((prev) => [
                      ...prev,
                      `$ agy memory flush`,
                      `[${new Date().toLocaleTimeString()}] 🧹 Cleaning temporary memory spaces and short-term caches...`,
                      `[${new Date().toLocaleTimeString()}] ✔ Flushed 1024 cycles of short-term token buffers.`,
                      `[${new Date().toLocaleTimeString()}] ✔ Reclaimed 142.8 MB of local AST heap pages.`,
                      `[${new Date().toLocaleTimeString()}] Memory footprint stabilized at sub-200MB scale (Monorepo boundary).`,
                    ]);
                  }}
                  className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 border border-purple-500/20 hover:border-purple-500/45 rounded-md font-mono text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Flush short-term memory buffers"
                >
                  <Trash2 className="w-3 h-3" />
                  Memory Flush
                </button>
              </div>

              {/* Terminal Inputs */}
              <div className="p-3 bg-[#0a0a0a] border-t border-white/10 flex items-center gap-3">
                <span className="text-blue-500 font-mono text-sm font-bold pl-1">
                  $
                </span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      executeTerminalCommand(terminalInput);
                    }
                  }}
                  placeholder="Type secure local terminal commands... (e.g., help, ls, clear)"
                  className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-white placeholder:text-white/20"
                />
                <button
                  onClick={() => executeTerminalCommand(terminalInput)}
                  className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Action Sidebars */}
            <div className="w-full md:w-72 p-4 bg-[#080808] flex flex-col gap-4 overflow-y-auto">
              {/* Workspace Status Card */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-[10px] font-bold tracking-wider font-mono uppercase text-white/90">
                    Workspace Monitor
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-[9px]">
                  <div className="flex justify-between items-center">
                    <span className="text-white/40">SCOPE ENGINE:</span>
                    <span
                      className={
                        isWorkspaceInit
                          ? "text-green-400 font-bold"
                          : "text-amber-500 font-bold"
                      }
                    >
                      {isWorkspaceInit ? "LOCAL-FIRST" : "UNINITIALIZED"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40">PARTITION:</span>
                    <span
                      className={
                        isPartitionAdded
                          ? "text-green-400 font-bold"
                          : "text-white/20"
                      }
                    >
                      {isPartitionAdded ? "coding-station" : "NONE"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40">WRITE CONSISTENCY:</span>
                    <span
                      className={
                        linkedSkills.includes("adk-memory-bank-initializer")
                          ? "text-green-400 font-bold"
                          : "text-white/20"
                      }
                    >
                      {linkedSkills.includes("adk-memory-bank-initializer")
                        ? "CRDT-BACKED"
                        : "STANDARD"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40">AST PROTOCOL:</span>
                    <span
                      className={
                        linkedSkills.includes("adk-memory-bank-initializer")
                          ? "text-purple-400 font-bold"
                          : "text-white/20"
                      }
                    >
                      {linkedSkills.includes("adk-memory-bank-initializer")
                        ? "MMAP-BACKED"
                        : "STANDARD"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40">MEMORY ACCESS:</span>
                    <span
                      className={
                        linkedSkills.includes("gcp-agent-model-armor-shield")
                          ? "text-blue-400 font-bold"
                          : "text-white/20"
                      }
                    >
                      {linkedSkills.includes("gcp-agent-model-armor-shield")
                        ? "ZERO-COPY SHARED"
                        : "SERIALIZED"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Execution Engine Box */}
              {(isAgentAttached || isSandboxEnabled) && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl font-mono text-[9px] space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold uppercase tracking-wide">
                    <Cpu
                      className="w-3.5 h-3.5 animate-spin"
                      style={{ animationDuration: "3s" }}
                    />
                    <span>Agent Zero Sandbox</span>
                  </div>
                  <div className="space-y-1 text-white/70">
                    <div className="flex justify-between">
                      <span>STATUS:</span>
                      <span className="text-amber-400 font-bold">
                        {isAgentAttached ? "ATTACHED" : "PENDING"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>SANDBOX:</span>
                      <span
                        className={
                          isSandboxEnabled
                            ? "text-green-400 font-bold"
                            : "text-amber-500/60"
                        }
                      >
                        {isSandboxEnabled ? "DOCKER ACTIVE" : "STANDARD"}
                      </span>
                    </div>
                    {isSandboxEnabled && (
                      <div className="pt-1 text-[8px] text-amber-400/80 border-t border-amber-500/10 space-y-0.5 leading-tight">
                        <div>• Isolated Docker container active</div>
                        <div>• Wave Layer crash recovery system live</div>
                        <div>• Safe execution permissions enforced</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CodexMemory Mount Status */}
              {(isCodexMounted || isCodexIndexed) && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl font-mono text-[9px] space-y-2">
                  <div className="flex items-center gap-1.5 text-purple-300 font-bold uppercase tracking-wide">
                    <Database className="w-3.5 h-3.5" />
                    <span>CodexMemory Mesh</span>
                  </div>
                  <div className="space-y-1 text-white/70">
                    <div className="flex justify-between">
                      <span>MOUNT:</span>
                      <span className="text-purple-400 font-bold">
                        ./coding
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>INDEX PROTOCOL:</span>
                      <span
                        className={
                          isCodexIndexed
                            ? "text-purple-400 font-bold"
                            : "text-white/20"
                        }
                      >
                        {isCodexIndexed ? "MMAP AST" : "STANDARD"}
                      </span>
                    </div>
                    {isCodexIndexed && (
                      <div className="pt-1 text-[8px] text-purple-400/80 border-t border-purple-500/10 space-y-0.5 leading-tight">
                        <div>• Zero-copy shared memory active</div>
                        <div>• Footprint: &lt; 200MB (Monorepo scale)</div>
                        <div>• Real-time semantic code lookup ready</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Compute Engine & Telemetry Status */}
              {(isComputeStarted ||
                isTelemetryMonitoring ||
                isSchedulerAlfaEnabled ||
                isFieldSolvedFem) && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl font-mono text-[9px] space-y-2">
                  <div className="flex items-center gap-1.5 text-blue-300 font-bold uppercase tracking-wide">
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                    <span>ALFA Compute Engine</span>
                  </div>
                  <div className="space-y-1 text-white/70">
                    <div className="flex justify-between">
                      <span>SCHEDULER:</span>
                      <span className="text-blue-400 font-bold">
                        {isSchedulerAlfaEnabled
                          ? "AIF (ALFA ACTIVE)"
                          : "Active Inference"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>FIELD POTENTIAL:</span>
                      <span className="text-blue-400 font-bold">
                        {isFieldSolvedFem
                          ? "FEM RESOLVER ACTIVE"
                          : isSchedulerAlfaEnabled
                            ? "ALFA FIELD"
                            : "ALFA"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>SPECULATIVE IO:</span>
                      <span className="text-green-400 font-bold">io_uring</span>
                    </div>
                    {(isTelemetryMonitoring ||
                      isSchedulerAlfaEnabled ||
                      isFieldSolvedFem) && (
                      <div className="pt-1.5 border-t border-blue-500/10">
                        <div className="text-[8px] text-blue-300/80 font-bold uppercase tracking-wider mb-1">
                          Potential Field Gradient Monitor:
                        </div>
                        {/* Beautiful CSS animated field gradient */}
                        <div className="h-2 w-full bg-gradient-to-r from-blue-900 via-indigo-800 to-purple-900 rounded overflow-hidden relative border border-white/5">
                          <div
                            className={`absolute top-0 bottom-0 left-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-60 animate-pulse ${
                              isFieldSolvedFem ? "w-full" : "w-2/3"
                            }`}
                          />
                          {!isFieldSolvedFem && (
                            <div
                              className="absolute top-0 bottom-0 right-0 w-1/3 bg-indigo-500 opacity-45 animate-pulse"
                              style={{ animationDelay: "1s" }}
                            />
                          )}
                        </div>
                        <div className="flex justify-between text-[7px] text-blue-400/60 mt-1 font-mono">
                          <span>0.0 (GMIN)</span>
                          <span className="animate-pulse">
                            {isFieldSolvedFem
                              ? "FEM GRAPH RESOLVED: STABLE"
                              : "GRADIENT: ALFA ACTIVE"}
                          </span>
                          <span>1.0 (GMAX)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isCrossPlatformCreated && (
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl font-mono text-[9px] space-y-2 relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-12 h-12 bg-cyan-500/10 rounded-full blur-lg animate-pulse" />
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold uppercase tracking-wide">
                    <Shield className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>Unified Function Compiled</span>
                  </div>
                  <div className="text-[8px] text-white/80 leading-relaxed space-y-1">
                    <div>
                      Orchestrator:{" "}
                      <span className="text-cyan-400 font-bold">
                        cross-platform
                      </span>
                    </div>
                    <div>
                      • Eng: unreal, fivem, alpha-matrix, agent-zero, skyvern,
                      n8n
                    </div>
                    <div>
                      • Router:{" "}
                      <span className="text-emerald-400 font-semibold">
                        Active Inference (AIF)
                      </span>
                    </div>
                    <div>
                      • Scheduler:{" "}
                      <span className="text-blue-400 font-semibold">
                        ALFA (FEM Gradient)
                      </span>
                    </div>
                    <div>
                      • Memory:{" "}
                      <span className="text-purple-400 font-semibold">
                        Zero-Copy Shared Plane
                      </span>
                    </div>
                    <div>
                      • Fault-Tolerance:{" "}
                      <span className="text-teal-400 font-semibold">
                        Stabilization Waves Active
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Compute Mesh Ω Topology */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[10px] font-bold tracking-wider font-mono uppercase text-white/90">
                      Compute Mesh Ω
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-indigo-300 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-500/10">
                    {engines.filter((e) => e.status === "ACTIVE").length} /{" "}
                    {engines.length} nodes
                  </span>
                </div>

                {/* Grid Visualizer of Mesh Ω */}
                <div className="grid grid-cols-3 gap-1 bg-black/40 p-2 rounded-lg border border-white/5 relative overflow-hidden">
                  {engines.map((eng, index) => {
                    const isActive = eng.status === "ACTIVE";
                    const isBound = eng.sharedMemory === "ZERO-COPY";
                    const isRouterAttached = !!eng.isRouterAttached;
                    const isStabilized = !!eng.isStabilized;
                    const isManagerAdded = !!eng.isManagerAdded;

                    let bgBorderClass =
                      "bg-white/5 border border-white/5 text-white/30";
                    if (isActive) {
                      if (isCrossPlatformCreated) {
                        bgBorderClass =
                          "bg-cyan-950/20 border border-cyan-400/50 text-cyan-200 shadow-[0_0_8px_rgba(34,211,238,0.15)] animate-pulse";
                      } else if (isStabilized && isManagerAdded) {
                        bgBorderClass =
                          "bg-teal-950/20 border border-teal-500/40 text-teal-200";
                      } else if (isRouterAttached) {
                        bgBorderClass =
                          "bg-emerald-950/20 border border-emerald-500/40 text-emerald-200";
                      } else if (isBound) {
                        bgBorderClass =
                          "bg-purple-950/20 border border-purple-500/30 text-purple-200";
                      } else {
                        bgBorderClass =
                          "bg-indigo-950/20 border border-indigo-500/30 text-indigo-200";
                      }
                    }

                    return (
                      <div
                        key={index}
                        className={`p-1.5 rounded flex flex-col justify-between h-12 transition-all font-mono text-[8px] relative ${bgBorderClass}`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="truncate max-w-[80%]">
                            {eng.name}
                          </span>
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive
                                ? isCrossPlatformCreated
                                  ? "bg-cyan-400 shadow-[0_0_4px_#22d3ee]"
                                  : isStabilized && isManagerAdded
                                    ? "bg-teal-400"
                                    : isRouterAttached
                                      ? "bg-emerald-400"
                                      : isBound
                                        ? "bg-purple-400"
                                        : "bg-indigo-400"
                                : "bg-white/10"
                            }`}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[6.5px] text-white/40">
                          <span className="truncate">{eng.type}</span>
                          <div className="flex gap-0.5 shrink-0">
                            {isRouterAttached && (
                              <span
                                className="text-emerald-400 font-bold"
                                title="AIF Router Attached"
                              >
                                A
                              </span>
                            )}
                            {isStabilized && (
                              <span
                                className="text-blue-400 font-bold"
                                title="Self-Stabilizing Enabled"
                              >
                                S
                              </span>
                            )}
                            {isManagerAdded && (
                              <span
                                className="text-amber-400 font-bold"
                                title="Registered in Control Plane"
                              >
                                M
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Engine list detailing status */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {engines.map((eng, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 bg-black/20 border border-white/5 rounded-lg flex items-center justify-between font-mono text-[9px]"
                    >
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={
                              eng.status === "ACTIVE"
                                ? "text-white font-medium"
                                : "text-white/40"
                            }
                          >
                            {eng.name}
                          </span>
                          <span className="text-[7px] text-white/40 truncate bg-white/5 px-1 py-0.2 rounded border border-white/5">
                            {eng.type}
                          </span>
                        </div>
                        <span className="text-[7px] text-white/30 truncate mt-0.5">
                          {eng.addr}
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1">
                          {eng.isRouterAttached && (
                            <span
                              className="text-[7px] px-1 bg-emerald-950/40 text-emerald-400 font-bold border border-emerald-500/20 rounded"
                              title="AIF Router Attached"
                            >
                              AIF
                            </span>
                          )}
                          {eng.isStabilized && (
                            <span
                              className="text-[7px] px-1 bg-blue-950/40 text-blue-400 font-bold border border-blue-500/20 rounded"
                              title="Self-Stabilizing Enabled"
                            >
                              STB
                            </span>
                          )}
                          {eng.isManagerAdded && (
                            <span
                              className="text-[7px] px-1 bg-amber-950/40 text-amber-400 font-bold border border-amber-500/20 rounded"
                              title="Agent Manager Control Plane"
                            >
                              MGR
                            </span>
                          )}
                          <span
                            className={`text-[8px] px-1 rounded font-bold ${
                              eng.status === "ACTIVE"
                                ? "text-green-400"
                                : "text-white/20"
                            }`}
                          >
                            {eng.status}
                          </span>
                        </div>
                        <span
                          className={`text-[7px] px-1.5 py-0.2 rounded font-semibold border ${
                            eng.sharedMemory === "ZERO-COPY"
                              ? "bg-purple-950/20 text-purple-400 border-purple-500/20"
                              : "bg-white/5 text-white/30 border-white/5"
                          }`}
                        >
                          {eng.sharedMemory}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fast Register, Bind, Route, Solve Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-white/5">
                  <button
                    onClick={handleRegisterAllEngines}
                    disabled={engines.every((e) => e.status === "ACTIVE")}
                    className="py-1 px-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-lg text-white font-mono text-[9px] font-bold text-center border border-indigo-500/30 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Register Mesh
                  </button>
                  <button
                    onClick={handleBindAllEngines}
                    disabled={
                      engines.some((e) => e.status === "INACTIVE") ||
                      engines.every((e) => e.sharedMemory === "ZERO-COPY")
                    }
                    className="py-1 px-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-lg text-white font-mono text-[9px] font-bold text-center border border-purple-500/30 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Bind Zero-Copy
                  </button>
                  <button
                    onClick={handleAttachAllRouter}
                    disabled={
                      engines.some((e) => e.status === "INACTIVE") ||
                      engines.every((e) => e.isRouterAttached)
                    }
                    className="py-1 px-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-lg text-white font-mono text-[9px] font-bold text-center border border-emerald-500/30 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Attach AIF Router
                  </button>
                  <button
                    onClick={handleSolveFem}
                    disabled={
                      engines.some((e) => !e.isRouterAttached) ||
                      isFieldSolvedFem
                    }
                    className="py-1 px-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-lg text-white font-mono text-[9px] font-bold text-center border border-blue-500/30 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    FEM Potential Solve
                  </button>
                  <button
                    onClick={handleStabilizeAll}
                    disabled={
                      engines.some((e) => e.status === "INACTIVE") ||
                      engines.every((e) => e.isStabilized)
                    }
                    className="py-1 px-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-lg text-white font-mono text-[9px] font-bold text-center border border-blue-600/30 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Attach Stabilizer
                  </button>
                  <button
                    onClick={handleManagerAddAll}
                    disabled={
                      engines.some((e) => e.status === "INACTIVE") ||
                      engines.every((e) => e.isManagerAdded)
                    }
                    className="py-1 px-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-lg text-white font-mono text-[9px] font-bold text-center border border-amber-500/30 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Add to Manager
                  </button>
                  <button
                    onClick={handleCreateCrossPlatform}
                    disabled={
                      engines.some(
                        (e) => !e.isManagerAdded || !e.isStabilized,
                      ) || isCrossPlatformCreated
                    }
                    className="py-1 px-2 col-span-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-lg text-white font-mono text-[9px] font-bold text-center border border-cyan-500/30 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Compile Unified Function
                  </button>
                </div>
              </div>

              {/* Linked Skills List */}
              <div>
                <h3 className="text-[10px] font-bold text-white/40 tracking-widest uppercase font-mono mb-2">
                  Linked Agent Skills
                </h3>
                {linkedSkills.length === 0 ? (
                  <div className="p-3 border border-dashed border-white/10 rounded-xl text-center text-white/30 font-mono text-[9px]">
                    No skills linked yet.
                    <br />
                    Run presets or type 'agy skills link' to bind rules.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {linkedSkills.map((skill, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-purple-950/10 border border-purple-500/20 rounded-lg font-mono text-[9px] text-purple-300"
                      >
                        <div className="font-bold truncate">{skill}</div>
                        <div className="text-[8px] text-purple-300/60 mt-1 space-y-0.5">
                          {skill === "adk-memory-bank-initializer" && (
                            <>
                              <div>• mmap-backed AST parsing</div>
                              <div>• CRDT-backed write consistency</div>
                            </>
                          )}
                          {skill === "gcp-agent-model-armor-shield" && (
                            <>
                              <div>• zero-copy shared memory access</div>
                              <div>• secure workspace bounds</div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-[10px] font-bold text-white/40 tracking-widest uppercase font-mono mb-2">
                  Command Presets
                </h3>
                <div className="flex flex-col gap-2">
                  {PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => executeTerminalCommand(preset.cmd)}
                      className="w-full text-left p-2.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 hover:border-white/10 transition-all font-mono text-[10px] text-white/80 flex items-center justify-between group"
                    >
                      <span className="truncate">{preset.label}</span>
                      <ArrowRight className="w-3 h-3 text-white/20 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-auto p-3.5 bg-blue-950/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <TerminalIcon className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-bold tracking-wider font-mono uppercase text-blue-300">
                    Terminal System
                  </span>
                </div>
                <p className="text-[10px] text-blue-300/60 font-mono leading-relaxed">
                  Interactive interface mapped directly to workspace. Terminal
                  engine operates locally in non-interactive sandbox mode to
                  execute safe lints, builds, and diagnostic test scripts.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sub-tab 2: CodexMemory AST */}
        {activeSubTab === "codex" && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#030303]">
            {/* AST Node File List Sidebar */}
            <div className="w-full md:w-80 border-r border-white/5 flex flex-col bg-[#070707] h-full">
              <div className="p-3 border-b border-white/5 flex items-center gap-2">
                <Search className="w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Filter memory index files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-xs font-mono text-white placeholder:text-white/25"
                />
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
                {Object.keys(INITIAL_AST_NODES)
                  .filter((name) =>
                    name.toLowerCase().includes(searchQuery.toLowerCase()),
                  )
                  .map((name) => {
                    const node = INITIAL_AST_NODES[name];
                    return (
                      <button
                        key={name}
                        onClick={() => setSelectedFile(name)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                          selectedFile === name
                            ? "bg-purple-500/15 border-purple-500/40 text-purple-200"
                            : "bg-white/5 border-transparent text-white/50 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FileCode
                            className={`w-4 h-4 ${selectedFile === name ? "text-purple-400" : "text-white/30"}`}
                          />
                          <div className="truncate text-left">
                            <div className="text-xs font-bold font-mono tracking-tight text-white/90 truncate">
                              {node.name}
                            </div>
                            <div className="text-[9px] text-white/40 font-mono truncate">
                              {node.type}
                            </div>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-white/30 shrink-0">
                          {node.lines} L
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* AST Analysis View Area */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
              {/* Analysis Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-bold font-mono tracking-wide text-purple-300">
                    AST ANALYZER & DEPENDENCY MAP
                  </h3>
                  <p className="text-xs text-white/40 font-mono mt-0.5">
                    Abstract Syntax Tree memory extracted by CodexMemory.read
                  </p>
                </div>
                <div className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-mono rounded font-bold uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  AST PARSING ACTIVE
                </div>
              </div>

              {/* AST Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                  <span className="text-[10px] text-white/40 font-mono tracking-widest uppercase">
                    Target File
                  </span>
                  <p className="text-sm font-bold text-white font-mono mt-1">
                    {INITIAL_AST_NODES[selectedFile].name}
                  </p>
                </div>
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                  <span className="text-[10px] text-white/40 font-mono tracking-widest uppercase">
                    Total Lines
                  </span>
                  <p className="text-sm font-bold text-white font-mono mt-1">
                    {INITIAL_AST_NODES[selectedFile].lines} LOC
                  </p>
                </div>
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                  <span className="text-[10px] text-white/40 font-mono tracking-widest uppercase">
                    Module imports
                  </span>
                  <p className="text-sm font-bold text-white font-mono mt-1">
                    {INITIAL_AST_NODES[selectedFile].imports.length} References
                  </p>
                </div>
              </div>

              {/* Functional Tree Map */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Imports List */}
                <div className="p-5 bg-[#080808] border border-white/5 rounded-2xl flex flex-col">
                  <h4 className="text-[11px] font-bold tracking-widest font-mono uppercase text-white/50 mb-3 flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-blue-400" />
                    Import Mappings
                  </h4>
                  <div className="space-y-2">
                    {INITIAL_AST_NODES[selectedFile].imports.map((imp, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-white/5 border border-white/5 rounded-lg text-xs font-mono"
                      >
                        <CornerDownRight className="w-3.5 h-3.5 text-white/30" />
                        <span className="text-white/80">{imp}</span>
                        <span className="ml-auto text-[9px] text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-1 rounded">
                          RESOLVED
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Functions List */}
                <div className="p-5 bg-[#080808] border border-white/5 rounded-2xl flex flex-col">
                  <h4 className="text-[11px] font-bold tracking-widest font-mono uppercase text-white/50 mb-3 flex items-center gap-2">
                    <Code className="w-3.5 h-3.5 text-purple-400" />
                    Function Declarations
                  </h4>
                  <div className="space-y-2">
                    {INITIAL_AST_NODES[selectedFile].functions.map(
                      (func, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 bg-white/5 border border-white/5 rounded-lg text-xs font-mono"
                        >
                          <span className="text-purple-400 font-bold">fn</span>
                          <span className="text-white/80">{func}()</span>
                          <span className="ml-auto text-[9px] text-purple-400 font-mono">
                            export
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sub-tab 3: Agent Zero Execution */}
        {activeSubTab === "agentzero" && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#030303]">
            {/* Play controls */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-bold font-mono tracking-wide text-amber-300">
                  AGENT ZERO CODING ENGINE
                </h3>
                <p className="text-xs text-white/40 font-mono mt-0.5">
                  Sandbox-safe local code generation, refactoring, and linting
                </p>
              </div>

              {/* Task Configuration Card */}
              <div className="p-5 bg-[#080808] border border-white/5 rounded-2xl flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-white/40 tracking-widest uppercase font-mono">
                    Refactoring Task Goal
                  </label>
                  <textarea
                    rows={2}
                    value={taskGoal}
                    onChange={(e) => setTaskGoal(e.target.value)}
                    disabled={isTaskRunning}
                    placeholder="Enter precise refactoring instructions..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono outline-none focus:border-amber-500/50 resize-none leading-relaxed transition-all disabled:opacity-50"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-white/30 font-mono flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span>
                      Always compiles and lints within container before writing.
                    </span>
                  </div>
                  <button
                    onClick={runAgentZeroTask}
                    disabled={isTaskRunning || !taskGoal.trim()}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-white/10 text-white disabled:text-white/30 rounded-xl font-bold tracking-widest text-xs font-mono shadow-lg transition-all flex items-center gap-2 shrink-0"
                  >
                    {isTaskRunning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        RUNNING...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        EXECUTE TASK
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Execution Progress Loop Tracker */}
              <div className="p-5 bg-[#080808] border border-white/5 rounded-2xl flex flex-col gap-4">
                <h4 className="text-[11px] font-bold tracking-widest font-mono uppercase text-white/50 flex items-center gap-2">
                  <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                  Agent Zero Logic Progress
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {taskSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border font-mono flex flex-col gap-1 text-left transition-all ${
                        step.status === "completed"
                          ? "bg-green-500/10 border-green-500/30 text-green-400"
                          : step.status === "running"
                            ? "bg-amber-500/15 border-amber-500/40 text-amber-300 animate-pulse"
                            : "bg-white/5 border-transparent text-white/30"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight">
                        {step.status === "completed" ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : step.status === "running" ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-current" />
                        )}
                        <span>{step.name}</span>
                      </div>
                      <span className="text-[9px] opacity-75">
                        {step.details}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Output Stream Panel */}
            <div className="w-full md:w-80 border-l border-white/5 bg-[#060606] p-4 flex flex-col h-full">
              <h4 className="text-[10px] font-bold tracking-widest font-mono uppercase text-white/30 mb-2 flex items-center gap-1.5">
                <TerminalIcon className="w-3.5 h-3.5" />
                Task Run Log Output
              </h4>
              <div className="flex-1 bg-[#030303] border border-white/5 rounded-xl p-3 font-mono text-[10px] text-amber-400/80 leading-relaxed overflow-y-auto space-y-1">
                {taskOutput.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-white/20 text-[10px]">
                    No active task logs. Run task to view output stream.
                  </div>
                ) : (
                  taskOutput.map((out, idx) => (
                    <div
                      key={idx}
                      className={
                        out.startsWith("✔") ? "text-green-400 font-bold" : ""
                      }
                    >
                      {out}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sub-tab 4: 351-Node Neuro-Consensus Mesh Telemetry */}
        {activeSubTab === "mesh" && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#030303] h-full">
            {/* Left Column: 351-Node Grid & Interactive Filters */}
            <div className="flex-1 flex flex-col border-r border-white/5 h-full bg-[#050505] overflow-hidden min-w-0">
              {/* Header inside sub-tab */}
              <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold font-mono tracking-wider text-emerald-400 uppercase flex items-center gap-1.5">
                    <Activity className="w-4 h-4 animate-pulse" />
                    351-Node Neuro-Consensus Mesh
                  </h3>
                  <p className="text-[10px] text-white/40 font-mono mt-0.5">
                    Dynamic telemetry status per cognitive subsystem boundary
                  </p>
                </div>

                {/* Subsystem Quick Legend Filters */}
                <div className="flex flex-wrap gap-1">
                  {[
                    "all",
                    "core",
                    "orchestration",
                    "reasoning",
                    "memory",
                    "execution",
                    "telemetry",
                    "security",
                  ].map((f) => (
                    <button
                      key={f}
                      onClick={() => setSelectedSubsystemFilter(f)}
                      className={`px-2 py-0.5 rounded text-[8px] font-mono border transition-all cursor-pointer uppercase font-bold ${
                        selectedSubsystemFilter === f
                          ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300"
                          : "bg-white/5 border-transparent text-white/40 hover:text-white/70"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid representation of 351 nodes */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between">
                <div>
                  <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-10 xl:grid-cols-12 gap-1.5 p-3.5 bg-black/40 rounded-2xl border border-white/5 max-h-[350px] overflow-y-auto">
                    {storeNodes
                      .filter(
                        (node) =>
                          selectedSubsystemFilter === "all" ||
                          node.subsystem === selectedSubsystemFilter,
                      )
                      .map((node) => {
                        const isSelected = selectedNodeId === node.id;
                        const isError = node.status === NodeStatus.ERROR;

                        // Color coding based on subsystem
                        let dotColor = "bg-white/20";
                        let borderGlow = "border-transparent";

                        if (isError) {
                          dotColor = "bg-red-500 animate-ping";
                          borderGlow =
                            "border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
                        } else {
                          switch (node.subsystem) {
                            case "core":
                              dotColor = "bg-purple-500";
                              borderGlow = isMeshOptimized
                                ? "border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                                : "border-purple-500/20";
                              break;
                            case "orchestration":
                              dotColor = "bg-indigo-500";
                              borderGlow = isMeshOptimized
                                ? "border-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                                : "border-indigo-500/20";
                              break;
                            case "reasoning":
                              dotColor = isMeshOptimized
                                ? "bg-rose-400 animate-pulse"
                                : "bg-rose-500/70";
                              borderGlow = isMeshOptimized
                                ? "border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                                : "border-rose-500/20";
                              break;
                            case "memory":
                              dotColor = isMeshOptimized
                                ? "bg-amber-400"
                                : "bg-amber-500/60";
                              borderGlow = isMeshOptimized
                                ? "border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                                : "border-amber-500/20";
                              break;
                            case "execution":
                              dotColor = isMeshOptimized
                                ? "bg-blue-400"
                                : "bg-blue-500/60";
                              borderGlow = isMeshOptimized
                                ? "border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                                : "border-blue-500/20";
                              break;
                            case "telemetry":
                              dotColor = "bg-cyan-500/60";
                              borderGlow = "border-cyan-500/20";
                              break;
                            case "security":
                              dotColor = "bg-emerald-500/80";
                              borderGlow = isMeshOptimized
                                ? "border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                : "border-emerald-500/20";
                              break;
                          }
                        }

                        return (
                          <button
                            key={node.id}
                            onClick={() => setSelectedNodeId(node.id)}
                            className={`p-1 rounded-lg border transition-all hover:bg-white/5 flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[44px] ${
                              isSelected
                                ? "bg-white/10 border-white/30 text-white shadow-[0_0_12px_rgba(255,255,255,0.15)]"
                                : "bg-transparent border-transparent text-white/40"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${dotColor} ${borderGlow}`}
                            />
                            <span className="text-[7px] font-mono font-bold">
                              {node.id}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Simulated Topology Constellation Vector Art */}
                <div className="h-44 border border-white/5 bg-[#070707] rounded-2xl relative overflow-hidden flex items-center justify-center mt-3 p-4">
                  {/* Grid overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06),transparent_70%)]" />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px]" />

                  {/* Constellation nodes & paths */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    <svg
                      className="absolute inset-0 w-full h-full"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Connections vector */}
                      {isMeshOptimized ? (
                        <>
                          {/* Beautiful structured star connections */}
                          <line
                            x1="50%"
                            y1="50%"
                            x2="50%"
                            y2="20%"
                            stroke="rgba(168,85,247,0.4)"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                            className="animate-pulse"
                          />
                          <line
                            x1="50%"
                            y1="50%"
                            x2="25%"
                            y2="40%"
                            stroke="rgba(244,63,94,0.4)"
                            strokeWidth="1.5"
                          />
                          <line
                            x1="50%"
                            y1="50%"
                            x2="75%"
                            y2="40%"
                            stroke="rgba(245,158,11,0.4)"
                            strokeWidth="1.5"
                          />
                          <line
                            x1="50%"
                            y1="50%"
                            x2="35%"
                            y2="75%"
                            stroke="rgba(59,130,246,0.4)"
                            strokeWidth="1.5"
                          />
                          <line
                            x1="50%"
                            y1="50%"
                            x2="65%"
                            y2="75%"
                            stroke="rgba(16,185,129,0.4)"
                            strokeWidth="1.5"
                          />

                          {/* Outer rings */}
                          <circle
                            cx="50%"
                            cy="50%"
                            r="45"
                            fill="none"
                            stroke="rgba(16,185,129,0.15)"
                            strokeWidth="1"
                            strokeDasharray="3 3"
                          />
                          <circle
                            cx="50%"
                            cy="50%"
                            r="85"
                            fill="none"
                            stroke="rgba(16,185,129,0.08)"
                            strokeWidth="1"
                          />
                        </>
                      ) : (
                        <>
                          {/* Chaotic unoptimized links */}
                          <path
                            d="M 50% 50% L 30% 25% L 75% 30% L 20% 70% L 60% 80% Z"
                            fill="none"
                            stroke="rgba(239,68,68,0.25)"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />
                          <line
                            x1="50%"
                            y1="50%"
                            x2="80%"
                            y2="80%"
                            stroke="rgba(245,158,11,0.3)"
                            strokeWidth="1"
                          />
                          <line
                            x1="15%"
                            y1="35%"
                            x2="60%"
                            y2="75%"
                            stroke="rgba(239,68,68,0.2)"
                            strokeWidth="1"
                          />
                          <line
                            x1="75%"
                            y1="20%"
                            x2="30%"
                            y2="80%"
                            stroke="rgba(59,130,246,0.25)"
                            strokeWidth="1"
                          />
                        </>
                      )}
                    </svg>

                    {/* Core cluster centers */}
                    <div className="absolute z-10 flex flex-col items-center">
                      <div
                        className={`p-2.5 rounded-full border transition-all ${
                          isMeshOptimized
                            ? "bg-purple-950/40 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                            : "bg-black/60 border-purple-500/20"
                        }`}
                      >
                        <Cpu className="w-5 h-5 text-purple-400 animate-pulse" />
                      </div>
                      <span className="text-[7px] font-mono text-purple-400 font-bold mt-1 uppercase tracking-wide">
                        CN-001 (Lucy Core)
                      </span>
                    </div>

                    {/* Spanning branches */}
                    <div className="absolute left-[20%] top-[30%] flex flex-col items-center">
                      <div
                        className={`p-1.5 rounded-full border transition-all ${
                          isMeshOptimized
                            ? "bg-rose-950/40 border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.4)]"
                            : "bg-black/40 border-rose-500/20"
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5 text-rose-400" />
                      </div>
                      <span className="text-[6px] font-mono text-rose-400/80 mt-0.5">
                        Reasoning Grid
                      </span>
                    </div>

                    <div className="absolute right-[20%] top-[30%] flex flex-col items-center">
                      <div
                        className={`p-1.5 rounded-full border transition-all ${
                          isMeshOptimized
                            ? "bg-amber-950/40 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                            : "bg-black/40 border-amber-500/20"
                        }`}
                      >
                        <Database className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <span className="text-[6px] font-mono text-amber-400/80 mt-0.5">
                        Memory Bank
                      </span>
                    </div>

                    <div className="absolute left-[30%] bottom-[15%] flex flex-col items-center">
                      <div
                        className={`p-1.5 rounded-full border transition-all ${
                          isMeshOptimized
                            ? "bg-blue-950/40 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.4)]"
                            : "bg-black/40 border-blue-500/20"
                        }`}
                      >
                        <Code className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <span className="text-[6px] font-mono text-blue-400/80 mt-0.5">
                        Execution Core
                      </span>
                    </div>

                    <div className="absolute right-[30%] bottom-[15%] flex flex-col items-center">
                      <div
                        className={`p-1.5 rounded-full border transition-all ${
                          isMeshOptimized
                            ? "bg-emerald-950/40 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                            : "bg-black/40 border-emerald-500/20"
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="text-[6px] font-mono text-emerald-400/80 mt-0.5">
                        Security Guard
                      </span>
                    </div>

                    {/* Scanning glow bar */}
                    {meshReshapingState === "reshaping" && (
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce opacity-80" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Simulated OS Telemetry meters & Node details */}
            <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-white/5 bg-[#060606] flex flex-col h-full overflow-y-auto">
              {/* Consensus & Threshold Math Engine */}
              <div className="p-5 border-b border-white/5 bg-black/40">
                <h3 className="text-[10px] font-bold tracking-widest font-mono uppercase text-white/40 mb-3 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Consensus Math Engine
                </h3>

                <div className="bg-black/50 p-4 rounded-2xl border border-white/5 font-mono text-[9px] space-y-2.5 text-white/80">
                  <div className="flex justify-between items-center">
                    <span className="text-white/40">Total Nodes (N):</span>
                    <span className="font-bold text-white text-[10px]">
                      351 Active Cryptographic
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40">
                      Max Byzantine Faults (f):
                    </span>
                    <span className="font-bold text-amber-500 text-[10px]">
                      116 Nodes
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/5 pt-2">
                    <span className="text-white/40">Quorum Certificate:</span>
                    <span className="font-bold text-emerald-400 text-[10px]">
                      233 Signatures
                    </span>
                  </div>
                  <div className="text-[7.5px] text-white/30 leading-normal italic pt-1 border-t border-white/5">
                    Requires a supermajority of matching signatures to commit
                    epoch checkpoints.
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-1.5 rounded-lg border border-white/5">
                    <span className="text-[7px] text-purple-400 font-bold uppercase tracking-wider">
                      EMMA Kernel Gov:
                    </span>
                    <span className="text-[7px] text-white/60 font-semibold uppercase">
                      Active Auto-Promote
                    </span>
                  </div>
                </div>
              </div>

              {/* Hardware OS Telemetry Analytics */}
              <div className="p-5 border-b border-white/5 bg-black/20">
                <h3 className="text-[10px] font-bold tracking-widest font-mono uppercase text-white/40 mb-3 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Live Host OS Telemetry
                </h3>

                <div className="space-y-3.5">
                  {/* CPU Loading */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-white/60">
                        CPU CLUSTER LOADING:
                      </span>
                      <span
                        className={
                          isMeshOptimized
                            ? "text-green-400 font-bold"
                            : "text-amber-400 font-bold"
                        }
                      >
                        {telemetryTickingMetrics.cpu.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full transition-all duration-1000 ${isMeshOptimized ? "bg-green-500" : "bg-amber-500"}`}
                        style={{ width: `${telemetryTickingMetrics.cpu}%` }}
                      />
                    </div>
                  </div>

                  {/* Memory Footprint */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-white/60">
                        REDUNDANT SHM BOUNDARY:
                      </span>
                      <span
                        className={
                          isMeshOptimized
                            ? "text-green-400 font-bold"
                            : "text-amber-400 font-bold"
                        }
                      >
                        {telemetryTickingMetrics.mem.toFixed(2)} GB
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full transition-all duration-1000 ${isMeshOptimized ? "bg-green-500" : "bg-amber-500"}`}
                        style={{
                          width: `${(telemetryTickingMetrics.mem / 12) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Network Latency */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-white/60">
                        AVERAGE SYNAPSE LATENCY:
                      </span>
                      <span
                        className={
                          isMeshOptimized
                            ? "text-green-400 font-bold"
                            : "text-amber-400 font-bold"
                        }
                      >
                        {telemetryTickingMetrics.netLatency.toFixed(1)} ms
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full transition-all duration-1000 ${isMeshOptimized ? "bg-green-400" : "bg-red-500 animate-pulse"}`}
                        style={{
                          width: `${Math.min(100, (telemetryTickingMetrics.netLatency / 60) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Reasoning Efficiency */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-white/60">
                        REASONING ACCELERATOR EFFICIENCY:
                      </span>
                      <span
                        className={
                          isMeshOptimized
                            ? "text-green-400 font-bold animate-pulse"
                            : "text-amber-500 font-bold"
                        }
                      >
                        {telemetryTickingMetrics.reasoningEfficiency.toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full transition-all duration-1000 ${isMeshOptimized ? "bg-emerald-500" : "bg-amber-500"}`}
                        style={{
                          width: `${telemetryTickingMetrics.reasoningEfficiency}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Expected Free Energy Minimizer */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-white/60">
                        EXPECTED FREE ENERGY (EFE) VARIANCE:
                      </span>
                      <span
                        className={
                          isMeshOptimized
                            ? "text-green-400 font-bold"
                            : "text-red-400 font-bold"
                        }
                      >
                        {telemetryTickingMetrics.efeMinimization.toFixed(3)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full transition-all duration-1000 ${isMeshOptimized ? "bg-green-500" : "bg-red-500"}`}
                        style={{
                          width: `${telemetryTickingMetrics.efeMinimization * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Simulated Optimization Controls */}
                <div className="mt-5 pt-4 border-t border-white/5 flex flex-col gap-2">
                  <button
                    onClick={runMeshAnalysis}
                    disabled={meshReshapingState !== "idle"}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-xl text-white font-mono text-[10px] font-bold text-center border border-indigo-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    SIMULATE TOPOLOGY ANALYSIS
                  </button>
                  <button
                    onClick={runMeshReshaping}
                    disabled={meshReshapingState !== "idle" || isMeshOptimized}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-white/5 disabled:border-transparent disabled:text-white/30 disabled:cursor-not-allowed transition-all rounded-xl text-white font-mono text-[10px] font-bold text-center border border-emerald-500/30 flex items-center justify-center gap-1.5 cursor-pointer relative overflow-hidden"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${meshReshapingState === "reshaping" ? "animate-spin" : ""}`}
                    />
                    {isMeshOptimized
                      ? "TOPOLOGY SHAPED (NOMINAL)"
                      : "RESHAPE NODE MESH"}
                  </button>
                  <button
                    onClick={runTriggerChaos}
                    disabled={meshReshapingState === "reshaping"}
                    className="w-full py-2 bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 border border-orange-500/20 hover:border-orange-500/40 transition-all rounded-xl font-mono text-[10px] font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    TRIGGER NODE FAULT (CHAOS)
                  </button>
                </div>
              </div>

              {/* Node Properties Inspector (selected node) */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest font-mono uppercase text-white/30 mb-2 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5" />
                    Node Properties Inspector
                  </h4>

                  {selectedNodeId ? (
                    (() => {
                      const selectedNode = storeNodes.find(
                        (n) => n.id === selectedNodeId,
                      );
                      if (!selectedNode)
                        return (
                          <div className="text-white/20 text-[9px] font-mono">
                            No node found.
                          </div>
                        );

                      return (
                        <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 font-mono text-[9px] space-y-2.5">
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="font-bold text-white text-[11px]">
                              {selectedNode.id}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                                selectedNode.status === NodeStatus.ERROR
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-emerald-500/20 text-emerald-400"
                              }`}
                            >
                              {selectedNode.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-white/70">
                            <div>
                              <span className="text-white/40 block">
                                SUBSYSTEM:
                              </span>
                              <span className="font-semibold text-white capitalize">
                                {selectedNode.subsystem}
                              </span>
                            </div>
                            <div>
                              <span className="text-white/40 block">
                                AUTONOMY INDEX:
                              </span>
                              <span className="font-semibold text-white">
                                {selectedNode.autonomyLevel?.toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-white/40 block">
                                WEIGHT FACTOR:
                              </span>
                              <span className="font-semibold text-white">
                                {selectedNode.weight?.toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-white/40 block">
                                NODE ENERGY:
                              </span>
                              <span className="font-semibold text-white">
                                {(selectedNode.energy || 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-white/5">
                            <span className="text-white/40 block mb-1">
                              ACTIVE SYNAPSES:
                            </span>
                            <div className="space-y-1">
                              {selectedNode.synapses.map((syn, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between bg-white/5 p-1 px-1.5 rounded text-[8px]"
                                >
                                  <span>
                                    ➔ {syn.to} ({syn.signalType})
                                  </span>
                                  <span
                                    className={
                                      isMeshOptimized
                                        ? "text-emerald-400 font-bold"
                                        : "text-amber-400 font-bold"
                                    }
                                  >
                                    {isMeshOptimized
                                      ? "1.2 ms"
                                      : `${syn.latency} ms`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-white/20 text-[9px] font-mono text-center py-6 bg-black/20 rounded-xl border border-dashed border-white/5">
                      Select a node from the grid to inspect properties.
                    </div>
                  )}
                </div>

                {/* Diagnostic operation log output */}
                <div className="mt-4 bg-black border border-white/5 rounded-xl p-3 h-32 flex flex-col font-mono text-[8px]">
                  <span className="text-white/30 text-[7px] uppercase font-bold tracking-wider border-b border-white/5 pb-1 mb-1.5 block">
                    Topology Operation Logs
                  </span>
                  <div className="flex-1 overflow-y-auto space-y-1 text-emerald-400/80 leading-relaxed pr-1">
                    {meshLog.map((log, idx) => (
                      <div
                        key={idx}
                        className={
                          log.includes("⚠️")
                            ? "text-amber-400"
                            : log.includes("✔")
                              ? "text-green-400 font-bold"
                              : ""
                        }
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sub-tab 5: Supervision & Security */}
        {activeSubTab === "supervision" && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#030303] p-6 gap-6">
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Supervision Tree Panel */}
              <div className="bg-[#0a0a0a] rounded-xl border border-white/10 p-4 font-mono">
                <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Supervision Tree
                </h3>
                <div className="text-[10px] text-white/70 space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/5">
                    <span>Process ID</span>
                    <span>Status</span>
                    <span>Restarts</span>
                    <span>Uptime</span>
                  </div>
                  {Array.from(
                    SystemStateManager.getInstance().supervision[
                      "processes"
                    ].values(),
                  ).map((p: any) => (
                    <div
                      key={p.pid}
                      className="flex items-center justify-between p-2 bg-black/40 rounded border border-white/5"
                    >
                      <span className="text-cyan-300 font-bold">
                        {p.name} ({p.pid})
                      </span>
                      <span
                        className={
                          p.status === "running"
                            ? "text-green-400"
                            : p.status === "restarting"
                              ? "text-amber-400"
                              : "text-red-400"
                        }
                      >
                        {p.status.toUpperCase()}
                      </span>
                      <span>{p.restarts} / 5</span>
                      <span>{p.uptime}s</span>
                    </div>
                  ))}
                  {SystemStateManager.getInstance().supervision["processes"]
                    .size === 0 && (
                    <div className="p-4 text-center text-white/30 border border-dashed border-white/10 rounded">
                      No active supervised processes.
                    </div>
                  )}
                </div>
              </div>

              {/* Resource Manager Panel */}
              <div className="bg-[#0a0a0a] rounded-xl border border-white/10 p-4 font-mono">
                <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Resource Allocation
                </h3>
                <div className="text-[10px] text-white/70 space-y-2">
                  <div className="p-3 bg-black/40 rounded border border-white/5 flex items-center justify-between">
                    <span>System Load</span>
                    <span className="text-amber-400 font-bold">
                      {SystemStateManager.getInstance()
                        .resources.getSystemLoad()
                        .toFixed(1)}
                      %
                    </span>
                  </div>
                  {Array.from(
                    SystemStateManager.getInstance().resources[
                      "currentAllocations"
                    ].values(),
                  ).map((r: any) => (
                    <div
                      key={r.processId}
                      className="flex flex-col gap-2 p-3 bg-black/40 rounded border border-white/5"
                    >
                      <div className="flex justify-between">
                        <span className="text-amber-300 font-bold">
                          {r.processId}
                        </span>
                        {r.throttled && (
                          <span className="text-red-400 font-bold">
                            THROTTLED
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>GPU: {r.currentUsage.gpuMemoryMb} MB</div>
                        <div>CPU: {r.currentUsage.cpuPercentage}%</div>
                        <div>
                          NET:{" "}
                          {(r.currentUsage.networkBandwidthKbps / 1000).toFixed(
                            1,
                          )}{" "}
                          Mbps
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plugin Architecture Panel */}
              <div className="bg-[#0a0a0a] rounded-xl border border-white/10 p-4 font-mono">
                <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Loaded Plugins
                </h3>
                <div className="text-[10px] text-white/70 space-y-2">
                  {SystemStateManager.getInstance()
                    .plugins.getInstalledPlugins()
                    .map((p: any) => (
                      <div
                        key={p.id}
                        className="p-3 bg-black/40 rounded border border-white/5 flex flex-col gap-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-300 font-bold">
                            {p.name} v{p.version}
                          </span>
                          <span className="text-white/30">{p.id}</span>
                        </div>
                        <div className="text-[9px] text-white/40">
                          {p.description}
                        </div>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {p.capabilities.map((c: any, i: number) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 text-[8px]"
                            >
                              {c.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  {SystemStateManager.getInstance().plugins.getInstalledPlugins()
                    .length === 0 && (
                    <div className="p-4 text-center text-white/30 border border-dashed border-white/10 rounded">
                      No external plugins loaded.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Security Audit Panel */}
              <div className="bg-[#0a0a0a] rounded-xl border border-white/10 p-4 font-mono h-full">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                  <h3 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    Immutable Audit Trail
                  </h3>
                  <div className="flex gap-2 text-[10px]">
                    <button
                      onClick={() => {
                        const logs = SystemStateManager.getInstance().security["auditLogs"];
                        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `lucy_audit_report_${Date.now()}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white/80 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      Export JSON
                    </button>
                    <button
                      onClick={() => {
                        const logs = SystemStateManager.getInstance().security["auditLogs"];
                        const html = `
                          <html>
                            <head>
                              <title>Lucy AGI-OS Secure Audit Report</title>
                              <style>
                                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 40px; background-color: #ffffff; color: #111111; line-height: 1.6; }
                                .header { border-bottom: 2px solid #581c87; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                                .title { font-size: 24px; font-weight: bold; color: #581c87; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
                                .meta { font-size: 11px; color: #666666; font-family: monospace; text-align: right; }
                                .log-entry { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: #fafafa; page-break-inside: avoid; }
                                .log-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; color: #374151; margin-bottom: 8px; }
                                .status-success { color: #059669; }
                                .status-denied { color: #dc2626; }
                                .log-detail { font-size: 12px; margin: 4px 0; color: #4b5563; }
                                .log-hash { font-family: monospace; font-size: 10px; color: #9ca3af; word-break: break-all; margin-top: 8px; border-top: 1px dashed #e5e7eb; padding-top: 4px; }
                                .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
                              </style>
                            </head>
                            <body>
                              <div class="header">
                                <div>
                                  <h1 class="title">LUCY AGI-OS</h1>
                                  <div style="font-size: 12px; color: #4b5563; font-weight: 500;">SECURE IMMUTABLE AUDIT REPORT</div>
                                </div>
                                <div class="meta">
                                  Report ID: AUD-${Date.now()}<br>
                                  Timestamp: ${new Date().toLocaleString()}<br>
                                  Ledger Hash: VALID_INTEGRITY_SHIELD
                                </div>
                              </div>
                              <div>
                                ${logs.map((log: any) => `
                                  <div class="log-entry">
                                    <div class="log-header">
                                      <span class="${log.outcome === 'success' ? 'status-success' : 'status-denied'}">
                                        [${log.outcome.toUpperCase()}] ${log.actor}
                                      </span>
                                      <span style="font-size: 11px; color: #6b7280; font-weight: normal;">
                                        ${new Date(log.timestamp).toLocaleString()}
                                      </span>
                                    </div>
                                    <div class="log-detail"><strong>Action:</strong> ${log.action}</div>
                                    <div class="log-detail"><strong>Resource:</strong> ${log.resource}</div>
                                    <div class="log-hash">Immutable Signature Hash: ${log.hash}</div>
                                  </div>
                                `).join('')}
                                ${logs.length === 0 ? '<div style="text-align: center; color: #6b7280; padding: 40px;">No audit events recorded in active ledger.</div>' : ''}
                              </div>
                              <div class="footer">
                                This report is cryptographically sealed by Lucy Secure Kernel. All entries are immutable.
                              </div>
                              <script>
                                window.onload = function() {
                                  window.print();
                                }
                              </script>
                            </body>
                          </html>
                        `;
                        const blob = new Blob([html], { type: "text/html" });
                        const url = URL.createObjectURL(blob);
                        const win = window.open(url, "_blank");
                        if (!win) {
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `lucy_audit_report_${Date.now()}.html`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }
                      }}
                      className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      Export PDF / Report
                    </button>
                  </div>
                </div>
                <div className="text-[9px] text-white/60 space-y-1 overflow-y-auto max-h-[500px] custom-scrollbar">
                  {SystemStateManager.getInstance().security["auditLogs"].map(
                    (log: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2 bg-black/40 rounded border border-white/5 flex flex-col gap-1"
                      >
                        <div className="flex justify-between">
                          <span className="text-purple-300 font-bold">
                            [{log.outcome.toUpperCase()}] {log.actor}
                          </span>
                          <span className="text-white/40">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div>Action: {log.action}</div>
                        <div>Resource: {log.resource}</div>
                        <div className="text-white/20 break-all text-[8px]">
                          Hash: {log.hash}
                        </div>
                      </div>
                    ),
                  )}
                  {SystemStateManager.getInstance().security["auditLogs"]
                    .length === 0 && (
                    <div className="p-4 text-center text-white/30 border border-dashed border-white/10 rounded">
                      Audit ledger is empty.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
