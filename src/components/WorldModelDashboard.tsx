import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Network,
  Search,
  Layers,
  Activity,
  GitCommit,
  Database,
  Zap,
  Cpu,
} from "lucide-react";



export function WorldModelDashboard() {
  const [entities, setEntities] = useState<any[]>([]);
  const [chains, setChains] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [trafficData, setTrafficData] = useState<any[]>([]);

  const clusters = Array.from(new Set(entities.map((e) => e.cluster))).map(
    (id, index) => {
      const colors = ["blue", "purple", "green", "red", "yellow", "cyan"];
      return {
        id,
        name: String(id).toUpperCase(),
        color: colors[index % colors.length],
      };
    },
  );

  useEffect(() => {
    // Generate initial traffic data
    const initialData = Array.from({ length: 20 }).map((_, i) => ({
      time: new Date(Date.now() - (20 - i) * 1000).toLocaleTimeString([], {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      queries: Math.floor(Math.random() * 50) + 10,
      ingested: Math.floor(Math.random() * 100) + 20,
    }));
    setTrafficData(initialData);

    const interval = setInterval(() => {
      setTrafficData((prev) => {
        const newData = [...prev.slice(1)];
        newData.push({
          time: new Date().toLocaleTimeString([], {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          queries: Math.floor(Math.random() * 50) + 10,
          ingested: Math.floor(Math.random() * 100) + 20,
        });
        return newData;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/world-model");
        if (res.ok) {
          const data = await res.json();
          setEntities(data.entities || []);
          setChains(data.chains || []);
        }
      } catch (err) {
        console.error("Failed to fetch world model", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const getClusterColor = (clusterId: string) => {
    const cluster = clusters.find((c) => c.id === clusterId);
    switch (cluster?.color) {
      case "blue":
        return "bg-blue-500/20 border-blue-500/50 text-blue-400";
      case "purple":
        return "bg-purple-500/20 border-purple-500/50 text-purple-400";
      case "green":
        return "bg-green-500/20 border-green-500/50 text-green-400";
      default:
        return "bg-white/10 border-white/20 text-white/60";
    }
  };

  const getNodeColor = (type: string, status: string) => {
    if (status === "thinking")
      return "bg-amber-500 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]";
    switch (type) {
      case "system":
        return "bg-white border-white/80 shadow-[0_0_20px_rgba(255,255,255,0.3)]";
      case "agent":
        return "bg-blue-500 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]";
      case "process":
        return "bg-green-500 border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]";
      case "resource":
        return "bg-purple-500 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]";
      default:
        return "bg-gray-500 border-gray-400";
    }
  };

  const filteredEntities = entities.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="h-full flex flex-col bg-[#050505] text-white overflow-hidden relative">
      {/* Top Header */}
      <div className="flex items-center justify-between p-6 pb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight uppercase flex items-center gap-3">
            <Network className="w-6 h-6 text-blue-500" />
            World-Model Engine
          </h2>
          <p className="text-xs text-white/40 font-mono tracking-widest mt-1">
            REAL-TIME GRAPH VISUALIZATION & CAUSAL CHAINS
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Query entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition-all w-64"
            />
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <Layers className="w-4 h-4 text-white/40" />
            <span className="text-[10px] font-mono text-white/60">
              CLUSTERS: {clusters.length}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <GitCommit className="w-4 h-4 text-white/40" />
            <span className="text-[10px] font-mono text-white/60">
              CHAINS: {chains.length}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 p-6 pt-4 h-full min-h-0">
        {/* Graph Canvas */}
        <div className="flex-1 border border-white/10 rounded-2xl bg-[#0a0a0a] relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0a0a0a] to-[#0a0a0a]" />

          <svg
            className="absolute inset-0 w-full h-full"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
          >
            {/* Draw Causal Chains */}
            {chains.map((chain) => {
              const source = entities.find((e) => e.id === chain.source);
              const target = entities.find((e) => e.id === chain.target);
              if (!source || !target) return null;

              const isHighlighted =
                selectedEntity === source.id || selectedEntity === target.id;
              const opacity = selectedEntity
                ? isHighlighted
                  ? 0.8
                  : 0.1
                : 0.3;

              return (
                <g key={chain.id}>
                  <line
                    x1={`${source.x}%`}
                    y1={`${source.y}%`}
                    x2={`${target.x}%`}
                    y2={`${target.y}%`}
                    stroke="url(#chainGradient)"
                    strokeWidth={isHighlighted ? 2 : 1}
                    strokeOpacity={opacity}
                    strokeDasharray={chain.type === "invoke" ? "4,4" : "none"}
                    className="transition-all duration-300"
                  />
                  {isHighlighted && (
                    <text
                      x={`${(source.x + target.x) / 2}%`}
                      y={`${(source.y + target.y) / 2 - 2}%`}
                      fill="white"
                      fontSize="8"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="opacity-70"
                    >
                      {chain.type} ({(chain.confidence * 100).toFixed(0)}%)
                    </text>
                  )}
                </g>
              );
            })}

            <defs>
              <linearGradient
                id="chainGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>

          {/* Draw Entities */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
          >
            {filteredEntities.map((entity) => {
              const isSelected = selectedEntity === entity.id;
              const isDimmed = selectedEntity && !isSelected;

              return (
                <motion.div
                  key={entity.id}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer transition-all duration-300 ${isDimmed ? "opacity-20 blur-[1px]" : "opacity-100"}`}
                  style={{ left: `${entity.x}%`, top: `${entity.y}%` }}
                  onClick={() =>
                    setSelectedEntity(isSelected ? null : entity.id)
                  }
                  whileHover={{ scale: 1.1 }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${getNodeColor(entity.type, entity.status)}`}
                    />
                    <div
                      className={`px-2 py-1 rounded bg-black/80 backdrop-blur-sm border ${isSelected ? "border-blue-500 text-blue-400" : "border-white/10 text-white/80"}`}
                    >
                      <span className="text-[10px] font-mono font-bold block whitespace-nowrap">
                        {entity.name}
                      </span>
                      <span className="text-[8px] font-mono text-white/40 uppercase block text-center mt-0.5">
                        {entity.id}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Graph Controls */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center font-mono"
            >
              -
            </button>
            <button
              onClick={() => setZoom(1)}
              className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center font-mono text-[10px]"
            >
              1X
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center font-mono"
            >
              +
            </button>
          </div>
        </div>

        {/* Side Panel - Entity Detail / Hierarchical View */}
        <div className="w-80 flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {selectedEntity ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold tracking-widest uppercase text-white/60">
                    Entity Details
                  </h3>
                  <button
                    onClick={() => setSelectedEntity(null)}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-mono uppercase tracking-tighter"
                  >
                    Close
                  </button>
                </div>

                {(() => {
                  const entity = entities.find((e) => e.id === selectedEntity);
                  if (!entity) return null;
                  return (
                    <>
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${getNodeColor(entity.type, entity.status)}`}
                        >
                          {entity.type === "agent" && (
                            <Cpu className="w-5 h-5 text-white" />
                          )}
                          {entity.type === "system" && (
                            <Network className="w-5 h-5 text-white" />
                          )}
                          {entity.type === "process" && (
                            <Activity className="w-5 h-5 text-white" />
                          )}
                          {entity.type === "resource" && (
                            <Database className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">
                            {entity.name}
                          </div>
                          <div className="text-[10px] text-white/40 font-mono mt-1">
                            ID: {entity.id} | TYPE: {entity.type.toUpperCase()}
                          </div>
                          <div className="mt-2 flex">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold border ${getClusterColor(entity.cluster)}`}
                            >
                              {entity.cluster} cluster
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-white/10 my-2" />

                      <div>
                        <h4 className="text-[10px] font-mono text-white/40 mb-2 uppercase tracking-widest">
                          Active Causal Chains
                        </h4>
                        <div className="flex flex-col gap-2">
                          {chains
                            .filter(
                              (c) =>
                                c.source === entity.id ||
                                c.target === entity.id,
                            )
                            .map((chain) => {
                              const isSource = chain.source === entity.id;
                              const otherId = isSource
                                ? chain.target
                                : chain.source;
                              const otherEntity = entities.find(
                                (e) => e.id === otherId,
                              );
                              return (
                                <div
                                  key={chain.id}
                                  className="bg-white/5 border border-white/10 rounded px-3 py-2 flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-[9px] font-mono ${isSource ? "text-blue-400" : "text-purple-400"}`}
                                    >
                                      {isSource ? "OUTPUTS TO" : "INPUT FROM"}
                                    </span>
                                    <span className="text-[10px] text-white font-mono">
                                      {otherEntity?.name}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-mono text-white/40 bg-black/50 px-1.5 py-0.5 rounded">
                                    {(chain.confidence * 100).toFixed(0)}% CONF
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      <div className="h-px bg-white/10 my-2" />

                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${entity.status === "active" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"}`}
                        />
                        <span className="text-[10px] font-mono uppercase text-white/60">
                          Status: {entity.status}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 flex flex-col gap-4 flex-1 shadow-2xl overflow-y-auto min-h-0 custom-scrollbar"
              >
                <h3 className="text-xs font-bold tracking-widest uppercase text-white/60 sticky top-0 bg-[#0a0a0a] pb-2 z-10">
                  Hierarchical Clusters
                </h3>

                <div className="flex flex-col gap-6">
                  {clusters.map((cluster) => (
                    <div key={cluster.id} className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${cluster.color === "blue" ? "bg-blue-500" : cluster.color === "purple" ? "bg-purple-500" : "bg-green-500"}`}
                        />
                        <h4 className="text-[10px] font-mono text-white/80 uppercase tracking-widest">
                          {cluster.name}
                        </h4>
                      </div>

                      <div className="flex flex-col gap-1.5 pl-4 border-l border-white/10">
                        {entities
                          .filter((e) => e.cluster === cluster.id)
                          .map((entity) => (
                            <button
                              key={entity.id}
                              onClick={() => setSelectedEntity(entity.id)}
                              className="text-left px-3 py-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-white/40 font-mono group-hover:text-white/60 transition-colors">
                                  {entity.id}
                                </span>
                                <span className="text-[11px] text-white/80 group-hover:text-white transition-colors">
                                  {entity.name}
                                </span>
                              </div>
                              <span className="text-[8px] font-mono text-white/30 uppercase group-hover:text-white/50">
                                {entity.type}
                              </span>
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Traffic Data Visualization */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 shadow-2xl h-56 flex flex-col shrink-0">
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-white/60 mb-4 flex items-center gap-2">
              <Activity className="w-3 h-3 text-blue-500" />
              API Traffic Statistics
            </h3>
            <div className="flex-1 min-h-0 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trafficData}
                  margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                >
                  <XAxis
                    dataKey="time"
                    tick={{
                      fill: "rgba(255,255,255,0.4)",
                      fontSize: 8,
                      fontFamily: "monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fill: "rgba(255,255,255,0.4)",
                      fontSize: 8,
                      fontFamily: "monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0a0a0a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      fontSize: "10px",
                      fontFamily: "monospace",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="queries"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="ingested"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-3 text-[9px] font-mono uppercase tracking-widest text-white/50 px-2">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded bg-blue-500" /> Queries
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded bg-purple-500" /> Ingested
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
