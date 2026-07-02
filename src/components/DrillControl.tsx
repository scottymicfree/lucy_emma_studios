import React, { useState } from "react";
import { Play, ShieldAlert, Sparkles } from "lucide-react";
import { triggerAnomalyDrill } from "../lib/core/DrillSimulator";
import { runtimeGovernor } from "../lib/core/RuntimeGovernor";

export const DrillControl: React.FC = () => {
  const [isDreaming, setIsDreaming] = useState(false);

  const handleStartDreaming = async () => {
    setIsDreaming(true);
    await runtimeGovernor.startDreaming("100-story tower");
    setIsDreaming(false);
  };

  return (
    <div className="absolute right-6 top-6 z-50 flex flex-col gap-4">
      <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl w-64 shadow-2xl">
        <h3 className="text-white/80 font-mono text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          Simulation Drills
        </h3>
        <button
          onClick={triggerAnomalyDrill}
          className="w-full py-2 px-3 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 rounded text-red-100 font-mono text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2 mb-3"
        >
          <Play className="w-3 h-3" />
          Trigger MR Anomaly Drill
        </button>

        <button
          onClick={handleStartDreaming}
          disabled={isDreaming}
          className="w-full py-2 px-3 bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/50 rounded text-purple-100 font-mono text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles className="w-3 h-3" />
          {isDreaming ? "Dreaming..." : "Start Dreaming"}
        </button>
        <p className="text-[9px] text-white/40 mt-3 font-mono leading-relaxed">
          Predicts future build ideals by simulating 1,000 ticks against OS
          telemetry.
        </p>
      </div>
    </div>
  );
};
