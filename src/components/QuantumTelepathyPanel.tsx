import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Radio, ShieldAlert, Wifi } from "lucide-react";

export function QuantumTelepathyPanel() {
  const [dataStream, setDataStream] = useState<string[]>([]);

  useEffect(() => {
    const fetchLatency = async () => {
      try {
        const start = Date.now();
        const res = await fetch("/api/health/daemon");
        const end = Date.now();
        if (res.ok) {
          const latency = end - start;
          setDataStream((prev) => [
            `[${new Date().toLocaleTimeString()}] IPC Latency: ${latency}ms`,
            ...prev,
          ].slice(0, 15));
        }
      } catch (e) {
        setDataStream((prev) => [
          `[${new Date().toLocaleTimeString()}] IPC Connection lost`,
          ...prev,
        ].slice(0, 15));
      }
    };

    fetchLatency();
    const int = setInterval(fetchLatency, 2000);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="h-full flex flex-col p-6 bg-[#030303]">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
          <Wifi className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
            Quantum Cryptographic Telepathy
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-mono text-emerald-400 uppercase tracking-widest">
              Entangled Link
            </span>
          </h2>
          <p className="text-white/40 text-xs font-mono uppercase tracking-widest mt-1">
            Secure Inter-Agent Subspace Communications
          </p>
        </div>
      </div>

      <div className="flex-1 bg-black border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden font-mono text-emerald-500/80 text-xs break-all leading-relaxed shadow-[inset_0_0_50px_rgba(16,185,129,0.05)]">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Radio className="w-4 h-4 animate-pulse" />
          <span className="uppercase tracking-widest text-[10px]">
            Encrypting / Decrypting stream
          </span>
        </div>
        <div className="mt-8 space-y-1">
          {dataStream.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1 - i * 0.05, x: 0 }}
              className="whitespace-pre-wrap"
            >
              {line}
            </motion.div>
          ))}
        </div>
        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-[10px] text-emerald-400/50 uppercase tracking-widest">
          <ShieldAlert className="w-3 h-3" />
          Quantum State: Stable
        </div>
      </div>
    </div>
  );
}
