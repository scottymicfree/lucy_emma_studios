import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Hexagon, Cpu, Zap, Activity } from "lucide-react";

export function SwarmSymbiosisPanel() {
  const [drones, setDrones] = useState<
    { id: string; status: string; progress: number }[]
  >([]);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const res = await fetch("/api/health/daemon");
        if (res.ok) {
          const data = await res.json();
          setDrones([
            {
              id: "Python-Daemon",
              status: data.status === "ok" ? "Active" : "Offline",
              progress: data.status === "ok" ? 100 : 0,
            },
          ]);
        }
      } catch (e) {
        setDrones([]);
      }
    };
    fetchThreads();
    const interval = setInterval(fetchThreads, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col p-6 bg-[#030303] overflow-y-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
          <Hexagon className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
            Hive-Mind Symbiosis
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[9px] font-mono text-amber-400 uppercase tracking-widest">
              Distributed Processing
            </span>
          </h2>
          <p className="text-white/40 text-xs font-mono uppercase tracking-widest mt-1">
            Swarm Intelligence Drone Orchestration
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {drones.map((drone) => (
            <motion.div
              key={drone.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 flex flex-col relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-white tracking-widest uppercase">
                    {drone.id}
                  </span>
                </div>
                {drone.progress >= 100 ? (
                  <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                ) : (
                  <Zap className="w-4 h-4 text-amber-500/50" />
                )}
              </div>

              <div className="flex-1">
                <p className="text-[10px] text-white/50 font-mono uppercase mb-4 h-8">
                  {drone.status}
                </p>

                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                    initial={{ width: 0 }}
                    animate={{ width: `${drone.progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="text-right mt-2 text-[10px] text-amber-400/80 font-mono">
                  {Math.round(drone.progress)}%
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
