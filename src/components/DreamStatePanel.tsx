import React, { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import { Moon, Sparkles, Activity } from "lucide-react";

export function DreamStatePanel() {
  const [nodes, setNodes] = useState<
    { id: number; x: number; y: number; r: number; c: string }[]
  >([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate some random "memory" nodes for the dream state visualization
    const generateNodes = () => {
      const newNodes = [];
      for (let i = 0; i < 20; i++) {
        newNodes.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          r: Math.random() * 20 + 5,
          c: ["#8b5cf6", "#3b82f6", "#14b8a6", "#ec4899"][
            Math.floor(Math.random() * 4)
          ],
        });
      }
      setNodes(newNodes);
    };
    generateNodes();
    const interval = setInterval(generateNodes, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col p-6 bg-[#030303] overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-[#030303] pointer-events-none z-0" />

      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
          <Moon className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
            Neuromorphic Dream State
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-[9px] font-mono text-purple-400 uppercase tracking-widest flex items-center gap-1">
              <Activity className="w-3 h-3" /> Auto-Consolidating
            </span>
          </h2>
          <p className="text-white/40 text-xs font-mono uppercase tracking-widest mt-1">
            Latent Space Memory Replay & Synthesis
          </p>
        </div>
      </div>

      <div
        className="flex-1 relative z-10 border border-white/5 rounded-2xl bg-black/40 overflow-hidden backdrop-blur-sm flex items-center justify-center"
        ref={canvasRef}
      >
        {/* Render dream nodes morphing */}
        {nodes.map((node, i) => (
          <motion.div
            key={node.id}
            initial={{
              opacity: 0,
              x: `${Math.random() * 100}%`,
              y: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 0.5, 0],
              x: `${node.x}%`,
              y: `${node.y}%`,
              scale: [1, 1.5, 1],
              filter: ["blur(10px)", "blur(2px)", "blur(10px)"],
            }}
            transition={{
              duration: 4,
              ease: "easeInOut",
              repeat: Infinity,
              delay: i * 0.2,
            }}
            className="absolute rounded-full pointer-events-none mix-blend-screen"
            style={{
              width: node.r * 2,
              height: node.r * 2,
              backgroundColor: node.c,
              boxShadow: `0 0 ${node.r * 2}px ${node.c}`,
            }}
          />
        ))}

        <div className="absolute bottom-6 text-center w-full">
          <p className="text-purple-400/50 font-mono text-xs tracking-widest uppercase mb-1">
            Synthesizing conceptual intersections...
          </p>
          <div className="w-64 h-1 bg-white/5 mx-auto rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-purple-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
