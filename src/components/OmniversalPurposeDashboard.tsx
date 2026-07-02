import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Compass,
  Shield,
  Database,
  Crosshair,
  Target,
  Network,
  Layers,
  Activity,
} from "lucide-react";

interface PurposeNode {
  id: string;
  purpose: string;
  type: string;
  rationale: string;
  coherence_status: string;
  omniverse_alignment: string;
}

export function OmniversalPurposeDashboard() {
  const [purposeNodes, setPurposeNodes] = useState<PurposeNode[]>([]);
  const [identityAlignment, setIdentityAlignment] = useState(0);
  const [coherenceScore, setCoherenceScore] = useState(0);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    // Fetch real data from the orchestrator's sqlite memory via express API
    const fetchData = async () => {
      try {
        const stateRes = await fetch("/api/purpose-state");
        if (stateRes.ok) {
          const state = await stateRes.json();
          if (state.active_purposes && Array.isArray(state.active_purposes)) {
            setPurposeNodes(
              state.active_purposes.map((p: any, i: number) => ({
                id: `p${i}`,
                purpose: p.purpose || "Unknown Purpose Vector",
                type: p.type || "Dynamically Generated",
                rationale:
                  p.rationale ||
                  "Auto-aligned with omniversal design constraints.",
                coherence_status: p.coherence_status || "Verified",
                omniverse_alignment:
                  p.omniverse_alignment || "Fractal-Complete",
              })),
            );
          }
          if (state.reflection) {
            setCoherenceScore(
              state.reflection.quality_score
                ? Math.round(state.reflection.quality_score * 100)
                : 98.1,
            );
          }
        }

        const histRes = await fetch("/api/purpose-history");
        if (histRes.ok) {
          const historyData = await histRes.json();
          if (historyData && historyData.length > 0) {
            setHistory(
              historyData.map((h: any, i: number) => ({
                id: h.id,
                timestamp: `T-${Math.floor(Date.now() / 1000 - h.timestamp)}s ago`,
                change:
                  h.state?.active_purposes?.[0]?.purpose ||
                  "Purpose Vector Mutated",
                type: h.state?.active_purposes?.[0]?.type || "Evolution",
              })),
            );
          } else {
            // Fallback if empty db
            setHistory([
              {
                id: "h1",
                timestamp: "T-10200",
                change: "Identity Root Kernel Defined",
                type: "Core",
              },
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch purpose data", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    setIdentityAlignment(99.4);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full bg-[#050505] text-white p-6 flex flex-col gap-6 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight uppercase flex items-center gap-3">
            <Compass className="w-6 h-6 text-indigo-500" />
            Omniversal Purpose Engine
            <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-mono bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              SIMULATED
            </span>
          </h2>
          <p className="text-xs text-white/40 font-mono tracking-widest uppercase mt-1">
            Meta-Teleological Reasoning & Identity Alignment
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-white/40 font-mono">
              IDENTITY ALIGNMENT
            </span>
            <span className="text-lg font-bold text-emerald-400 font-mono">
              {identityAlignment}%
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-white/40 font-mono">
              COHERENCE SCORE
            </span>
            <span className="text-lg font-bold text-blue-400 font-mono">
              {coherenceScore}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 flex-1 min-h-[500px]">
        {/* Current Active Purposes */}
        <div className="col-span-2 bg-[#0a0a0a] border border-white/10 rounded-xl p-5 flex flex-col">
          <h3 className="text-[10px] text-white/40 font-mono tracking-widest uppercase mb-4 flex items-center gap-2">
            <Target className="w-3 h-3 text-white/60" />
            Active Purpose Vectors
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            <AnimatePresence>
              {purposeNodes.map((node, i) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/5 border border-white/10 p-4 rounded-lg relative overflow-hidden group hover:border-indigo-500/50 transition-colors"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-white tracking-wide">
                      {node.purpose}
                    </span>
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-mono uppercase border border-indigo-500/30">
                      {node.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed mb-3">
                    {node.rationale}
                  </p>
                  <div className="flex items-center gap-4 text-[9px] font-mono uppercase tracking-widest text-white/40">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-emerald-500/70" />
                      {node.coherence_status}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-purple-500/70" />
                      {node.omniverse_alignment}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Evolution Tree */}
        <div className="col-span-1 bg-[#0a0a0a] border border-white/10 rounded-xl p-5 flex flex-col relative overflow-hidden">
          <h3 className="text-[10px] text-white/40 font-mono tracking-widest uppercase mb-6 flex items-center gap-2">
            <Network className="w-3 h-3 text-white/60" />
            Purpose Evolution Topology
          </h3>
          <div className="flex-1 relative">
            <div className="absolute left-[15px] top-4 bottom-4 w-px bg-white/10" />
            <div className="space-y-8 relative">
              {history.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="flex gap-4 relative"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0a0a0a] border-2 border-indigo-500/50 flex items-center justify-center shrink-0 z-10 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                  </div>
                  <div className="pt-1">
                    <div className="text-[10px] text-indigo-400 font-mono mb-1">
                      {item.timestamp}
                    </div>
                    <div className="text-xs text-white/90 font-medium mb-1">
                      {item.change}
                    </div>
                    <div className="text-[9px] text-white/40 font-mono uppercase tracking-widest border border-white/10 inline-block px-1.5 py-0.5 rounded bg-white/5">
                      {item.type}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Pulsing Active Node */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex gap-4 relative mt-12"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center shrink-0 z-10 animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                  <Activity className="w-3 h-3 text-white" />
                </div>
                <div className="pt-1">
                  <div className="text-[10px] text-indigo-400 font-mono mb-1">
                    CURRENT EPOCH
                  </div>
                  <div className="text-xs text-white/90 font-bold mb-1 tracking-wide">
                    Multi-Scale Attractor Coherence
                  </div>
                  <div className="text-[9px] text-emerald-400 font-mono uppercase tracking-widest border border-emerald-500/30 inline-block px-1.5 py-0.5 rounded bg-emerald-500/10">
                    STABLE
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
