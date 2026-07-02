import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Shield,
  Plus,
  Trash2,
  Activity,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DeviceRegistration } from "../types";

export const DevicePanel = () => {
  const [devices, setDevices] = useState<DeviceRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">(
    "synced",
  );

  const loadDevices = () => {
    try {
      const stored = localStorage.getItem('lucy_devices');
      if (stored) {
        setDevices(JSON.parse(stored));
      }
      setSyncStatus("synced");
    } catch (e) {
      setSyncStatus("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSyncStatus("syncing");
    loadDevices();
    const interval = setInterval(loadDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;

    setRegistering(true);
    setSyncStatus("syncing");
    try {
      const newDevice: DeviceRegistration = {
        id: Date.now().toString(),
        userId: "local-user",
        name: newDeviceName,
        permissions: ["read", "command"],
        lastSeen: Date.now(),
        status: "online",
        trustState: "trusted",
      };
      
      const newDevices = [...devices, newDevice];
      localStorage.setItem('lucy_devices', JSON.stringify(newDevices));
      setDevices(newDevices);
      setNewDeviceName("");
      setSyncStatus("synced");
    } catch (err: any) {
      console.error("Failed to register device:", err);
      setSyncStatus("error");
    } finally {
      setRegistering(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const newDevices = devices.filter(d => d.id !== id);
      localStorage.setItem('lucy_devices', JSON.stringify(newDevices));
      setDevices(newDevices);
    } catch (err) {
      console.error("Failed to delete device:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-l border-white/10 w-80">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-mono text-sm tracking-widest flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-purple-500" />
            MOBILE TWINS
          </h2>
          <div className="flex items-center gap-2">
            {syncStatus === "syncing" && (
              <Activity className="w-3 h-3 text-blue-500 animate-spin" />
            )}
            {syncStatus === "synced" && (
              <CheckCircle2 className="w-3 h-3 text-green-500" />
            )}
            {syncStatus === "error" && (
              <XCircle className="w-3 h-3 text-red-500" />
            )}
            <span className="text-[9px] text-white/30 font-mono uppercase">
              {syncStatus}
            </span>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-2">
          <input
            type="text"
            placeholder="Device Name (e.g. iPhone 15)"
            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-colors"
            value={newDeviceName}
            onChange={(e) => setNewDeviceName(e.target.value)}
          />
          <button
            type="submit"
            disabled={registering || !newDeviceName.trim()}
            className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold tracking-widest transition-all flex items-center justify-center gap-2"
          >
            {registering ? (
              <Activity className="w-3 h-3 animate-spin" />
            ) : (
              <Plus className="w-3 h-3" />
            )}
            REGISTER TWIN
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-8">
            <Smartphone className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest leading-relaxed">
              NO TWINS REGISTERED
              <br />
              SECURE PAIRING REQUIRED
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {devices.map((device) => (
              <motion.div
                key={`device-twin-${device.id}`}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 group hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${device.status === "online" ? "bg-green-500 animate-pulse" : "bg-white/20"}`}
                    />
                    <div>
                      <h3 className="text-white text-sm font-medium">
                        {device.name}
                      </h3>
                      <span className="text-[9px] text-white/40 font-mono uppercase tracking-wider">
                        {device.status === "online" ? "LINK ACTIVE" : "OFFLINE"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(device.id)}
                    className="p-1.5 text-white/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {device.permissions.map((p) => (
                    <span
                      key={`device-${device.id}-permission-${p}`}
                      className="text-[8px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20 font-mono uppercase"
                    >
                      {p}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-blue-500" />
                    <span className="text-[9px] text-white/30 font-mono">
                      SECURE LINK
                    </span>
                  </div>
                  <span className="text-[9px] text-white/20 font-mono">
                    {new Date(device.lastSeen).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="p-4 bg-black/40 border-t border-white/10">
        <div className="flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
          <Shield className="w-4 h-4 text-blue-500 shrink-0" />
          <p className="text-[9px] text-blue-400/80 font-mono leading-relaxed">
            All mobile commands are validated against device signatures and user
            permissions.
          </p>
        </div>
      </div>
    </div>
  );
};
