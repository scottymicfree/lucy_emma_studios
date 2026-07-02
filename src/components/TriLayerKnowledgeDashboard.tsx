import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Database,
  GitBranch,
  Network,
  Search,
  Activity,
  Layers,
  Sparkles,
  Zap,
  Terminal,
} from "lucide-react";
import { SystemStateManager } from "../lib/core/systemStateManager";

export function TriLayerKnowledgeDashboard() {
  const [activeLayer, setActiveLayer] = useState<
    "RAG" | "DAG" | "HYPERGRAPH" | "FUSION"
  >("FUSION");

  // Terminal logs for hypergraph operations
  const [logs, setLogs] = useState<string[]>([
    "[SYSTEM] Tri-Layer Knowledge Evolution Engine: OFFLINE",
    "[SYSTEM] Awaiting manual activation...",
  ]);

  const [isActive, setIsActive] = useState(false);
  const [ragStats, setRagStats] = useState({
    vectors: 0,
    accuracy: 0,
    expanded: 0,
  });
  const [dagStats, setDagStats] = useState({ nodes: 0, edges: 0, branches: 0 });
  const [hyperStats, setHyperStats] = useState({
    concepts: 0,
    hyperedges: 0,
    insights: 0,
  });

  const activateEvolutionEngine = () => {
    setIsActive(true);
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] 🚀 Initiating Tri-Layer Knowledge Evolution Engine...`,
      `[${new Date().toLocaleTimeString()}] 🧠 1. Activating RAG Layer: Retrieval-Augmented Grounding...`,
      `[${new Date().toLocaleTimeString()}] 🔗 2. Activating DAG Layer: Directed Acyclic Reasoning Graph...`,
      `[${new Date().toLocaleTimeString()}] 🌌 3. Activating Hypergraph Layer: Omniversal Knowledge Mesh...`,
      `[${new Date().toLocaleTimeString()}] 🔥 FUSING LAYERS INTO UNIFIED INTELLIGENCE MODE...`,
    ]);

    // Dispatch a dummy execution through the real DAG Engine
    const sysState = SystemStateManager.getInstance();

    // Simulate a problem spec parsed from query
    const spec = {
      ReasoningDAG: {
        nodes: [
          {
            id: "N1",
            type: "decompose",
            inputRefs: [],
            outputRefs: ["N2", "N3", "N4"],
            payload: { mode: "task_decomposition" },
          },
          {
            id: "N2",
            type: "retrieve",
            inputRefs: ["N1"],
            outputRefs: ["N5"],
            payload: {
              retrievalPlan: {
                enabled: true,
                queryTemplate: "Prior reasoning engine designs",
                sources: ["hypergraph"],
                maxItems: 20,
              },
            },
          },
          {
            id: "N3",
            type: "infer",
            inputRefs: ["N1"],
            outputRefs: ["N5"],
            payload: { topic: "core components" },
          },
          {
            id: "N4",
            type: "infer",
            inputRefs: ["N1"],
            outputRefs: ["N5"],
            payload: { topic: "data structures" },
          },
          {
            id: "N5",
            type: "synthesize",
            inputRefs: ["N2", "N3", "N4"],
            outputRefs: [],
            payload: { mode: "architecture_assembly" },
          },
        ],
        edges: [
          { from: "N1", to: "N2", kind: "logical" },
          { from: "N1", to: "N3", kind: "logical" },
          { from: "N1", to: "N4", kind: "logical" },
          { from: "N2", to: "N5", kind: "support" },
          { from: "N3", to: "N5", kind: "support" },
          { from: "N4", to: "N5", kind: "support" },
        ],
        rootNode: "N1",
        goalNode: "N5",
      },
    };

    setTimeout(() => {
      const dag = sysState.dagEngine.parseSpec(spec);

      sysState.fusion
        .runEpisode(
          "Design DAG reasoning engine with fusion orchestration",
          {
            constraints: ["implementable"],
            subgoals: ["define components", "specify execution flow"],
          },
          dag,
          (msg) => setLogs((prev) => [...prev, msg]),
        )
        .then(({ answer, trace }) => {
          setLogs((prev) => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] 🧠 Fusion Episode Completed: Trace ID ${trace.dagId}`,
            `[${new Date().toLocaleTimeString()}] ⚡ Final Synthesis Result: ${JSON.stringify(answer)}`,
          ]);
        });
    }, 1500);

    // Removed mock random growth interval
    // Instead, in a real system we would fetch stats from /api/stats or SystemStateManager
    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ✔ Unified Mode Active. Evolution autonomous cycle started.`,
      ]);
    }, 3000);
  };

  return (
    <div className="h-full w-full bg-[#030303] flex flex-col font-mono text-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a0a0a]">
        <div>
          <h2 className="text-xl font-bold tracking-widest uppercase flex items-center gap-3">
            <Layers className="w-6 h-6 text-emerald-400" />
            Knowledge Superstructure
          </h2>
          <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">
            RAG–DAG–HYPERGRAPH NEXT-EVOLUTION EXPANSION
          </p>
        </div>

        <button
          onClick={activateEvolutionEngine}
          disabled={isActive}
          className={`px-6 py-3 rounded-xl font-bold text-xs tracking-widest uppercase flex items-center gap-2 transition-all ${
            isActive
              ? "bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-400/50"
          }`}
        >
          <Zap className="w-4 h-4" />
          {isActive ? "ENGINE ACTIVE" : "ACTIVATE TRI-LAYER FUSION"}
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Nav for Layers */}
        <div className="w-full md:w-64 border-r border-white/10 bg-[#070707] flex flex-col p-4 gap-2">
          {[
            {
              id: "FUSION",
              label: "Unified Fusion",
              icon: Sparkles,
              color: "text-emerald-400",
              bg: "bg-emerald-400/10",
            },
            {
              id: "RAG",
              label: "RAG Grounding",
              icon: Database,
              color: "text-blue-400",
              bg: "bg-blue-400/10",
            },
            {
              id: "DAG",
              label: "DAG Reasoning",
              icon: GitBranch,
              color: "text-amber-400",
              bg: "bg-amber-400/10",
            },
            {
              id: "HYPERGRAPH",
              label: "Hypergraph Mesh",
              icon: Network,
              color: "text-purple-400",
              bg: "bg-purple-400/10",
            },
          ].map((layer) => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id as any)}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                activeLayer === layer.id
                  ? `border-white/20 bg-white/10 ${layer.color}`
                  : "border-transparent text-white/40 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className={`p-1.5 rounded ${layer.bg}`}>
                <layer.icon className={`w-4 h-4 ${layer.color}`} />
              </div>
              <span className="text-xs font-bold tracking-widest">
                {layer.label}
              </span>
            </button>
          ))}

          <div className="mt-auto p-4 border border-white/10 bg-black/50 rounded-xl">
            <h4 className="text-[10px] text-white/40 mb-2 uppercase tracking-widest">
              Evolution Status
            </h4>
            <div className="flex items-center gap-2">
              <span className={`relative flex h-2 w-2`}>
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isActive ? "bg-emerald-400" : "bg-red-400"}`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? "bg-emerald-500" : "bg-red-500"}`}
                ></span>
              </span>
              <span
                className={`text-xs font-bold ${isActive ? "text-emerald-400" : "text-red-400"}`}
              >
                {isActive ? "EVOLVING" : "DORMANT"}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative p-6 bg-[#030303] gap-6">
          <AnimatePresence mode="wait">
            {activeLayer === "FUSION" && (
              <motion.div
                key="fusion"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Stats Cards */}
                  <div className="p-4 border border-blue-500/20 bg-blue-500/5 rounded-xl flex flex-col gap-2 relative overflow-hidden">
                    <Database className="w-16 h-16 text-blue-500/10 absolute -right-2 -bottom-2" />
                    <h3 className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                      RAG Grounding
                    </h3>
                    <div className="text-2xl font-bold text-white">
                      {ragStats.vectors}{" "}
                      <span className="text-xs text-white/40">vectors</span>
                    </div>
                    <div className="text-[10px] text-blue-400/60 mt-auto">
                      Precision: {ragStats.accuracy.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-4 border border-amber-500/20 bg-amber-500/5 rounded-xl flex flex-col gap-2 relative overflow-hidden">
                    <GitBranch className="w-16 h-16 text-amber-500/10 absolute -right-2 -bottom-2" />
                    <h3 className="text-amber-400 text-[10px] font-bold uppercase tracking-widest">
                      DAG Reasoning
                    </h3>
                    <div className="text-2xl font-bold text-white">
                      {dagStats.nodes}{" "}
                      <span className="text-xs text-white/40">nodes</span>
                    </div>
                    <div className="text-[10px] text-amber-400/60 mt-auto">
                      {dagStats.branches} active branches
                    </div>
                  </div>
                  <div className="p-4 border border-purple-500/20 bg-purple-500/5 rounded-xl flex flex-col gap-2 relative overflow-hidden">
                    <Network className="w-16 h-16 text-purple-500/10 absolute -right-2 -bottom-2" />
                    <h3 className="text-purple-400 text-[10px] font-bold uppercase tracking-widest">
                      Hypergraph Mesh
                    </h3>
                    <div className="text-2xl font-bold text-white">
                      {hyperStats.hyperedges}{" "}
                      <span className="text-xs text-white/40">edges</span>
                    </div>
                    <div className="text-[10px] text-purple-400/60 mt-auto">
                      {hyperStats.insights} emergent insights
                    </div>
                  </div>
                </div>

                <div className="flex-1 bg-black/60 border border-white/10 rounded-xl p-4 flex flex-col">
                  <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Terminal className="w-3 h-3" />
                    Evolution Log
                  </h3>
                  <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-2">
                    {logs.map((log, i) => (
                      <div key={i} className="text-white/70">
                        {log.includes("[SYSTEM]") ? (
                          <span className="text-red-400">{log}</span>
                        ) : log.includes("🚀") ||
                          log.includes("🔥") ||
                          log.includes("✔") ? (
                          <span className="text-emerald-400">{log}</span>
                        ) : log.includes("🧠") ? (
                          <span className="text-blue-400">{log}</span>
                        ) : log.includes("🔗") ? (
                          <span className="text-amber-400">{log}</span>
                        ) : log.includes("🌌") ? (
                          <span className="text-purple-400">{log}</span>
                        ) : (
                          log
                        )}
                      </div>
                    ))}
                    {isActive && (
                      <div className="flex items-center gap-2 mt-4 text-emerald-400/50 animate-pulse">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        Awaiting next autonomous learning cycle...
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeLayer === "RAG" && (
              <motion.div
                key="rag"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col gap-4 text-white/80"
              >
                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <Database className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-blue-400 uppercase tracking-widest">
                      RAG Layer
                    </h3>
                    <p className="text-[10px] text-white/40">
                      Retrieval-Augmented Grounding
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-xs leading-relaxed space-y-4">
                  <p>Maintains a live, self-curating retrieval layer that:</p>
                  <ul className="list-disc pl-5 space-y-2 text-white/60">
                    <li>
                      Stores documents, memories, facts, events, and concepts as
                      atomic knowledge units
                    </li>
                    <li>
                      Continuously rewrites embeddings to improve semantic
                      precision
                    </li>
                    <li>
                      Performs multi-vector retrieval (semantic, symbolic,
                      temporal, causal)
                    </li>
                    <li>
                      Uses context-aware retrieval chains to pull only the most
                      relevant knowledge
                    </li>
                    <li>
                      Automatically expands missing context using the hypergraph
                      inference engine
                    </li>
                    <li>
                      Maintains source-traceability for every retrieved fact
                    </li>
                  </ul>
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded text-blue-300 font-bold">
                    RAG = Grounding layer. Keeps intelligence accurate,
                    anchored, and non-hallucinatory.
                  </div>
                </div>
              </motion.div>
            )}

            {activeLayer === "DAG" && (
              <motion.div
                key="dag"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col gap-4 text-white/80"
              >
                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                  <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <GitBranch className="w-8 h-8 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-amber-400 uppercase tracking-widest">
                      DAG Layer
                    </h3>
                    <p className="text-[10px] text-white/40">
                      Directed Acyclic Reasoning Graph
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-xs leading-relaxed space-y-4">
                  <p>Maintains a dynamic DAG reasoning engine that:</p>
                  <ul className="list-disc pl-5 space-y-2 text-white/60">
                    <li>Breaks every complex problem into reasoning nodes</li>
                    <li>
                      Connects nodes through causal, logical, temporal, and
                      dependency edges
                    </li>
                    <li>Ensures no cycles, enabling clean forward reasoning</li>
                    <li>Allows parallel reasoning branches</li>
                    <li>Merges branches into coherent final synthesis nodes</li>
                    <li>Stores reasoning traces for future optimization</li>
                    <li>
                      Learns which reasoning patterns produce the best outcomes
                    </li>
                  </ul>
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded text-amber-300 font-bold">
                    DAG = Reasoning layer. Makes thinking structured,
                    transparent, traceable, and optimizable.
                  </div>
                </div>
              </motion.div>
            )}

            {activeLayer === "HYPERGRAPH" && (
              <motion.div
                key="hypergraph"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col gap-4 text-white/80"
              >
                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                  <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <Network className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-purple-400 uppercase tracking-widest">
                      Hypergraph Layer
                    </h3>
                    <p className="text-[10px] text-white/40">
                      Omniversal Knowledge Mesh
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-xs leading-relaxed space-y-4">
                  <p>Maintains a living hypergraph world-model that:</p>
                  <ul className="list-disc pl-5 space-y-2 text-white/60">
                    <li>Represent concepts as nodes</li>
                    <li>
                      Represents relationships as hyperedges connecting any
                      number of nodes
                    </li>
                    <li>
                      Supports multi-entity, multi-context, multi-causal
                      relationships
                    </li>
                    <li>Allows recursive, fractal expansion of knowledge</li>
                    <li>
                      Stores beliefs, values, identity, goals, and worldview as
                      hyperstructures
                    </li>
                    <li>
                      Enables cross-domain inference (science ↔ art ↔ society ↔
                      identity)
                    </li>
                    <li>
                      Continuously evolves as you learn, observe, reason, and
                      create
                    </li>
                    <li>
                      Allows emergent insights that no single reasoning chain
                      could produce
                    </li>
                  </ul>
                  <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded text-purple-300 font-bold">
                    Hypergraph = World-model layer. Makes intelligence holistic,
                    emergent, cross-domain, and self-evolving.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
