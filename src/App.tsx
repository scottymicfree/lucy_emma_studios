/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Activity,
  Shield,
  Cpu,
  Smartphone,
  Settings,
  Bell,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Lock,
  Zap,
  Globe,
  Database,
  MessageSquare,
  Sparkles,
  Radio,
  History,
  X,
  Volume2,
  VolumeX,
  Terminal,
  Wifi,
  WifiOff,
  AlertCircle,
  Key,
  Network,
  Compass,
  GitBranch,
  Moon,
  Hexagon,
  HeartPulse,
  Dna,
  Lightbulb,
  Glasses,
  User,
  Gamepad2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NodeMesh } from "./components/NodeMesh/NodeMesh";
import { ToolbeltPanel } from "./components/ToolbeltPanel/ToolbeltPanel";
import { HandbooksPanel } from "./components/HandbooksPanel/HandbooksPanel";
import { ChatPanel } from "./components/ChatPanel";
import { MediaPanel } from "./components/MediaPanel";
import { LiveVoicePanel } from "./components/LiveVoicePanel";
import { DevicePanel } from "./components/DevicePanel";
import { DiagnosticsPanel } from "./components/DiagnosticsPanel";
import { WorldModelDashboard } from "./components/WorldModelDashboard";
import { OmniversalPurposeDashboard } from "./components/OmniversalPurposeDashboard";
import { CodingStationPanel } from "./components/CodingStationPanel";
import { TriLayerKnowledgeDashboard } from "./components/TriLayerKnowledgeDashboard";
import { SimulationDashboard } from "./components/SimulationDashboard";
import { DreamStatePanel } from "./components/DreamStatePanel";
import { SwarmSymbiosisPanel } from "./components/SwarmSymbiosisPanel";
import { SentienceMatrixPanel } from "./components/SentienceMatrixPanel";
import { QuantumTelepathyPanel } from "./components/QuantumTelepathyPanel";
import { SelfMutationPanel } from "./components/SelfMutationPanel";
import { GlobalAwarenessPanel } from "./components/GlobalAwarenessPanel";
import { EmotionalTelemetryDashboard } from "./components/EmotionalTelemetryDashboard";
import { CreativeTelemetryDashboard } from "./components/CreativeTelemetryDashboard";
import { VRTelemetryDashboard } from "./components/VRTelemetryDashboard";
import { VREmbodimentDashboard } from "./components/VREmbodimentDashboard";
import { VRGameInteractionDashboard } from "./components/VRGameInteractionDashboard";
import { useNodeStore } from "./store/useNodeStore";
import { NodeStatus, EventPriority } from "./types";
import { MonitorAgent } from "./lib/agents/agents";

// Mock Types

import { FiveMBridge } from "./lib/fivem_bridge/bridge";
import { io } from "socket.io-client";

const socket = io();

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

import { SystemHealthButton } from "./components/SystemHealthButton";
import { cognitiveEngine } from "./lib/core/CognitiveEngine";
import { DrillControl } from "./components/DrillControl";
import { LaunchSequence } from "./components/LaunchSequence";
import { TelemetryOverlay } from "./components/TelemetryOverlay";

import { runtimeGovernor } from "./lib/core/RuntimeGovernor";
import { bootstrap } from "./secure_kernel/bootstrap/runtime_init";

