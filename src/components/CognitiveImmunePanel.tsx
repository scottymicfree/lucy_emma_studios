import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, ShieldAlert, Activity, Bug, Trash2 } from "lucide-react";
import {
  CognitiveImmuneSystem,
  Pathogen,
} from "../lib/core/CognitiveImmuneSystem";

export function CognitiveImmunePanel() {
  const [pathogens, setPathogens] = useState<Pathogen[]>([]);
  const [scanning, setScanning] = useState(false);
  const [purgingId, setPurgingId] = useState<string | null>(null);

  const scan = () => {
    setScanning(true);
    setTimeout(() => {
      const p = CognitiveImmuneSystem.getInstance().scanMemory();

      setPathogens(p);
      setScanning(false);
    }, 1500);
  };

  useEffect(() => {
    scan();
  }, []);

  const handlePurge = async (p: Pathogen) => {
    setPurgingId(p.id);
    await CognitiveImmuneSystem.getInstance().simulatePhagocytosis([p]);
    setPathogens((prev) => prev.filter((item) => item.id !== p.id));
    setPurgingId(null);
  };

  return (
    <div className="h-full flex flex-col p-6 bg-[#050505]">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <Shield className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
              Cognitive Immune System
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-mono text-emerald-400 uppercase tracking-widest">
                Autonomic
              </span>
            </h2>
            <p className="text-white/40 text-xs font-mono uppercase tracking-widest mt-1">
              Synaptic Pruning & Pathogen Neutralization
            </p>
          </div>
        </div>
        <button
          onClick={scan}
          disabled={scanning}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all font-mono text-[10px] text-white/60 uppercase tracking-widest flex items-center gap-2"
        >
          {scanning ? (
            <Activity className="w-4 h-4 animate-spin text-emerald-500" />
          ) : (
            <ShieldAlert className="w-4 h-4" />
          )}
          {scanning ? "Scanning LTM..." : "Run Deep Scan"}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto pr-2">
        <AnimatePresence>
          {pathogens.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              className="bg-[#0a0a0a] border border-red-500/20 rounded-2xl p-5 flex flex-col relative overflow-hidden group"
            >
              {/* Biological background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
              {purgingId === p.id && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-white/5 backdrop-blur-sm z-10 flex items-center justify-center"
                >
                  <div className="flex items-center gap-3 text-emerald-400 font-mono text-xs uppercase tracking-widest font-bold">
                    <Activity className="w-4 h-4 animate-spin" />
                    Phagocytosis in progress...
                  </div>
                </motion.div>
              )}

              <div className="flex items-center justify-between mb-4 relative z-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Bug className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest">
                      Cognitive Pathogen
                    </h3>
                    <p className="text-[10px] text-white/40 font-mono">
                      ID: {p.id.split("_")[2]}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-light text-white tracking-tighter">
                    {(p.successRate * 100).toFixed(1)}%
                  </span>
                  <p className="text-[9px] text-white/40 font-mono uppercase tracking-widest">
                    Viability
                  </p>
                </div>
              </div>

              <div className="bg-black/50 border border-white/5 rounded-xl p-3 mb-4 flex-1">
                <p className="text-xs text-white/80 font-mono break-all leading-relaxed">
                  <span className="text-white/30 mr-2">CHAIN:</span>
                  {p.chainKey}
                </p>
              </div>

              <div className="flex items-center justify-between mt-auto">
                <div className="flex gap-4">
                  <div>
                    <p className="text-[9px] text-white/30 font-mono uppercase tracking-widest mb-1">
                      Occurrences
                    </p>
                    <p className="text-xs text-white font-mono">
                      {p.occurrences}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-white/30 font-mono uppercase tracking-widest mb-1">
                      Impact
                    </p>
                    <p className="text-xs text-white font-mono">
                      {p.avgImpact.toFixed(2)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handlePurge(p)}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-all font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 group-hover:border-red-500/50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Deploy Antibodies
                </button>
              </div>
            </motion.div>
          ))}
          {pathogens.length === 0 && !scanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-1 lg:col-span-2 h-64 flex flex-col items-center justify-center border border-dashed border-emerald-500/20 rounded-2xl bg-emerald-500/5"
            >
              <Shield className="w-8 h-8 text-emerald-500/50 mb-4" />
              <p className="text-sm text-emerald-400/80 font-mono uppercase tracking-widest text-center">
                Cognitive Matrix is healthy. <br /> No pathogens detected.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
