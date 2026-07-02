import React, { useEffect, useState } from "react";
import { useNodeStore } from "../store/useNodeStore";
import {
  Activity,
  Cpu,
  Zap,
  Eye,
  ShieldAlert,
  Thermometer,
} from "lucide-react";
import { runtimeGovernor } from "../lib/core/RuntimeGovernor";

export const TelemetryOverlay: React.FC = () => {
  const metaState = useNodeStore((state) => state.metaState);

  const [metrics, setMetrics] = useState({
    unrealFps: 120,
    mrFps: 72,
    latency: 15,
    interventions: 0,
    memory: 4.2,
    thermal: 65,
  });

  useEffect(() => {
    if (!metaState.telemetryEnabled) return;

    const interval = setInterval(() => {
      const osTelemetry = runtimeGovernor.getTelemetry();
      setMetrics((prev) => ({
        ...prev,
        unrealFps: 120, // Should be fetched from real rendering engine
        mrFps: 72,      // Should be fetched from headset telemetry
        latency: 15,    // Should be fetched from network stack
        memory: osTelemetry.memoryUsage,
        thermal: osTelemetry.thermal,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [metaState.telemetryEnabled]);

  if (!metaState.telemetryEnabled) return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex gap-4 bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-2xl">
      <MetricItem
        icon={<Eye className="w-4 h-4 text-blue-400" />}
        label="Unreal FPS"
        value={metrics.unrealFps.toFixed(0)}
        unit="fps"
      />
      <div className="w-px bg-white/10" />
      <MetricItem
        icon={<Activity className="w-4 h-4 text-purple-400" />}
        label="MR FPS"
        value={metrics.mrFps.toFixed(0)}
        unit="fps"
      />
      <div className="w-px bg-white/10" />
      <MetricItem
        icon={<Zap className="w-4 h-4 text-yellow-400" />}
        label="AR Latency"
        value={metrics.latency.toFixed(1)}
        unit="ms"
      />
      <div className="w-px bg-white/10" />
      <MetricItem
        icon={<ShieldAlert className="w-4 h-4 text-red-400" />}
        label="EmmaGate"
        value={metrics.interventions.toString()}
        unit="blocks"
      />
      <div className="w-px bg-white/10" />
      <MetricItem
        icon={<Cpu className="w-4 h-4 text-green-400" />}
        label="Memory"
        value={metrics.memory.toFixed(2)}
        unit="GB"
      />
      <div className="w-px bg-white/10" />
      <MetricItem
        icon={<Thermometer className="w-4 h-4 text-orange-400" />}
        label="Thermal"
        value={metrics.thermal.toFixed(1)}
        unit="°C"
      />
    </div>
  );
};

const MetricItem = ({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
}) => (
  <div className="flex flex-col items-center min-w-[70px]">
    <div className="flex items-center gap-1.5 mb-1">
      {icon}
      <span className="text-[9px] font-mono text-white/50 uppercase tracking-wider">
        {label}
      </span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-sm font-mono font-bold text-white">{value}</span>
      <span className="text-[10px] font-mono text-white/40">{unit}</span>
    </div>
  </div>
);