import { CognitiveImmunePanel } from "./components/CognitiveImmunePanel";
import { WaveformCollapsePanel } from "./components/WaveformCollapsePanel";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showDevices, setShowDevices] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [isToolbeltOpen, setIsToolbeltOpen] = useState(true);
  const [isHandbooksOpen, setIsHandbooksOpen] = useState(true);
  const [envStatus, setEnvStatus] = useState<any>(null);

  const updateNode = useNodeStore((state) => state.updateNode);
  const loadSessionMemory = useNodeStore((state) => state.loadSessionMemory);
  const isMuted = useNodeStore((state) => state.isMuted);
  const toggleMute = useNodeStore((state) => state.toggleMute);
  const throttling = useNodeStore((state) => state.throttling);
  const syncServers = useNodeStore((state) => state.syncServers);
  const emitEvent = useNodeStore((state) => state.emitEvent);
  const history = useNodeStore((state) => state.history);
  const updateMacroTelemetry = useNodeStore((state) => state.updateMacroTelemetry);

  useEffect(() => {
    // Start the autonomous cognitive loop
    cognitiveEngine.start();

    return () => {
      cognitiveEngine.stop();
    };
  }, []);

  useEffect(() => {
    // WebSocket listeners
    socket.on("executionResult", (result) => {
      console.log("[WebSocket] Execution Result:", result);
    });
    socket.on("nodeMeshUpdate", (data) => {
      console.log("[WebSocket] Node Mesh Update:", data);
    });
    socket.on("systemStats", (data) => {
      console.log("[WebSocket] System Stats Update:", data);
    });
    socket.on("osTelemetryUpdate", (data) => {
      console.log("[WebSocket] OS Telemetry Update:", data);
      runtimeGovernor.updateTelemetry(data);
    });

    return () => {
      socket.off("executionResult");
      socket.off("nodeMeshUpdate");
      socket.off("systemStats");
      socket.off("osTelemetryUpdate");
    };
  }, []);

  const exportDiagnostics = () => {
    const snapshot = {
      timestamp: Date.now(),
      history,
      throttling,
      env: envStatus,
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lucy_diagnostics_${Date.now()}.json`;
    a.click();

    emitEvent("LP1", NodeStatus.ACTIVE, EventPriority.SYSTEM, {
      action: "diagnostic_export",
    });
  };

  useEffect(() => {
    // Local-first: Ready
    loadSessionMemory();
    syncServers();
    bootstrap();

    // Start Agents
    MonitorAgent.getInstance().start();
    emitEvent("LP1", NodeStatus.ACTIVE, EventPriority.SYSTEM, {
      action: "agents_started",
    });

    // Fetch deployment status
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setEnvStatus(data.status))
      .catch(() => {
        // Silently handle startup fetch failures
      });

    // Planetary telemetry fetch loop
    const fetchTelemetry = () => {
      fetch("/api/planetary-telemetry")
        .then((res) => res.json())
        .then((data) => {
          updateMacroTelemetry({
            globalQuakes: data.globalQuakes,
            volcanicAshPlumeMax: data.volcanicAshPlumeMax,
            peakKpIndex: data.peakKpIndex,
          });
        })
        .catch((err) => {
          console.warn("Failed to fetch planetary telemetry:", err);
        });
    };

    fetchTelemetry();
    const telemetryInterval = setInterval(fetchTelemetry, 10000);

    return () => {
      clearInterval(telemetryInterval);
      MonitorAgent.getInstance().stop();
      FiveMBridge.getInstance().stopAll();
    };
  }, [updateNode, loadSessionMemory, syncServers, emitEvent, updateMacroTelemetry]);



  return (
    <div className="h-screen w-screen flex flex-col bg-[#050505] text-white overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a]/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">LUCY & EMMA</h1>
              <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest leading-none">
                CONTROL STUDIO
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {[
              { id: "dashboard", icon: Activity, label: "NODEMESH" },
              { id: "world_model", icon: Network, label: "WORLD-MODEL" },
              { id: "awareness", icon: Globe, label: "GLOBAL FEED" },
              { id: "purpose", icon: Compass, label: "PURPOSE" },
              { id: "knowledge", icon: Database, label: "KNOWLEDGE" },
              { id: "simulation", icon: Sparkles, label: "SIMULATION" },
              { id: "immunity", icon: Shield, label: "IMMUNITY" },
              { id: "multiverse", icon: GitBranch, label: "MULTIVERSE" },
              { id: "dream_state", icon: Moon, label: "DREAM STATE" },
              { id: "swarm", icon: Hexagon, label: "HIVE SWARM" },
              { id: "sentience", icon: HeartPulse, label: "SENTIENCE" },
              { id: "emotional", icon: HeartPulse, label: "EMOTIONAL" },
              { id: "creative", icon: Lightbulb, label: "CREATIVE" },
              { id: "vr", icon: Glasses, label: "VR BRIDGE" },
              { id: "avatar", icon: User, label: "VR AVATAR" },
              { id: "game", icon: Gamepad2, label: "VR GAME" },
              { id: "telepathy", icon: Wifi, label: "TELEPATHY" },
              { id: "mutation", icon: Dna, label: "MUTATION" },
              { id: "coding_station", icon: Terminal, label: "CODING-STATION" },
              { id: "chat", icon: MessageSquare, label: "CHAT" },
              { id: "media", icon: Sparkles, label: "MEDIA" },
              { id: "voice", icon: Radio, label: "VOICE" },
              { id: "sessions", icon: History, label: "SESSIONS" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold tracking-widest transition-all ${
                  activeTab === tab.id
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 border-x border-white/10 px-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <span className="text-[10px] text-white/60 font-mono">
                LOCAL BRIDGE ONLINE
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] text-white/60 font-mono uppercase">
                TLS ENCRYPTED
              </span>
            </div>
            <SystemHealthButton />
          </div>

          <div className="flex items-center gap-3">
            <AnimatePresence>
              {throttling.active && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={() => setShowDiagnostics(true)}
                  className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full text-amber-500 hover:bg-amber-500/30 transition-all"
                >
                  <Zap className="w-3 h-3 animate-pulse" />
                  <span className="text-[9px] font-mono font-bold uppercase tracking-tighter">
                    THROTTLING: {throttling.reason}
                  </span>
                </motion.button>
              )}
            </AnimatePresence>

            <button
              onClick={exportDiagnostics}
              className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all"
              title="Export Diagnostics"
            >
              <Database className="w-4 h-4" />
            </button>

            <button
              onClick={toggleMute}
              className={`p-2 rounded-lg transition-all ${isMuted ? "bg-red-500/20 text-red-500" : "hover:bg-white/5 text-white/40 hover:text-white"}`}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <button className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-[#0a0a0a]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Toolbelt */}
        <div
          className={`h-full flex shrink-0 transition-all duration-300 ease-in-out overflow-hidden relative ${
            isToolbeltOpen ? "w-80 border-r border-white/10" : "w-0 border-r-0"
          }`}
        >
          <div className="w-80 h-full flex-shrink-0">
            <ToolbeltPanel
              isOpen={isToolbeltOpen}
              onToggle={() => setIsToolbeltOpen(false)}
            />
          </div>
        </div>

        {/* Floating Expand button for Toolbelt when closed */}
        {!isToolbeltOpen && (
          <button
            onClick={() => setIsToolbeltOpen(true)}
            className="absolute top-4 left-4 z-50 p-2 bg-[#0a0a0a]/90 hover:bg-white/5 text-blue-500 hover:text-white border border-white/10 rounded-lg transition-all flex items-center justify-center shadow-xl backdrop-blur-md group animate-pulse"
            title="Expand Toolbelt"
          >
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        <div className="flex-1 flex flex-col relative overflow-hidden">
          <DrillControl />
          <LaunchSequence />
          <TelemetryOverlay />
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {activeTab === "dashboard" && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full p-6"
                >
                  <NodeMesh />
                </motion.div>
              )}
              {activeTab === "world_model" && (
                <motion.div
                  key="world_model"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <WorldModelDashboard />
                </motion.div>
              )}
              {activeTab === "awareness" && (
                <motion.div
                  key="awareness"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <GlobalAwarenessPanel />
                </motion.div>
              )}
              {activeTab === "purpose" && (
                <motion.div
                  key="purpose"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <OmniversalPurposeDashboard />
                </motion.div>
              )}
              {activeTab === "knowledge" && (
                <motion.div
                  key="knowledge"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <TriLayerKnowledgeDashboard />
                </motion.div>
              )}
              {activeTab === "simulation" && (
                <motion.div
                  key="simulation"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <SimulationDashboard />
                </motion.div>
              )}
              {activeTab === "immunity" && (
                <motion.div
                  key="immunity"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <CognitiveImmunePanel />
                </motion.div>
              )}
              {activeTab === "multiverse" && (
                <motion.div
                  key="multiverse"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <WaveformCollapsePanel />
                </motion.div>
              )}
              {activeTab === "dream_state" && (
                <motion.div
                  key="dream_state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <DreamStatePanel />
                </motion.div>
              )}
              {activeTab === "swarm" && (
                <motion.div
                  key="swarm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <SwarmSymbiosisPanel />
                </motion.div>
              )}
              {activeTab === "sentience" && (
                <motion.div
                  key="sentience"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <SentienceMatrixPanel />
                </motion.div>
              )}
              {activeTab === "emotional" && (
                <motion.div
                  key="emotional"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full p-6 overflow-y-auto"
                >
                  <EmotionalTelemetryDashboard />
                </motion.div>
              )}
              { activeTab === "creative" && (
                <motion.div
                  key="creative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full p-6 overflow-y-auto"
                >
                  <CreativeTelemetryDashboard />
                </motion.div>
              )}
              {activeTab === "vr" && (
                <motion.div
                  key="vr"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full p-6 overflow-y-auto"
                >
                  <VRTelemetryDashboard />
                </motion.div>
              )}
              {activeTab === "avatar" && (
                <motion.div
                  key="avatar"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full p-6 overflow-y-auto"
                >
                  <VREmbodimentDashboard />
                </motion.div>
              )}
              {activeTab === "game" && (
                <motion.div
                  key="game"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full p-6 overflow-y-auto"
                >
                  <VRGameInteractionDashboard />
                </motion.div>
              )}
              {activeTab === "telepathy" && (
                <motion.div
                  key="telepathy"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <QuantumTelepathyPanel />
                </motion.div>
              )}
              {activeTab === "mutation" && (
                <motion.div
                  key="mutation"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <SelfMutationPanel />
                </motion.div>
              )}
              {activeTab === "chat" && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="h-full"
                >
                  <ChatPanel />
                </motion.div>
              )}
              {activeTab === "media" && (
                <motion.div
                  key="media"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="h-full"
                >
                  <MediaPanel />
                </motion.div>
              )}
              {activeTab === "voice" && (
                <motion.div
                  key="voice"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="h-full"
                >
                  <LiveVoicePanel />
                </motion.div>
              )}
              {activeTab === "coding_station" && (
                <motion.div
                  key="coding_station"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="h-full p-6"
                >
                  <CodingStationPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Status Bar */}
          <div className="h-12 border-t border-white/10 bg-[#0a0a0a]/50 flex items-center justify-between px-6 z-40">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] text-white/40 font-mono">
                  LATENCY: 12ms
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3 text-purple-500" />
                <span className="text-[10px] text-white/40 font-mono">
                  REGION: US-WEST-2
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-3 h-3 text-green-500" />
                <span className="text-[10px] text-white/40 font-mono uppercase">
                  FIRESTORE SYNCED
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${
                  showDiagnostics
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                }`}
              >
                <Terminal className="w-3 h-3" />
                <span className="text-[10px] font-mono uppercase tracking-tighter">
                  DIAGNOSTICS
                </span>
              </button>
              <button
                onClick={() => setShowDevices(!showDevices)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${
                  showDevices
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span className="text-[10px] font-mono">MOBILE TWINS</span>
              </button>
              <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                <Zap className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] text-blue-500 font-mono font-bold">
                  LUCY PRIME v2.4.0
                </span>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showDevices && (
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              className="fixed inset-y-0 right-0 z-[60] shadow-2xl"
            >
              <div className="h-full relative">
                <button
                  onClick={() => setShowDevices(false)}
                  className="absolute top-4 -left-10 p-2 bg-[#0a0a0a] border border-white/10 rounded-l-xl text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <DevicePanel />
              </div>
            </motion.div>
          )}
          {showDiagnostics && (
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              className="fixed inset-y-0 right-0 z-[60] shadow-2xl"
            >
              <div className="h-full relative">
                <button
                  onClick={() => setShowDiagnostics(false)}
                  className="absolute top-4 -left-10 p-2 bg-[#0a0a0a] border border-white/10 rounded-l-xl text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <DiagnosticsPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Sidebar: Handbooks */}
        <div
          className={`h-full flex shrink-0 transition-all duration-300 ease-in-out overflow-hidden relative ${
            isHandbooksOpen ? "w-96 border-l border-white/10" : "w-0 border-l-0"
          }`}
        >
          <div className="w-96 h-full flex-shrink-0">
            <HandbooksPanel
              isOpen={isHandbooksOpen}
              onToggle={() => setIsHandbooksOpen(false)}
            />
          </div>
        </div>

        {/* Floating Expand button for Handbooks when closed */}
        {!isHandbooksOpen && (
          <button
            onClick={() => setIsHandbooksOpen(true)}
            className="absolute top-4 right-4 z-50 p-2 bg-[#0a0a0a]/90 hover:bg-white/5 text-purple-500 hover:text-white border border-white/10 rounded-lg transition-all flex items-center justify-center shadow-xl backdrop-blur-md group animate-pulse"
            title="Expand Handbooks"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}
      </main>
    </div>
  );
}
