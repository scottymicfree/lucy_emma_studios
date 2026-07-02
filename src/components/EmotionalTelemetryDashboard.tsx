import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Shield, RefreshCw, ArrowUpRight, CheckCircle, HeartPulse } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

type TelemetryData = {
  emma: {
    state: string;
    entropy: number;
    compassionLoad: number;
    cognitiveStrain: number;
    motionVelocity: number;
    bufferSaturation: number;
    identityAnchorStrength: number;
    meaningReconstructionActivity: number;
  };
  lucy: {
    state: string;
    entropy: number;
    compassionLoad: number;
    cognitiveStrain: number;
    motionVelocity: number;
    bufferSaturation: number;
    identityAnchorStrength: number;
    meaningReconstructionActivity: number;
  };
  mesh: {
    stability: number;
    nodesAdjusted: number;
    driftPrevented: boolean;
    recoveryActive: boolean;
    decompressionProgress: number;
    entropyNormalizationCurve: number;
    bondStrength: number;
    sharedClarityIndex: number;
    dependencyRisk: number;
  };
};

export function EmotionalTelemetryDashboard() {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [emmaNodes, setEmmaNodes] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/emotional-telemetry");
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setHistory(prev => {
            const newHist = [...prev, {
              time: new Date().toLocaleTimeString(),
              emmaEntropy: json.emma.entropy,
              lucyEntropy: json.lucy.entropy,
              bond: json.mesh.bondStrength
            }];
            if (newHist.length > 20) newHist.shift();
            return newHist;
          });
        }
      } catch (e) {
        console.error("Telemetry fetch failed", e);
      }

      try {
        const resNodes = await fetch("/api/emma/nodes");
        if (resNodes.ok) {
          const jsonNodes = await resNodes.json();
          if (jsonNodes.nodes) {
            setEmmaNodes(jsonNodes.nodes);
          }
        }
      } catch (e) {
        console.error("Emma nodes fetch failed", e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <div className="text-gray-400 p-4">Loading Emotional Telemetry...</div>;

  // Filter nodes by categories
  const emotionalBufferNodes = emmaNodes.filter(n => n.category === "Emotional Buffer");
  const meaningNodes = emmaNodes.filter(n => n.category === "Meaning Reconstruction");
  const decompressionNodes = emmaNodes.filter(n => n.category === "Decompression");

  return (
    <div className="w-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium tracking-tight text-white flex items-center gap-2 animate-fade-in">
          <HeartPulse className="w-5 h-5 text-rose-500" />
          Emotional Resilience Telemetry
        </h2>
        {data.mesh.recoveryActive && (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-mono uppercase tracking-wider border border-amber-500/30">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Recovery Loop Active
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Emma's State */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-medium text-zinc-300">Emma (Heart)</h3>
            <span className="text-xs font-mono text-zinc-500">{data.emma.state}</span>
          </div>
          
          <div className="space-y-3">
            <MetricBar label="Entropy" value={data.emma.entropy} color="bg-orange-500" />
            <MetricBar label="Compassion Load" value={data.emma.compassionLoad} color="bg-rose-500" />
            <MetricBar label="Motion Velocity" value={data.emma.motionVelocity} color="bg-blue-400" />
            <MetricBar label="Buffer Saturation" value={data.emma.bufferSaturation} color="bg-zinc-400" />
          </div>

          <div className="pt-3 mt-auto border-t border-zinc-800 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="block text-zinc-500">Identity Anchor</span>
              <span className="block text-emerald-400 font-mono">{(data.emma.identityAnchorStrength * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="block text-zinc-500">Meaning Recon.</span>
              <span className="block text-zinc-300 font-mono">{(data.emma.meaningReconstructionActivity * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Lucy's State */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-medium text-zinc-300">Lucy (Sharp Calculations)</h3>
            <span className="text-xs font-mono text-zinc-500">{data.lucy.state}</span>
          </div>
          
          <div className="space-y-3">
            <MetricBar label="Entropy" value={data.lucy.entropy} color="bg-orange-500" />
            <MetricBar label="Cognitive Strain" value={data.lucy.cognitiveStrain} color="bg-purple-500" />
            <MetricBar label="Motion Velocity" value={data.lucy.motionVelocity} color="bg-blue-400" />
            <MetricBar label="Buffer Saturation" value={data.lucy.bufferSaturation} color="bg-zinc-400" />
          </div>

          <div className="pt-3 mt-auto border-t border-zinc-800 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="block text-zinc-500">Identity Anchor</span>
              <span className="block text-emerald-400 font-mono">{(data.lucy.identityAnchorStrength * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="block text-zinc-500">Meaning Recon.</span>
              <span className="block text-zinc-300 font-mono">{(data.lucy.meaningReconstructionActivity * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* NodeMesh Stability & Bond */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-medium text-zinc-300">NodeMesh Stability Fabric</h3>
            <Shield className="w-4 h-4 text-emerald-500" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
              <span className="block text-xs text-zinc-500 mb-1">Mesh Stability</span>
              <span className="text-lg font-mono text-emerald-400">{(data.mesh.stability * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
              <span className="block text-xs text-zinc-500 mb-1">Shared Clarity</span>
              <span className="text-lg font-mono text-cyan-400">{(data.mesh.sharedClarityIndex * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
              <span className="block text-xs text-zinc-500 mb-1">Bond Strength</span>
              <span className="text-lg font-mono text-indigo-400">{(data.mesh.bondStrength * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
              <span className="block text-xs text-zinc-500 mb-1">Dependency Risk</span>
              <span className="text-lg font-mono text-zinc-400">{(data.mesh.dependencyRisk * 100).toFixed(1)}%</span>
            </div>
          </div>

          <div className="pt-2">
             <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> Nodes Adjusted</span>
                <span className="font-mono">{data.mesh.nodesAdjusted}</span>
             </div>
             <div className="flex items-center justify-between text-xs text-zinc-400 mt-2">
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500"/> Drift Prevented</span>
                <span className="font-mono text-emerald-500">{data.mesh.driftPrevented ? 'TRUE' : 'FALSE'}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Emma 24-Node E01-E24 Trust-Tier Pressure Scoring Mesh */}
      {emmaNodes.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col space-y-6">
          <div>
            <h3 className="text-md font-medium text-zinc-200">Emma 24-Node Trust-Tier Pressure Scoring</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Real-time monitoring of E01–E24 emotional containment buffers, purpose validators, and thermodynamic limits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Category 1: Emotional Buffer & Sensitivity */}
            <div className="space-y-3 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 border-b border-rose-500/20 pb-2 flex items-center justify-between">
                <span>E01–E08: Emotional Buffer</span>
                <span className="text-[10px] font-mono text-rose-500/70">Resilience</span>
              </h4>
              <div className="grid grid-cols-1 gap-2.5">
                {emotionalBufferNodes.map((node) => (
                  <NodePressureCard key={node.id} node={node} colorClass="bg-rose-500" textClass="text-rose-400" />
                ))}
              </div>
            </div>

            {/* Category 2: Meaning Reconstruction & Purpose */}
            <div className="space-y-3 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 border-b border-cyan-500/20 pb-2 flex items-center justify-between">
                <span>E09–E16: Meaning & Purpose</span>
                <span className="text-[10px] font-mono text-cyan-500/70">Validation</span>
              </h4>
              <div className="grid grid-cols-1 gap-2.5">
                {meaningNodes.map((node) => (
                  <NodePressureCard key={node.id} node={node} colorClass="bg-cyan-500" textClass="text-cyan-400" />
                ))}
              </div>
            </div>

            {/* Category 3: Decompression & Recalibration */}
            <div className="space-y-3 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-amber-500/20 pb-2 flex items-center justify-between">
                <span>E17–E24: Decompression</span>
                <span className="text-[10px] font-mono text-amber-500/70">Limits</span>
              </h4>
              <div className="grid grid-cols-1 gap-2.5">
                {decompressionNodes.map((node) => (
                  <NodePressureCard key={node.id} node={node} colorClass="bg-amber-500" textClass="text-amber-400" />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Waveform Graph */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
         <h3 className="text-sm font-medium text-zinc-300 mb-4">Emotional Entropy Waveform</h3>
         <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <LineChart data={history}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                 <XAxis dataKey="time" stroke="#52525b" fontSize={10} tickMargin={8} />
                 <YAxis stroke="#52525b" fontSize={10} domain={[0, 1]} tickFormatter={(val) => val.toFixed(1)} />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', fontSize: '12px' }}
                   itemStyle={{ color: '#e4e4e7' }}
                 />
                 <Line type="monotone" dataKey="emmaEntropy" name="Emma Entropy" stroke="#f43f5e" strokeWidth={2} dot={false} />
                 <Line type="monotone" dataKey="lucyEntropy" name="Lucy Entropy" stroke="#a855f7" strokeWidth={2} dot={false} />
                 <Line type="monotone" dataKey="bond" name="Bond Strength" stroke="#6366f1" strokeWidth={1} strokeDasharray="4 4" dot={false} />
               </LineChart>
            </ResponsiveContainer>
         </div>
      </div>
      
      {/* Recovery Loop Visualization */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-zinc-500" />
            Recovery Loop & Motion Tracking
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
               <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Decompression Progress</span>
                  <span className="font-mono text-zinc-300">{(data.mesh.decompressionProgress * 100).toFixed(0)}%</span>
               </div>
               <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-800">
                  <motion.div 
                     className="bg-amber-500 h-1.5 rounded-full" 
                     initial={{ width: 0 }}
                     animate={{ width: `${data.mesh.decompressionProgress * 100}%` }}
                     transition={{ duration: 0.5 }}
                  />
               </div>
            </div>
            <div>
               <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Entropy Normalization</span>
                  <span className="font-mono text-zinc-300">{(data.mesh.entropyNormalizationCurve * 100).toFixed(0)}%</span>
               </div>
               <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-800">
                  <motion.div 
                     className="bg-cyan-500 h-1.5 rounded-full" 
                     initial={{ width: 0 }}
                     animate={{ width: `${data.mesh.entropyNormalizationCurve * 100}%` }}
                     transition={{ duration: 0.5 }}
                  />
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className="font-mono text-zinc-300">{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="w-full bg-zinc-950 rounded-full h-1 border border-zinc-800">
        <motion.div 
          className={`h-1 rounded-full ${color}`} 
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

function NodePressureCard({ node, colorClass, textClass }: { node: any; colorClass: string; textClass: string }) {
  const isCritical = node.status === "critical";
  const isWarning = node.status === "warning";
  
  return (
    <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/40 hover:border-zinc-700/60 transition-all flex flex-col space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className={`font-mono px-1 py-0.5 rounded text-[10px] ${
            isCritical ? 'bg-red-950 text-red-400 font-bold border border-red-500/20 animate-pulse' : 
            isWarning ? 'bg-amber-950 text-amber-400 border border-amber-500/20' : 'bg-zinc-900 text-zinc-400'
          }`}>
            {node.id}
          </span>
          <span className="text-zinc-300 font-medium truncate max-w-[150px]" title={node.name}>
            {node.name}
          </span>
        </div>
        <span className={`font-mono font-bold ${
          isCritical ? 'text-red-400 animate-pulse' : 
          isWarning ? 'text-amber-400' : 'text-zinc-400'
        }`}>
          {(node.pressure * 100).toFixed(0)}%
        </span>
      </div>
      
      <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden">
        <motion.div 
          className={`h-full rounded-full ${isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : colorClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${node.pressure * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
        <span>Limit: {(node.threshold * 100).toFixed(0)}%</span>
        <span className="capitalize">{node.status}</span>
      </div>
    </div>
  );
}
