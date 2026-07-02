import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Zap,
  Activity,
  ChevronRight,
  RefreshCw,
  GitBranch,
  Network,
  LineChart as LineChartIcon,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { SystemStateManager } from "../lib/core/systemStateManager";

export function SimulationDashboard() {
  const [query, setQuery] = useState(
    "Simulate the outcome of an AI-driven society for 5 years",
  );
  const [horizon, setHorizon] = useState(5);
  const [profile, setProfile] = useState<
    "Calm" | "Fast" | "Stress" | "Hyper Test"
  >("Calm");
  const [isSimulating, setIsSimulating] = useState(false);
  const [outcome, setOutcome] = useState<any>(null);
  const [batchOutcomes, setBatchOutcomes] = useState<Record<string, any>>({});
  const [logs, setLogs] = useState<string[]>([]);

  const runSingle = async (p: "Calm" | "Fast" | "Stress" | "Hyper Test") => {
    const sysState = SystemStateManager.getInstance();
    return await sysState.simulation.runSimulation(
      {
        query,
        horizon,
        agents: ["System Dynamics", "External Actors"],
        variables: ["Stability", "Resource Drain", "Entropy"],
        profile: p,
      },
      (msg) => setLogs((prev) => [...prev, msg]),
    );
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    setOutcome(null);
    setBatchOutcomes({});
    setLogs([]);

    try {
      const result = await runSingle(profile);
      setOutcome(result);
    } catch (e: any) {
      setLogs((prev) => [...prev, `[ERROR] Simulation failed: ${e.message}`]);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleBatchDrill = async () => {
    setIsSimulating(true);
    setOutcome(null);
    setBatchOutcomes({});
    setLogs([]);

    try {
      const profiles: ("Calm" | "Fast" | "Stress" | "Hyper Test")[] = [
        "Calm",
        "Fast",
        "Stress",
        "Hyper Test",
      ];
      const results: Record<string, any> = {};
      for (const p of profiles) {
        setLogs((prev) => [
          ...prev,
          `\n=== STARTING DRILL: ${p.toUpperCase()} ===\n`,
        ]);
        results[p] = await runSingle(p);
      }
      setBatchOutcomes(results);
      setProfile("Calm"); // default view
      setOutcome(results["Calm"]);
    } catch (e: any) {
      setLogs((prev) => [...prev, `[ERROR] Batch Drill failed: ${e.message}`]);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExportReport = () => {
    let exportData;
    if (Object.keys(batchOutcomes).length > 0) {
      exportData = {
        type: "BatchSimulationReport",
        timestamp: new Date().toISOString(),
        query,
        horizon,
        outcomes: batchOutcomes
      };
    } else if (outcome) {
      exportData = {
        type: "SimulationReport",
        timestamp: new Date().toISOString(),
        query,
        horizon,
        profile,
        outcome
      };
    } else {
      return;
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lucy-simulation-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col font-mono text-white bg-[#030303]">
      <div className="p-6 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-widest uppercase flex items-center gap-3 text-cyan-400">
            <Sparkles className="w-6 h-6" />
            Simulation Orchestrator
          </h2>
          <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">
            RAG + Hypergraph + DAG Futures Engine
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row p-6 gap-6">
        {/* Left Side: Configuration & Logs */}
        <div className="w-full md:w-1/3 flex flex-col gap-6">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Scenario Configuration
            </h3>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-white/40 uppercase">
                Simulation Query
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-black/50 border border-white/10 rounded p-2 text-xs text-white/80 focus:border-cyan-500/50 outline-none resize-none h-20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-white/40 uppercase">
                Profile
              </label>
              <select
                value={profile}
                onChange={(e) => setProfile(e.target.value as any)}
                className="bg-black/50 border border-white/10 rounded p-2 text-xs text-white/80 focus:border-cyan-500/50 outline-none"
              >
                <option value="Calm">Calm (Low Entropy)</option>
                <option value="Fast">Fast (High Speed)</option>
                <option value="Stress">Stress (High Resource Drain)</option>
                <option value="Hyper Test">Hyper Test (Max Entropy)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-[10px] text-white/40 uppercase">
                Time Horizon (Cycles)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={horizon}
                  onChange={(e) => setHorizon(parseInt(e.target.value))}
                  className="accent-cyan-500"
                />
                <span className="text-xs font-bold text-cyan-400">
                  {horizon}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSimulate}
                disabled={isSimulating}
                className={`flex-1 py-3 rounded text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  isSimulating
                    ? "bg-cyan-500/10 text-cyan-500/50 border border-cyan-500/20 cursor-not-allowed"
                    : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                }`}
              >
                {isSimulating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {isSimulating ? "Simulating..." : "Run Profile"}
              </button>

              <button
                onClick={handleBatchDrill}
                disabled={isSimulating}
                className={`flex-1 py-3 rounded text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  isSimulating
                    ? "bg-purple-500/10 text-purple-500/50 border border-purple-500/20 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                }`}
              >
                {isSimulating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Activity className="w-4 h-4" />
                )}
                Batch Drill
              </button>
            </div>
          </div>

          <div className="flex-1 bg-black/60 border border-white/10 rounded-xl p-4 flex flex-col">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
              Live Orchestration Trace
            </h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
              {logs.map((log, i) => (
                <div key={i} className="text-[9px] text-white/60 font-mono">
                  {log.includes("[ERROR]") ? (
                    <span className="text-red-400">{log}</span>
                  ) : log.includes("SimulationEngine") ? (
                    <span className="text-cyan-400">{log}</span>
                  ) : log.includes("TemporalEngine") ? (
                    <span className="text-purple-400">{log}</span>
                  ) : log.includes("Emergent") ? (
                    <span className="text-amber-400">{log}</span>
                  ) : (
                    log
                  )}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-[9px] text-white/20 italic">
                  Awaiting simulation trigger...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Results */}
        <div className="w-full md:w-2/3 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {outcome ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 bg-[#0a0a0a] border border-cyan-500/30 rounded-xl p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar"
              >
                {Object.keys(batchOutcomes).length > 0 && (
                  <div className="flex gap-2 border-b border-white/10 pb-4">
                    {["Calm", "Fast", "Stress", "Hyper Test"].map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setProfile(p as any);
                          setOutcome(batchOutcomes[p]);
                        }}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${
                          profile === p
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/50"
                            : "bg-black/50 text-white/40 border border-white/10 hover:bg-white/5"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="p-2 bg-cyan-500/10 rounded border border-cyan-500/30 text-cyan-400">
                    <Network className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest">
                      Simulation Outcome{" "}
                      {Object.keys(batchOutcomes).length > 0
                        ? `(${profile})`
                        : ""}
                    </h3>
                    <p className="text-[10px] text-cyan-400">
                      Synthesized via Tri-Layer Knowledge Superstructure
                    </p>
                  </div>
                  <button
                    onClick={handleExportReport}
                    className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl transition-all font-mono text-[10px] text-cyan-400 uppercase tracking-widest flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Report
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-black/40 rounded border border-white/10">
                    <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                      <Activity className="w-3 h-3" />
                      Key Events & Emergence
                    </h4>
                    <div className="space-y-3 text-[10px]">
                      {outcome.keyEvents.map((evt: any, i: number) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-white/40">T+{evt.time}:</span>
                          <span className="text-white/80">
                            {evt.description}{" "}
                            <span className="text-amber-500/50">
                              ({evt.impact})
                            </span>
                          </span>
                        </div>
                      ))}
                      {outcome.keyEvents.length === 0 && (
                        <span className="text-white/30">
                          No major divergent events detected.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-black/40 rounded border border-white/10">
                    <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                      <GitBranch className="w-3 h-3" />
                      Identified Risks
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 text-[10px] text-white/70">
                      {outcome.risks.map((r: string, i: number) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-black/40 rounded border border-white/10">
                    <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                      <Sparkles className="w-3 h-3" />
                      Strategic Opportunities
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 text-[10px] text-white/70">
                      {outcome.opportunities.map((o: string, i: number) => (
                        <li key={i}>{o}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-cyan-500/5 rounded border border-cyan-500/20">
                    <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                      <ChevronRight className="w-3 h-3" />
                      Recommendations
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 text-[10px] text-white/90">
                      {outcome.recommendations.map((r: string, i: number) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Data Chart */}
                {outcome.timeSeriesData &&
                  outcome.timeSeriesData.length > 0 && (
                    <div className="mt-4 p-4 bg-black/40 rounded border border-white/10 h-64 flex flex-col">
                      <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <LineChartIcon className="w-3 h-3" />
                        Variable Trajectories over Time
                      </h4>
                      <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={outcome.timeSeriesData}
                            margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#ffffff10"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="time"
                              stroke="#ffffff40"
                              tick={{ fill: "#ffffff40", fontSize: 10 }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              stroke="#ffffff40"
                              tick={{ fill: "#ffffff40", fontSize: 10 }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#0a0a0a",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "8px",
                                fontSize: "10px",
                              }}
                              itemStyle={{ color: "#fff" }}
                            />
                            <Legend
                              wrapperStyle={{
                                fontSize: "10px",
                                color: "#ffffff60",
                              }}
                            />
                            {Object.keys(outcome.timeSeriesData[0])
                              .filter((k) => k !== "time")
                              .map((key, index) => (
                                <Line
                                  key={key}
                                  type="monotone"
                                  dataKey={key}
                                  stroke={
                                    index === 0
                                      ? "#06b6d4"
                                      : index === 1
                                        ? "#a855f7"
                                        : "#f59e0b"
                                  }
                                  strokeWidth={2}
                                  dot={false}
                                  activeDot={{ r: 4, fill: "#fff" }}
                                />
                              ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
              </motion.div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] border border-white/5 rounded-xl border-dashed">
                <div className="text-center text-white/20">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-xs uppercase tracking-widest">
                    Configure scenario and run simulation to view futures.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
