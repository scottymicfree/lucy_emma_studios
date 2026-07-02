import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, Activity, RefreshCw, GitBranch, Shield, Eye, FileText, ArrowRight, GitCommit } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis
} from "recharts";

type CreativeTelemetryData = {
  entropy: number;
  velocity: number;
  resilience: {
    status: string;
    bufferSaturation: number;
    meaningReconstructionActive: boolean;
  };
  divergenceMap: {
    root: string;
    branches: { id: string; entropy: number; name: string }[];
  };
  recentComparisons: {
    branchId: string;
    strengths: string[];
    weaknesses: string[];
    emergence: string;
  }[];
  reasoningChains: { step: number; decision: string; rationale: string }[];
  auditLogs: { timestamp: string; action: string; branches: number }[];
};

export function CreativeTelemetryDashboard() {
  const [data, setData] = useState<CreativeTelemetryData | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/creative-telemetry");
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setHistory(prev => {
            const newHist = [...prev, {
              time: new Date().toLocaleTimeString(),
              entropy: json.entropy,
              velocity: json.velocity
            }];
            if (newHist.length > 20) newHist.shift();
            return newHist;
          });
        }
      } catch (e) {
        console.error("Creative telemetry fetch failed", e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2500);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <div className="text-gray-400 p-4">Loading Creative Telemetry...</div>;

  return (
    <div className="w-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium tracking-tight text-white flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          Creative Divergence & Resilience
        </h2>
        {data.resilience.meaningReconstructionActive && (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-mono uppercase tracking-wider border border-amber-500/30">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Meaning Reconstruction Active
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Telemetry Overview */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-medium text-zinc-300">Creative Motion & Resilience</h3>
            <Shield className="w-4 h-4 text-emerald-500" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
              <span className="block text-xs text-zinc-500 mb-1">System Entropy</span>
              <span className="text-lg font-mono text-orange-400">{(data.entropy * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
              <span className="block text-xs text-zinc-500 mb-1">Creative Velocity</span>
              <span className="text-lg font-mono text-cyan-400">{data.velocity.toFixed(2)}x</span>
            </div>
            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
              <span className="block text-xs text-zinc-500 mb-1">Buffer Saturation</span>
              <span className="text-lg font-mono text-zinc-300">{(data.resilience.bufferSaturation * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
              <span className="block text-xs text-zinc-500 mb-1">Status</span>
              <span className={`text-sm font-mono ${data.resilience.status === 'stable' ? 'text-emerald-400' : 'text-amber-400'}`}>{data.resilience.status.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Divergence Heatmap (Simulated) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-medium text-zinc-300">Divergence Map</h3>
            <GitBranch className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1 flex flex-col justify-center space-y-3">
             <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-zinc-800 text-xs text-zinc-300 rounded font-mono border border-zinc-700">{data.divergenceMap.root}</div>
             </div>
             <div className="flex flex-col gap-2 pl-4 border-l border-zinc-700 ml-4 relative">
                {data.divergenceMap.branches.map((b, i) => (
                    <div key={b.id} className="flex items-center gap-2 relative">
                        <div className="absolute w-4 border-t border-zinc-700 -left-4 top-1/2"></div>
                        <div className="px-2 py-1 bg-zinc-950 text-xs text-zinc-400 rounded font-mono border border-zinc-800 flex justify-between w-full">
                            <span>{b.name}</span>
                            <span className="text-orange-400 text-[10px]">Ent: {b.entropy}</span>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        </div>

        {/* Reasoning Chain Visualizer */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-medium text-zinc-300">Reasoning Chain</h3>
            <GitCommit className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {data.reasoningChains.map((chain, i) => (
                <div key={i} className="flex gap-3 text-xs">
                    <div className="flex flex-col items-center">
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono border border-blue-500/30">{chain.step}</div>
                        {i < data.reasoningChains.length - 1 && <div className="w-px h-full bg-zinc-800 my-1"></div>}
                    </div>
                    <div className="pb-2">
                        <span className="block text-zinc-200">{chain.decision}</span>
                        <span className="block text-zinc-500">{chain.rationale}</span>
                    </div>
                </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Entropy Graph */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h3 className="text-sm font-medium text-zinc-300 mb-4">Creative Entropy vs Velocity</h3>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="time" stroke="#52525b" fontSize={10} tickMargin={8} />
                    <YAxis yAxisId="left" stroke="#f97316" fontSize={10} domain={[0, 1]} tickFormatter={(val) => val.toFixed(1)} />
                    <YAxis yAxisId="right" orientation="right" stroke="#06b6d4" fontSize={10} domain={[0, 2]} tickFormatter={(val) => val.toFixed(1)} />
                    <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', fontSize: '12px' }}
                    itemStyle={{ color: '#e4e4e7' }}
                    />
                    <Line yAxisId="left" type="monotone" dataKey="entropy" name="Entropy" stroke="#f97316" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="velocity" name="Velocity" stroke="#06b6d4" strokeWidth={2} dot={false} />
                </LineChart>
                </ResponsiveContainer>
            </div>
          </div>

          {/* Outcome Comparison Panel */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col">
            <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400"/> Outcome Comparison
            </h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {data.recentComparisons.map((comp, i) => (
                    <div key={i} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-xs">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-mono text-zinc-300">{comp.branchId}</span>
                            <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">Emerged: {comp.emergence}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-zinc-800">
                            <div>
                                <span className="text-emerald-400 block mb-1">Strengths</span>
                                <ul className="list-disc pl-3 text-zinc-400 space-y-0.5">
                                    {comp.strengths.map((s, idx) => <li key={idx}>{s}</li>)}
                                </ul>
                            </div>
                            <div>
                                <span className="text-rose-400 block mb-1">Weaknesses</span>
                                <ul className="list-disc pl-3 text-zinc-400 space-y-0.5">
                                    {comp.weaknesses.map((w, idx) => <li key={idx}>{w}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
      </div>
      
      {/* Audit Trail */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-zinc-500" />
            Creative Audit Trail
        </h3>
        <div className="space-y-2 text-xs font-mono">
            {data.auditLogs.map((log, i) => (
                <div key={i} className="flex gap-4 p-2 bg-zinc-950 rounded border border-zinc-800/50">
                    <span className="text-zinc-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="text-purple-400">[{log.action.toUpperCase()}]</span>
                    <span className="text-zinc-300">Generated {log.branches} divergent branches.</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
