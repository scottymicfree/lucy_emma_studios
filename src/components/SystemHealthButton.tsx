/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Database,
  Wifi,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export const SystemHealthButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.warn("Failed to fetch health (server may be starting):", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  const StatusRow = ({ icon: Icon, label, status, color }: any) => (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2">
        <Icon className="w-3 h-3 text-white/40" />
        <span className="text-[10px] text-white/60 font-mono uppercase tracking-widest">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <div
          className={`w-1.5 h-1.5 rounded-full ${color} shadow-[0_0_8px_currentColor]`}
        />
        <span className={`text-[10px] font-mono font-bold uppercase ${color}`}>
          {status}
        </span>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border ${
          isOpen
            ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
            : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
        }`}
      >
        <Activity className={`w-3.5 h-3.5 ${loading ? "animate-pulse" : ""}`} />
        <span className="text-[10px] font-bold tracking-widest uppercase">
          Health
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-64 bg-[#0f0f0f] border border-white/10 rounded-xl shadow-2xl p-4 z-50 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] text-white/40 font-mono uppercase tracking-widest font-bold">
                  System Status
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchHealth();
                  }}
                  className={`p-1 rounded-lg hover:bg-white/5 transition-colors ${loading ? "animate-spin" : ""}`}
                >
                  <RefreshCw className="w-3 h-3 text-white/40" />
                </button>
              </div>

              {loading && !health ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[9px] text-white/20 font-mono uppercase tracking-widest">
                    Scanning...
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <StatusRow
                    icon={Wifi}
                    label="WebSocket"
                    status={health?.persistentConnection || "UNKNOWN"}
                    color={
                      health?.persistentConnection === "active"
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  />
                  <StatusRow
                    icon={Database}
                    label="Database"
                    status={health?.database || "OFFLINE"}
                    color={
                      health?.database === "healthy"
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  />
                  <StatusRow
                    icon={ShieldCheck}
                    label="API Health"
                    status={health?.api || "ERROR"}
                    color={
                      health?.api === "healthy"
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  />
                  <StatusRow
                    icon={CheckCircle2}
                    label="Runtime"
                    status={
                      health?.runtimeInitialized === "true"
                        ? "READY"
                        : "WAITING"
                    }
                    color={
                      health?.runtimeInitialized === "true"
                        ? "text-blue-500"
                        : "text-amber-500"
                    }
                  />
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between text-[8px] text-white/20 font-mono uppercase tracking-widest">
                  <span>Last Scan</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
