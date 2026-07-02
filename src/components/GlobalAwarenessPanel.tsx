import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  AlertTriangle,
  Activity,
  MapPin,
  ExternalLink,
  Radio,
} from "lucide-react";
import { io } from "socket.io-client";

interface WorldEvent {
  id: string;
  title: string;
  type: string; // disaster | earthquake
  severity: string;
  country: string;
  link: string;
  pubDate: string;
  source: string;
}

export function GlobalAwarenessPanel() {
  const [events, setEvents] = useState<WorldEvent[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io();

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on(
      "liveWorldData",
      (data: { timestamp: number; events: WorldEvent[] }) => {
        setEvents(data.events);
        setLastUpdate(data.timestamp);
      },
    );

    return () => {
      socket.off("liveWorldData");
      socket.disconnect();
    };
  }, []);

  const getSeverityColor = (severity: string) => {
    const s = severity.toLowerCase();
    if (s.includes("high") || s.includes("red") || s.includes("severe"))
      return "text-red-400 bg-red-500/10 border-red-500/30";
    if (s.includes("medium") || s.includes("orange"))
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    if (s.includes("low") || s.includes("green"))
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    return "text-blue-400 bg-blue-500/10 border-blue-500/30";
  };

  return (
    <div className="h-full flex flex-col p-6 bg-[#030303] overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.05),transparent)] pointer-events-none" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            <Globe className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
              Global Awareness Engine
              <span
                className={`px-2 py-0.5 rounded-full border text-[9px] font-mono uppercase tracking-widest flex items-center gap-1 ${isConnected ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-red-500/20 border-red-500/30 text-red-400"}`}
              >
                {isConnected ? (
                  <Activity className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                {isConnected ? "LIVE FEED" : "OFFLINE"}
              </span>
            </h2>
            <p className="text-white/40 text-xs font-mono uppercase tracking-widest mt-1">
              Factual Real-World Event Telemetry (GDACS & USGS)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-white/40">
          <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
          Last sync: {new Date(lastUpdate).toLocaleTimeString()}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 relative z-10 space-y-4">
        <AnimatePresence>
          {events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-64 flex flex-col items-center justify-center text-white/30 font-mono text-xs uppercase tracking-widest"
            >
              <Globe className="w-12 h-12 mb-4 opacity-50 animate-pulse" />
              Waiting for global event propagation...
            </motion.div>
          ) : (
            events.map((event, i) => (
              <motion.div
                key={event.id + i}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest ${getSeverityColor(event.severity)}`}
                      >
                        {event.severity} SEVERITY
                      </span>
                      <span className="text-[10px] text-white/50 font-mono uppercase tracking-widest flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {event.country}
                      </span>
                      <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest">
                        {event.source}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2 leading-relaxed">
                      {event.title}
                    </h3>
                    <p className="text-[10px] text-white/40 font-mono">
                      {new Date(event.pubDate).toLocaleString()}
                    </p>
                  </div>

                  {event.link && (
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-all ml-4 shrink-0 border border-white/5"
                      title="View primary source"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
