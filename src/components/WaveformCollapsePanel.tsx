import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GitMerge, Zap, Compass, Dna, Activity } from "lucide-react";
import {
  WaveformCollapseEngine,
  Superposition,
  QuantumState,
} from "../lib/core/WaveformCollapseEngine";

export function WaveformCollapsePanel() {
  const [problem, setProblem] = useState("");
  const [superposition, setSuperposition] = useState<Superposition | null>(
    null,
  );
  const [collapsing, setCollapsing] = useState<string | null>(null);

  const handleEntangle = async () => {
    if (!problem.trim()) return;
    setCollapsing("generating"); // repurposing for loading
    const sp = await WaveformCollapseEngine.getInstance().entangle(problem);
    setSuperposition(sp);
    setCollapsing(null);
  };

  const handleCollapse = (stateId: string) => {
    setCollapsing(stateId);
    setTimeout(() => {
      if (superposition) {
        const collapsed = WaveformCollapseEngine.getInstance().collapse(
          superposition,
          stateId,
        );
        setSuperposition(collapsed);
      }
      setCollapsing(null);
    }, 1200); // Visual delay for collapse animation
  };

  return (
    <div className="h-full flex flex-col p-6 bg-[#050505]">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
            <GitMerge className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
              Multiverse State Engine
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[9px] font-mono text-indigo-400 uppercase tracking-widest">
                Superposition
              </span>
            </h2>
            <p className="text-white/40 text-xs font-mono uppercase tracking-widest mt-1">
              Quantum Waveform Collapse Protocol
            </p>
          </div>
        </div>
      </div>

      {!superposition || superposition.status === "collapsed" ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full"
        >
          {superposition?.status === "collapsed" && (
            <div className="w-full mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-4 text-emerald-400">
              <Zap className="w-5 h-5" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest">
                  Reality Instantiated
                </p>
                <p className="text-[10px] font-mono text-emerald-400/60 mt-1">
                  Timeline has been committed to LocalStorage LTM.
                </p>
              </div>
            </div>
          )}

          <div className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-8">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              Define Divergence Point
            </h3>
            <p className="text-xs text-white/40 font-mono mb-6">
              Enter a high-entropy problem to evaluate across parallel
              timelines.
            </p>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="e.g. How should we restructure the neural routing logic for maximum autonomy?"
              className="w-full h-32 bg-black border border-white/10 focus:border-indigo-500/50 rounded-xl p-4 text-sm text-white placeholder:text-white/20 font-mono resize-none transition-all outline-none"
            />
            <button
              onClick={handleEntangle}
              disabled={!problem.trim() || collapsing === "generating"}
              className="mt-4 w-full py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 rounded-xl font-bold tracking-widest text-xs transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {collapsing === "generating" ? (
                <>
                  <Activity className="w-4 h-4 animate-spin text-indigo-400" />
                  Generating Timelines...
                </>
              ) : (
                <>
                  <Dna className="w-4 h-4" />
                  Entangle Waveform
                </>
              )}
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="flex-1 flex flex-col relative">
          <div className="text-center mb-8">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest animate-pulse flex items-center justify-center gap-2">
              <Activity className="w-4 h-4" />
              Superposition Active
            </h3>
            <p className="text-[10px] text-white/40 font-mono mt-2 max-w-xl mx-auto truncate">
              {superposition.problemSpace}
            </p>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Visual connecting lines could go here */}

            <AnimatePresence>
              {superposition.states.map((state, idx) => (
                <motion.div
                  key={state.id}
                  initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: idx * 0.2 }}
                  className={`bg-[#0a0a0a] border rounded-2xl p-6 flex flex-col relative overflow-hidden transition-all duration-500 ${
                    collapsing && collapsing !== "generating" && collapsing !== state.id
                      ? "opacity-20 scale-95 grayscale"
                      : "border-white/10 hover:border-indigo-500/30"
                  }`}
                >
                  {collapsing === state.id && (
                    <motion.div
                      className="absolute inset-0 bg-indigo-500/20 z-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatType: 'mirror' }}
                    />
                  )}

                  <div className="relative z-10 flex-1 flex flex-col">
                    <div className="mb-4 pb-4 border-b border-white/5">
                      <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
                        Reality Branch {idx + 1}
                      </span>
                      <h4 className="text-lg font-bold text-white mt-1 leading-tight">
                        {state.name}
                      </h4>
                    </div>

                    <div className="space-y-4 mb-6 flex-1">
                      <div>
                        <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest">
                          Philosophy
                        </span>
                        <p className="text-xs text-white/70 mt-1 leading-relaxed">
                          {state.philosophy}
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest">
                          Outcome Vector
                        </span>
                        <p className="text-xs text-white/50 font-mono mt-1">
                          {state.projectedOutcome}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-6 p-3 bg-black rounded-lg border border-white/5">
                      <div>
                        <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest block">
                          Probability
                        </span>
                        <span className="text-sm font-bold text-white">
                          {(state.probability * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest block">
                          Entropy
                        </span>
                        <span className="text-sm font-bold text-white">
                          {state.entropy.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCollapse(state.id)}
                      disabled={collapsing !== null && collapsing !== "generating"}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold tracking-widest text-[10px] uppercase transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                    >
                      {collapsing === state.id ? (
                        <>
                          <Activity className="w-4 h-4 animate-spin text-indigo-400" />
                          Collapsing...
                        </>
                      ) : (
                        <>
                          <GitMerge className="w-4 h-4 group-hover:text-indigo-400 transition-colors" />
                          Collapse Waveform
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
