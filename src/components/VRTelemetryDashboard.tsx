import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Glasses, Map, Hand, Anchor, Box, Activity, Shield, GitBranch } from 'lucide-react';
import { useNodeStore } from '../store/useNodeStore';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  LineChart,
  Line
} from "recharts";

type VRTelemetry = {
  sessionActive: boolean;
  headset: { x: number; y: number; z: number };
  hands: { left: string; right: string };
  anchors: string[];
  boundarySafe: boolean;
  spatialEntropy: number;
  emotionalStabilization: number;
  creativeDivergenceHeatmap: { x: number; y: number; intensity: number }[];
};

export function VRTelemetryDashboard() {
  const [data, setData] = useState<VRTelemetry | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const syncVRNodes = useNodeStore((state) => state.syncVRNodes);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/vr-telemetry");
        if (res.ok) {
          const json = await res.json();
          setData(json);
          syncVRNodes(json);
          setHistory(prev => {
            const newHist = [...prev, {
              time: new Date().toLocaleTimeString(),
              entropy: json.spatialEntropy,
              stabilization: json.emotionalStabilization
            }];
            if (newHist.length > 20) newHist.shift();
            return newHist;
          });
        }
      } catch (e) {
        console.error("VR telemetry fetch failed", e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <div className="text-zinc-400 p-4">Establishing Meta Quest OpenXR Link...</div>;

  return (
    <div className="w-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium tracking-tight text-white flex items-center gap-2">
          <Glasses className="w-5 h-5 text-fuchsia-400" />
          Lucy VR Bridge Layer
        </h2>
        {data.sessionActive ? (
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-mono uppercase tracking-wider border border-emerald-500/30">
            <Activity className="w-3 h-3 animate-pulse" />
            OpenXR Session Active
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/20 text-rose-400 rounded-full text-xs font-mono uppercase tracking-wider border border-rose-500/30">
            Session Offline
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Spatial Pose */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-medium text-zinc-300">Headset Pose</h3>
            <Box className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="space-y-3 font-mono text-sm">
             <div className="flex justify-between items-center bg-zinc-950 p-2 rounded border border-zinc-800/50">
               <span className="text-zinc-500">X</span>
               <span className="text-cyan-400">{data.headset.x}</span>
             </div>
             <div className="flex justify-between items-center bg-zinc-950 p-2 rounded border border-zinc-800/50">
               <span className="text-zinc-500">Y</span>
               <span className="text-emerald-400">{data.headset.y}</span>
             </div>
             <div className="flex justify-between items-center bg-zinc-950 p-2 rounded border border-zinc-800/50">
               <span className="text-zinc-500">Z</span>
               <span className="text-indigo-400">{data.headset.z}</span>
             </div>
          </div>
        </div>

        {/* Inputs & Anchors */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-medium text-zinc-300">Tracking & Input</h3>
            <Hand className="w-4 h-4 text-purple-400" />
          </div>
          <div className="space-y-3 text-xs font-mono">
             <div>
                <span className="text-zinc-500 block mb-1">Left Hand Gesture</span>
                <div className="bg-zinc-950 p-2 rounded text-purple-400 border border-zinc-800/50 capitalize">
                    {data.hands.left}
                </div>
             </div>
             <div>
                <span className="text-zinc-500 block mb-1">Right Hand Gesture</span>
                <div className="bg-zinc-950 p-2 rounded text-purple-400 border border-zinc-800/50 capitalize">
                    {data.hands.right}
                </div>
             </div>
             <div>
                 <span className="text-zinc-500 block mb-1 flex items-center gap-1"><Anchor className="w-3 h-3"/> Active Anchors</span>
                 <div className="flex gap-1 flex-wrap">
                    {data.anchors.map(a => (
                        <span key={a} className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20">{a}</span>
                    ))}
                 </div>
             </div>
          </div>
        </div>

        {/* VR Safety & Emotonal Sync */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-medium text-zinc-300">Immersion Stability Fabric</h3>
            <Shield className="w-4 h-4 text-emerald-500" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="flex flex-col justify-center space-y-4">
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">Boundary Safety</span>
                        <span className={`font-mono ${data.boundarySafe ? 'text-emerald-400' : 'text-rose-500'}`}>{data.boundarySafe ? 'SAFE' : 'VIOLATION'}</span>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">Spatial Entropy</span>
                        <span className="font-mono text-orange-400">{(data.spatialEntropy * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-800">
                        <motion.div 
                        className="bg-orange-500 h-1.5 rounded-full" 
                        initial={{ width: 0 }}
                        animate={{ width: `${data.spatialEntropy * 100}%` }}
                        transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">Emma Emotion Sync</span>
                        <span className="font-mono text-cyan-400">{(data.emotionalStabilization * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-800">
                        <motion.div 
                        className="bg-cyan-500 h-1.5 rounded-full" 
                        initial={{ width: 0 }}
                        animate={{ width: `${data.emotionalStabilization * 100}%` }}
                        transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>
            </div>

            <div className="h-full bg-zinc-950 rounded-lg p-2 border border-zinc-800">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis stroke="#52525b" fontSize={10} domain={[0, 1]} tickFormatter={(val) => val.toFixed(1)} width={25} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', fontSize: '12px' }}
                        itemStyle={{ color: '#e4e4e7' }}
                    />
                    <Line type="monotone" dataKey="entropy" name="Entropy" stroke="#f97316" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="stabilization" name="Sync" stroke="#06b6d4" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Creative Divergence VR Spatial Map */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
         <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-fuchsia-400" />
            Creative Divergence Spawning Heatmap (VR Space)
         </h3>
         <div className="h-64 w-full bg-zinc-950 rounded-xl border border-zinc-800 p-2">
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis type="number" dataKey="x" name="X" domain={[-2, 2]} stroke="#52525b" />
                    <YAxis type="number" dataKey="y" name="Y" domain={[-2, 2]} stroke="#52525b" />
                    <ZAxis type="number" dataKey="intensity" range={[50, 400]} />
                    <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }} 
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', fontSize: '12px' }}
                    />
                    <Scatter name="Creative Nodes" data={data.creativeDivergenceHeatmap} fill="#d946ef" />
                </ScatterChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* VR Comfort & Motion Sickness Mitigation Rails */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          VR Comfort & Motion Sickness Mitigation Controls
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <span className="block text-zinc-400 font-bold mb-1">VIGNETTE SHIELD</span>
              <p className="text-[10px] text-zinc-600 mb-2">Reduces peripheral vision dynamically during high velocity motion.</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-500">ACTIVE</span>
              <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[10px]">Comfort level high</span>
            </div>
          </div>

          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <span className="block text-zinc-400 font-bold mb-1">HORIZON PITCH LOCK</span>
              <p className="text-[10px] text-zinc-600 mb-2">Stabilizes and locks the horizon line to prevent vestibular mismatch.</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-500">LOCKED</span>
              <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[10px]">Horizon stable</span>
            </div>
          </div>

          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <span className="block text-zinc-400 font-bold mb-1">TELEPORTATION GAIT</span>
              <p className="text-[10px] text-zinc-600 mb-2">Replaces continuous slide translation with parabolic teleportation arcs.</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-indigo-400">ARC ACTIVE</span>
              <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[10px]">Zero acceleration</span>
            </div>
          </div>

          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <span className="block text-zinc-400 font-bold mb-1">FRAME RATE BUFFER</span>
              <p className="text-[10px] text-zinc-600 mb-2">Forcibly locks render buffer rate to native refresh (90Hz / 120Hz).</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-500">90HZ MATCHED</span>
              <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[10px]">No latency lag</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
