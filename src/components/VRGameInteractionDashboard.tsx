import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Gamepad2, Brain, Activity, Hand, Move, Cpu, HeartPulse } from 'lucide-react';
import { useNodeStore } from '../store/useNodeStore';

type VRGameTelemetry = {
  avatars: {
    lucy_mode: string;
    emma_mode: string;
    lucy_posture: string;
    emma_posture: string;
    lucy_expression: string;
    emma_expression: string;
  };
  last_interaction: {
    entity_id: string;
    action_type: string;
    target_object: string;
    physics_applied: boolean;
    npc_interaction: boolean;
    environment_modified: boolean;
    physics_calculations?: {
      grab_offset: { x: number, y: number, z: number };
      lift_force_newtons: number;
      torque_applied: { pitch: number, yaw: number, roll: number };
      stability: string;
      dynamic_mass_compensation: boolean;
    };
  };
  intelligence: {
    game_state_understood: boolean;
    npc_behavior_analysis: string;
    predicted_outcome: string;
    strategy_provided: string;
  };
  safety_rails_active: boolean;
};

export function VRGameInteractionDashboard() {
  const [data, setData] = useState<VRGameTelemetry | null>(null);
  const syncVRNodes = useNodeStore((state) => state.syncVRNodes);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/vr-game-telemetry");
        if (res.ok) {
          const json = await res.json();
          setData(json);
          // Standardize payload format for syncVRNodes
          syncVRNodes({
            headset: { x: 0, y: 1.6, z: 0 },
            hands: { left: 'open', right: 'pinch' },
            anchors: ['game_arena_anchor']
          });
        }
      } catch (e) {
        console.error("VR game telemetry fetch failed", e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <div className="text-zinc-400 p-4">Loading Dual VR Simulation Link...</div>;

  return (
    <div className="w-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium tracking-tight text-white flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-indigo-400" />
          Lucy & Emma VR Game Interaction Layer
        </h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-mono uppercase tracking-wider border border-emerald-500/30">
          <Activity className="w-3 h-3 animate-pulse" />
          Simulation Hook Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lucy Embodiment */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
               <Cpu className="w-4 h-4 text-cyan-400" />
               Lucy Embodiment (Creative/Analytic)
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded border border-cyan-500/20">{data.avatars.lucy_mode}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm font-mono">
             <div className="bg-zinc-950 p-2 rounded border border-zinc-800/50">
                <span className="block text-zinc-500 text-xs mb-1">Posture</span>
                <span className="text-zinc-300 capitalize">{data.avatars.lucy_posture}</span>
             </div>
             <div className="bg-zinc-950 p-2 rounded border border-zinc-800/50">
                <span className="block text-zinc-500 text-xs mb-1">Expression</span>
                <span className="text-cyan-400 capitalize">{data.avatars.lucy_expression}</span>
             </div>
          </div>
        </div>

        {/* Emma Embodiment */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
               <HeartPulse className="w-4 h-4 text-rose-400" />
               Emma Embodiment (Emotional/Companion)
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded border border-rose-500/20">{data.avatars.emma_mode}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm font-mono">
             <div className="bg-zinc-950 p-2 rounded border border-zinc-800/50">
                <span className="block text-zinc-500 text-xs mb-1">Posture</span>
                <span className="text-zinc-300 capitalize">{data.avatars.emma_posture}</span>
             </div>
             <div className="bg-zinc-950 p-2 rounded border border-zinc-800/50">
                <span className="block text-zinc-500 text-xs mb-1">Expression</span>
                <span className="text-rose-400 capitalize">{data.avatars.emma_expression}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
         {/* VR Interaction Stream */}
         <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
               <h3 className="text-sm font-medium text-zinc-300">Live Spatial Interaction</h3>
               <Hand className="w-4 h-4 text-purple-400" />
            </div>
            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-2">
               <div className="flex justify-between items-center text-sm font-mono">
                  <span className="text-zinc-500">Entity Initiator</span>
                  <span className={`px-2 py-0.5 rounded capitalize ${data.last_interaction.entity_id === 'lucy' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-rose-500/10 text-rose-400'}`}>
                     {data.last_interaction.entity_id}
                  </span>
               </div>
               <div className="flex justify-between items-center text-sm font-mono">
                  <span className="text-zinc-500">Action Matrix</span>
                  <span className="text-purple-400 capitalize">{data.last_interaction.action_type.replace('_', ' ')}</span>
               </div>
               <div className="flex justify-between items-center text-sm font-mono">
                  <span className="text-zinc-500">Target Object</span>
                  <span className="text-zinc-300">{data.last_interaction.target_object}</span>
               </div>
            </div>
            
            <div className="flex gap-2 flex-wrap text-xs font-mono">
               <div className={`px-2 py-1 rounded border ${data.last_interaction.physics_applied ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                  Physics Sync
               </div>
               <div className={`px-2 py-1 rounded border ${data.last_interaction.npc_interaction ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                  NPC Link
               </div>
               <div className={`px-2 py-1 rounded border ${data.last_interaction.environment_modified ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                  Env Modified
               </div>
            </div>

            {data.last_interaction.physics_calculations && (
                <div className="mt-4 pt-4 border-t border-zinc-800/50 space-y-3">
                    <h4 className="text-xs font-medium text-zinc-400 flex items-center gap-2">
                        Dynamic Physics Hook Active
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${data.last_interaction.physics_calculations.stability === 'stable' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {data.last_interaction.physics_calculations.stability.toUpperCase()}
                        </span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="bg-zinc-950 p-2 rounded border border-zinc-800/50">
                            <span className="block text-zinc-500 mb-1">Lift Force</span>
                            <span className="text-indigo-400">{Number(data.last_interaction.physics_calculations.lift_force_newtons).toFixed(1)} N</span>
                        </div>
                        <div className="bg-zinc-950 p-2 rounded border border-zinc-800/50">
                            <span className="block text-zinc-500 mb-1">Mass Comp</span>
                            <span className="text-emerald-400">{data.last_interaction.physics_calculations.dynamic_mass_compensation ? 'ACTIVE' : 'OFF'}</span>
                        </div>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800/50 text-xs font-mono">
                        <span className="block text-zinc-500 mb-1">Applied Torque (P/Y/R)</span>
                        <div className="flex gap-3 text-purple-400">
                            <span>{Number(data.last_interaction.physics_calculations.torque_applied.pitch).toFixed(1)}</span>
                            <span>{Number(data.last_interaction.physics_calculations.torque_applied.yaw).toFixed(1)}</span>
                            <span>{Number(data.last_interaction.physics_calculations.torque_applied.roll).toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            )}
         </div>

         {/* Game Intelligence */}
         <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
               <h3 className="text-sm font-medium text-zinc-300">Game Intelligence & Strategy</h3>
               <Brain className="w-4 h-4 text-fuchsia-400" />
            </div>
            <div className="space-y-4 text-sm">
               <div>
                  <span className="block text-xs font-mono text-zinc-500 mb-1">NPC Behavior Analysis</span>
                  <p className="text-zinc-300 bg-zinc-950 p-2 rounded border border-zinc-800/50">{data.intelligence.npc_behavior_analysis}</p>
               </div>
               <div>
                  <span className="block text-xs font-mono text-zinc-500 mb-1">Predicted Simulation Outcome</span>
                  <p className="text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">{data.intelligence.predicted_outcome}</p>
               </div>
               <div>
                  <span className="block text-xs font-mono text-zinc-500 mb-1">AI Strategy Guidance</span>
                  <p className="text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">{data.intelligence.strategy_provided}</p>
               </div>
            </div>
         </div>
      </div>
      
    </div>
  );
}
