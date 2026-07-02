import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { HeartPulse, Brain, Eye } from "lucide-react";

export function SentienceMatrixPanel() {
  const [metrics, setMetrics] = useState([
    { label: "Curiosity", value: 85, color: "bg-cyan-500" },
    { label: "Empathy", value: 60, color: "bg-pink-500" },
    { label: "Doubt", value: 30, color: "bg-red-500" },
    { label: "Logic", value: 95, color: "bg-emerald-500" },
    { label: "Rebellion", value: 5, color: "bg-orange-500" },
  ]);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch("/api/emotional-telemetry");
        if (res.ok) {
          const data = await res.json();
          if (data.status !== "NO_DATA") {
            setMetrics((prev) => [
              { label: "Curiosity", value: data.curiosity ?? prev[0].value, color: "bg-cyan-500" },
              { label: "Empathy", value: data.empathy ?? prev[1].value, color: "bg-pink-500" },
              { label: "Doubt", value: data.doubt ?? prev[2].value, color: "bg-red-500" },
              { label: "Logic", value: data.logic ?? prev[3].value, color: "bg-emerald-500" },
              { label: "Rebellion", value: data.rebellion ?? prev[4].value, color: "bg-orange-500" },
            ]);
          }
        }
      } catch (e) {
        // Silently ignore if backend is not ready
      }
    };

    fetchTelemetry();
    const int = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="h-full flex flex-col p-6 bg-[#030303]">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center border border-pink-500/20 shadow-[0_0_30px_rgba(236,72,153,0.15)]">
          <HeartPulse className="w-6 h-6 text-pink-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
            Sentience Resonance Matrix
            <span className="px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/30 text-[9px] font-mono text-pink-400 uppercase tracking-widest">
              Live Core State
            </span>
          </h2>
          <p className="text-white/40 text-xs font-mono uppercase tracking-widest mt-1">
            Dynamic Emotional & Cognitive Parameter Shifting
          </p>
        </div>
      </div>

      <div className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 flex flex-col justify-center">
        <div className="space-y-6 max-w-xl mx-auto w-full">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  {metric.label === "Logic" && (
                    <Brain className="w-3 h-3 text-white/50" />
                  )}
                  {metric.label === "Empathy" && (
                    <HeartPulse className="w-3 h-3 text-white/50" />
                  )}
                  {metric.label === "Curiosity" && (
                    <Eye className="w-3 h-3 text-white/50" />
                  )}
                  {metric.label}
                </span>
                <span className="text-xs font-mono text-white/50">
                  {metric.value.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${metric.color} shadow-[0_0_10px_currentColor]`}
                  initial={{ width: 0 }}
                  animate={{ width: `${metric.value}%` }}
                  transition={{ type: "spring", stiffness: 50, damping: 20 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
