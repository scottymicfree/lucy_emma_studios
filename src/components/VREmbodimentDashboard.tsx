import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Eye, Layers, Mic, Fingerprint, Activity, ActivitySquare, Move, Smile } from 'lucide-react';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { useNodeStore } from '../store/useNodeStore';

type EmbodimentTelemetry = {
  avatar: {
    bodyType: string;
    style: string;
    mode: string;
  };
  state: {
    mode: string;
    posture: string;
    energyLevel: number;
    emotionalSync: number;
    creativeSync: number;
  };
  motion: {
    headTracking: boolean;
    handTracking: boolean;
    facialExpression: string;
    currentGesture: string;
  };
  interaction: {
    activeObjects: string[];
    timelineVisible: boolean;
    divergenceMapDrawn: boolean;
    highlightedNodes: string[];
  };
  voice: {
    lipSyncActive: boolean;
    tone: string;
  };
  safetyStatus: string;
};

export function VREmbodimentDashboard() {
  const [data, setData] = useState<EmbodimentTelemetry | null>(null);
  const syncVRNodes = useNodeStore((state) => state.syncVRNodes);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/vr-embodiment-telemetry");
        if (res.ok) {
          const json = await res.json();
          setData(json);
          syncVRNodes(json);
        }
      } catch (e) {
        console.error("VR embodiment telemetry fetch failed", e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <div className="text-zinc-400 p-4">Loading Lucy VR Embodiment...</div>;

  const radarData = [
    { subject: 'Energy', A: data.state.energyLevel * 100, fullMark: 100 },
    { subject: 'Emotion Sync', A: data.state.emotionalSync * 100, fullMark: 100 },
    { subject: 'Creative Sync', A: data.state.creativeSync * 100, fullMark: 100 },
    { subject: 'Lip Sync Activity', A: data.voice.lipSyncActive ? 90 : 30, fullMark: 100 },
    { subject: 'Spatial Interaction', A: data.interaction.activeObjects.length * 30 + 10, fullMark: 100 }
  ];

  return (
    <div className="w-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium tracking-tight text-white flex items-center gap-2">
          <User className="w-5 h-5 text-teal-400" />
          Lucy VR Avatar Embodiment
        </h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-teal-500/20 text-teal-400 rounded-full text-xs font-mono uppercase tracking-wider border border-teal-500/30">
          Mode: {data.state.mode}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Avatar Profile */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-medium text-zinc-300">Avatar Core Profile</h3>
            <Fingerprint className="w-4 h-4 text-cyan-400" />
          </div>
          
          <div className="space-y-3">
             <div>
                <span className="block text-xs text-zinc-500 mb-1">Body Type</span>
                <span className="font-mono text-sm text-zinc-300 capitalize">{data.avatar.bodyType.replace('_', ' ')}</span>
             </div>
             <div>
                <span className="block text-xs text-zinc-500 mb-1">Style</span>
                <span className="font-mono text-sm text-zinc-300 capitalize">{data.avatar.style.replace(/_/g, ' ')}</span>
             </div>
             <div>
                <span className="block text-xs text-zinc-500 mb-1">Current Posture</span>
                <span className="font-mono text-sm text-teal-400 capitalize">{data.state.posture}</span>
             </div>
          </div>
        </div>

        {/* Motion & Expression */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-medium text-zinc-300">Motion & Expression</h3>
            <Smile className="w-4 h-4 text-yellow-400" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
               <span className="block text-xs text-zinc-500 mb-1">Facial Expression</span>
               <span className="text-sm font-mono text-yellow-400 capitalize">{data.motion.facialExpression}</span>
             </div>
             <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
               <span className="block text-xs text-zinc-500 mb-1">Active Gesture</span>
               <span className="text-sm font-mono text-purple-400 capitalize">{data.motion.currentGesture.replace(/_/g, ' ')}</span>
             </div>
          </div>
          
          <div className="flex gap-4 pt-2">
             <div className="flex items-center gap-1.5 text-xs">
                <div className={`w-2 h-2 rounded-full ${data.motion.headTracking ? 'bg-emerald-500' : 'bg-zinc-600'}`}></div>
                <span className="text-zinc-400">Head Tracking</span>
             </div>
             <div className="flex items-center gap-1.5 text-xs">
                <div className={`w-2 h-2 rounded-full ${data.motion.handTracking ? 'bg-emerald-500' : 'bg-zinc-600'}`}></div>
                <span className="text-zinc-400">Hand Tracking</span>
             </div>
          </div>
        </div>

        {/* Voice Integration */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-medium text-zinc-300">Voice Presence</h3>
            <Mic className="w-4 h-4 text-rose-400" />
          </div>
          
          <div className="flex flex-col items-center justify-center h-full space-y-4">
             <div className="relative">
                <Mic className={`w-10 h-10 ${data.voice.lipSyncActive ? 'text-rose-500' : 'text-zinc-600'}`} />
                {data.voice.lipSyncActive && (
                    <motion.div 
                        className="absolute inset-0 border-2 border-rose-500 rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                )}
             </div>
             <div className="text-center">
                 <span className="block text-xs text-zinc-500">Tone Modulation</span>
                 <span className="font-mono text-lg text-rose-400 capitalize">{data.voice.tone}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Spatial Interaction State */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-medium text-zinc-300">Spatial Interaction</h3>
                <Move className="w-4 h-4 text-indigo-400" />
              </div>
              
              <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm font-mono">
                      <span className="text-zinc-500">Active Objects</span>
                      <span className="text-indigo-400">{data.interaction.activeObjects.length}</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                      {data.interaction.activeObjects.map(obj => (
                          <span key={obj} className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded border border-indigo-500/20">{obj}</span>
                      ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-zinc-800/50">
                      <div className="flex flex-col gap-1">
                          <span className="text-xs text-zinc-500">Timeline Visibility</span>
                          <span className={`text-sm font-mono ${data.interaction.timelineVisible ? 'text-emerald-400' : 'text-zinc-500'}`}>
                              {data.interaction.timelineVisible ? 'VISIBLE' : 'HIDDEN'}
                          </span>
                      </div>
                      <div className="flex flex-col gap-1">
                          <span className="text-xs text-zinc-500">Divergence Map</span>
                          <span className={`text-sm font-mono ${data.interaction.divergenceMapDrawn ? 'text-fuchsia-400' : 'text-zinc-500'}`}>
                              {data.interaction.divergenceMapDrawn ? 'DRAWN IN SPACE' : 'INACTIVE'}
                          </span>
                      </div>
                  </div>
              </div>
          </div>
          
          {/* Embodiment Radar Chart */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-2">
                <h3 className="text-sm font-medium text-zinc-300">Embodiment State Matrix</h3>
                <ActivitySquare className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#27272a" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Lucy State" dataKey="A" stroke="#2dd4bf" fill="#2dd4bf" fillOpacity={0.4} />
                    </RadarChart>
                </ResponsiveContainer>
              </div>
          </div>
      </div>
      
    </div>
  );
}
