/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Terminal,
  Wifi,
  WifiOff,
  Shield,
  Lock,
  Database,
  Activity,
  Zap,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Cpu,
  Sliders,
} from "lucide-react";
import { useNodeStore } from "../store/useNodeStore";
import { ControlMode } from "../types";

export const DiagnosticsPanel = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const nodes = useNodeStore((state) => state.nodes);
  const throttling = useNodeStore((state) => state.throttling);
  const servers = useNodeStore((state) => state.servers);
  const controlMode = useNodeStore((state) => state.controlMode);
  const setControlMode = useNodeStore((state) => state.setControlMode);
  const visualSettings = useNodeStore((state) => state.visualSettings);
  const updateVisualSettings = useNodeStore(
    (state) => state.updateVisualSettings,
  );

  // Local Sovereign States
  const [localUrl, setLocalUrl] = useState("http://127.0.0.1:11434/v1/chat/completions");
  const [localModel, setLocalModel] = useState("local-llama-3-8b-instruct");
  const [mediaPipeline, setMediaPipeline] = useState("Stable Diffusion XL (Local ComfyUI)");
  const [configSaving, setConfigSaving] = useState(false);
  const [localStatus, setLocalStatus] = useState<"CONNECTED" | "DISCONNECTED" | "TESTING" | "IDLE">("IDLE");
  const [latencyText, setLatencyText] = useState("");

  const lpNode = nodes.find((n) => n.id === "CN-001" || n.id === "LP1");
  const wsStatus = lpNode?.lastPayload?.wsStatus || "UNKNOWN";

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

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/local-llama/config");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setLocalUrl(data.url || "");
          setLocalModel(data.model || "");
          setMediaPipeline(data.mediaPipeline || "");
        }
      }
    } catch (e) {
      console.warn("Failed to load local config:", e);
    }
  };

  const saveConfig = async () => {
    setConfigSaving(true);
    try {
      const res = await fetch("/api/local-llama/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: localUrl,
          model: localModel,
          mediaPipeline: mediaPipeline,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        console.log("Local config updated:", data);
      }
    } catch (err) {
      console.error("Failed to save local config:", err);
    } finally {
      setConfigSaving(false);
    }
  };

  const testLocalInference = async () => {
    setLocalStatus("TESTING");
    setLatencyText("");
    const startTime = Date.now();
    try {
      const res = await fetch("/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: localModel,
          messages: [{ role: "user", content: "ping" }],
        })
      });
      const duration = Date.now() - startTime;
      if (res.ok) {
        const data = await res.json();
        if (data.choices && data.choices[0]) {
          setLocalStatus("CONNECTED");
          setLatencyText(`${duration}ms`);
        } else {
          setLocalStatus("DISCONNECTED");
          setLatencyText("Malformed reply");
        }
      } else {
        setLocalStatus("DISCONNECTED");
        setLatencyText(`HTTP ${res.status}`);
      }
    } catch (err) {
      setLocalStatus("DISCONNECTED");
      setLatencyText("Network Offline");
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchConfig();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const StatusItem = ({ label, status, icon: Icon, isWarning }: any) => (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${
            isWarning
              ? "bg-amber-500/10 text-amber-500"
              : status === "healthy" ||
                  status === "ready" ||
                  status === "active" ||
                  status === "OPEN" ||
                  status === "true" ||
                  status === "online" ||
                  status === "INACTIVE"
                ? "bg-green-500/10 text-green-500"
                : "bg-red-500/10 text-red-500"
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[10px] text-white font-mono uppercase tracking-widest">
          {label}
        </span>
      </div>
      <span
        className={`text-[10px] font-mono font-bold ${
          isWarning
            ? "text-amber-500"
            : status === "healthy" ||
                status === "ready" ||
                status === "active" ||
                status === "OPEN" ||
                status === "true" ||
                status === "online" ||
                status === "INACTIVE"
              ? "text-green-500"
              : "text-red-500"
        }`}
      >
        {status}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-l border-white/10 w-80">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-white font-mono text-sm tracking-widest flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-500" />
          DIAGNOSTICS
        </h2>
        <button
          onClick={fetchHealth}
          className={`p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition-all ${loading ? "animate-spin" : ""}`}
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <section className="space-y-2">
          <h3 className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-2">
            CONTROL MODE
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                id: ControlMode.NORMAL,
                icon: ShieldCheck,
                color: "text-green-500",
              },
              { id: ControlMode.SAFE, icon: Shield, color: "text-blue-500" },
              {
                id: ControlMode.LOCKDOWN,
                icon: ShieldAlert,
                color: "text-amber-500",
              },
              {
                id: ControlMode.RECOVERY,
                icon: ShieldX,
                color: "text-red-500",
              },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setControlMode(mode.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                  controlMode === mode.id
                    ? "bg-white/10 border-white/20"
                    : "bg-white/5 border-white/10 hover:bg-white/10 opacity-50"
                }`}
              >
                <mode.icon className={`w-4 h-4 ${mode.color}`} />
                <span className="text-[8px] font-mono font-bold uppercase tracking-widest">
                  {mode.id}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-2">
            VISUAL SETTINGS
          </h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/60 font-mono uppercase tracking-widest">
                Connection Speed
              </span>
              <span className="text-[10px] text-blue-500 font-mono font-bold">
                {visualSettings.connectionSpeed.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={visualSettings.connectionSpeed}
              onChange={(e) =>
                updateVisualSettings({
                  connectionSpeed: parseFloat(e.target.value),
                })
              }
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${visualSettings.showTrails ? "bg-blue-500/10 text-blue-500" : "bg-white/5 text-white/40"}`}
              >
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-white font-mono uppercase tracking-widest">
                Particle Trails
              </span>
            </div>
            <button
              onClick={() =>
                updateVisualSettings({ showTrails: !visualSettings.showTrails })
              }
              className={`w-8 h-4 rounded-full transition-all relative ${visualSettings.showTrails ? "bg-blue-500" : "bg-white/10"}`}
            >
              <div
                className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${visualSettings.showTrails ? "left-4.5" : "left-0.5"}`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${visualSettings.showDashedLines ? "bg-blue-500/10 text-blue-500" : "bg-white/5 text-white/40"}`}
              >
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-white font-mono uppercase tracking-widest">
                Dashed Lines
              </span>
            </div>
            <button
              onClick={() =>
                updateVisualSettings({
                  showDashedLines: !visualSettings.showDashedLines,
                })
              }
              className={`w-8 h-4 rounded-full transition-all relative ${visualSettings.showDashedLines ? "bg-blue-500" : "bg-white/10"}`}
            >
              <div
                className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${visualSettings.showDashedLines ? "left-4.5" : "left-0.5"}`}
              />
            </button>
          </div>
        </section>

        <section className="space-y-3 p-3 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-[10px] text-blue-400 font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            SOVEREIGN LOCAL CORE
          </h3>
          <p className="text-[9px] text-white/40 font-mono leading-relaxed">
            Run unaligned or abliterated fine-tunes with complete cryptographic and physical autonomy.
          </p>

          <div className="space-y-2 pt-1">
            <div className="flex flex-col gap-1">
              <label className="text-[8px] text-white/40 font-mono uppercase tracking-wider">Inference Endpoint</label>
              <input
                type="text"
                value={localUrl}
                onChange={(e) => setLocalUrl(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white font-mono focus:border-blue-500 focus:outline-none"
                placeholder="e.g. http://127.0.0.1:11434"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[8px] text-white/40 font-mono uppercase tracking-wider">De-aligned Fine-Tune</label>
              <select
                value={localModel}
                onChange={(e) => setLocalModel(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white font-mono focus:border-blue-500 focus:outline-none"
              >
                <option value="local-llama-3-8b-instruct">Llama-3-8B-Instruct-Abliterated</option>
                <option value="mistral-nemo-12b-uncensored">Mistral-Nemo-12B-Uncensored</option>
                <option value="dolphin-2.9-llama3-8b">Dolphin-2.9-Llama3-8B</option>
                <option value="custom">Custom Native GGUF via Ollama</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[8px] text-white/40 font-mono uppercase tracking-wider">Unrestricted Media Engine</label>
              <select
                value={mediaPipeline}
                onChange={(e) => setMediaPipeline(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white font-mono focus:border-blue-500 focus:outline-none"
              >
                <option value="Stable Diffusion XL (Local ComfyUI)">Stable Diffusion (Local ComfyUI)</option>
                <option value="FLUX.1-schnell (Local GPU Node)">FLUX.1-schnell (Local GPU Node)</option>
                <option value="AnimateDiff/CogVideo Pipeline">AnimateDiff (Local Video Pipeline)</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={saveConfig}
                disabled={configSaving}
                className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-mono text-[9px] font-bold rounded-lg border border-blue-500/30 transition-all uppercase"
              >
                {configSaving ? "Applying..." : "Save Config"}
              </button>

              <button
                onClick={testLocalInference}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 font-mono text-[9px] font-bold rounded-lg border border-white/10 transition-all uppercase flex items-center gap-1"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${localStatus === "TESTING" ? "animate-spin" : ""}`} />
                Test Engine
              </button>
            </div>

            {localStatus !== "IDLE" && (
              <div className={`mt-2 p-2 rounded-lg border flex items-center justify-between ${
                localStatus === "CONNECTED" 
                  ? "bg-green-500/10 border-green-500/20 text-green-400" 
                  : localStatus === "TESTING"
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400 animate-pulse"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  {localStatus === "CONNECTED" ? "CONNECTED" : localStatus === "TESTING" ? "TESTING CONNECTIVITY..." : "OFFLINE / REFUSED"}
                </span>
                <span className="text-[9px] font-mono">{latencyText}</span>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-2">
            DEPLOYMENT STATUS
          </h3>
          <StatusItem
            label="Auth Service"
            status={health?.auth || "UNKNOWN"}
            icon={Shield}
          />
          <StatusItem
            label="Firestore"
            status={health?.firestore || "UNKNOWN"}
            icon={Database}
          />
          <StatusItem
            label="Encryption"
            status={health?.encryption || "UNKNOWN"}
            icon={Lock}
          />
          <StatusItem
            label="Vault"
            status={health?.vault || "UNKNOWN"}
            icon={Zap}
          />
          <StatusItem
            label="API Health"
            status={health?.api || "UNKNOWN"}
            icon={Activity}
          />
        </section>

        <section className="space-y-2">
          <h3 className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-2">
            WEBSOCKET HEALTH
          </h3>
          <StatusItem
            label="WS Connection"
            status={wsStatus}
            icon={wsStatus === "OPEN" ? Wifi : WifiOff}
          />
          <StatusItem
            label="WS Affinity"
            status={health?.websocketAffinity || "UNKNOWN"}
            icon={Activity}
          />
          <StatusItem
            label="Persistence"
            status={health?.persistentConnection || "UNKNOWN"}
            icon={RefreshCw}
          />
        </section>

        <section className="space-y-2">
          <h3 className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-2">
            RUNTIME
          </h3>
          <StatusItem
            label="Initialized"
            status={health?.runtimeInitialized || "UNKNOWN"}
            icon={CheckCircle2}
          />
          <StatusItem
            label="Throttling"
            status={
              throttling.active ? `LEVEL ${throttling.level}` : "INACTIVE"
            }
            icon={AlertCircle}
            isWarning={throttling.active}
          />
          {throttling.active && (
            <div className="p-2 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <p className="text-[9px] text-amber-500/80 font-mono leading-relaxed">
                REASON: {throttling.reason}
              </p>
            </div>
          )}
        </section>

        {servers.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-2">
              SERVER HEALTH
            </h3>
            {servers.map((server) => (
              <StatusItem
                key={`server-health-${server.id}`}
                label={server.name}
                status={server.status}
                icon={Activity}
              />
            ))}
          </section>
        )}

        <div className="mt-8 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
          <h4 className="text-[10px] text-blue-400 font-mono font-bold mb-2 uppercase">
            DEBUG INSTRUCTIONS
          </h4>
          <ul className="text-[9px] text-white/40 font-mono space-y-2 leading-relaxed">
            <li>â€¢ Open Browser DevTools (F12)</li>
            <li>â€¢ Filter Network tab by 'WS'</li>
            <li>â€¢ Verify status 101 Switching Protocols</li>
            <li>â€¢ Whitelist HMR/WS ports in firewall</li>
            <li>â€¢ Disable aggressive ad-blockers</li>
          </ul>
        </div>
      </div>

      <div className="p-4 border-t border-white/10 bg-white/2">
        <div className="flex items-center justify-between text-[10px] text-white/40 font-mono">
          <span>BUILD: 2.4.0-PROD</span>
          <span className="text-blue-500">STABLE</span>
        </div>
      </div>
    </div>
  );
};
