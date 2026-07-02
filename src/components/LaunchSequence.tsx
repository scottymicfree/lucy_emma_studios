import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Terminal, CheckCircle, CircleDashed, Rocket, X } from "lucide-react";
import { useNodeStore } from "../store/useNodeStore";

const LAUNCH_STEPS = [
  {
    id: 1,
    name: "Firestore + LTM",
    cmd: 'lucy.connect_firestore(api_key="YOUR_KEY", enable_LTM=True)',
  },
  {
    id: 2,
    name: "Cognitive Engine",
    cmd: "lucy.activate_core(tick_interval=2.0, enable_meta_orchestrator=True)",
  },
  {
    id: 3,
    name: "Llama 3 Local Inference",
    cmd: 'lucy.enable_llama(api_url="http://127.0.0.1:1234/v1")',
  },
  {
    id: 4,
    name: "Unreal Adapter",
    cmd: 'lucy.inject_unreal_adapter(adapter_path="UA_Native_01", tick_stream=30)',
  },
  {
    id: 5,
    name: "Unreal Engine",
    cmd: 'lucy.launch_unreal(project_path="C:/UnrealProjects/IndustrialCity", map_name="Industrial-City", mass_entities=200)',
  },
  {
    id: 6,
    name: "FiveM Bridge",
    cmd: 'lucy.start_fivem_bridge(server_path="C:/FXServer", port=30120)',
  },
  {
    id: 7,
    name: "MR Headset",
    cmd: 'lucy.connect_mr(device="Quest 3", enable_spatial_safety=True)',
  },
  {
    id: 8,
    name: "EmmaGate Premium",
    cmd: "lucy.activate_emma_gate(tier=1, predictive_pathing=True, spatial_bubble=1.2)",
  },
  {
    id: 9,
    name: "Synaptic Visuals & Halos",
    cmd: "lucy.enable_synaptic_weights_visuals()\nlucy.enable_node_halos(min_success_rate=0.8)",
  },
  {
    id: 10,
    name: "Telemetry & Metrics",
    cmd: 'lucy.activate_advanced_metrics(metrics=["Unreal_FPS", "MR_FPS", "ActionRouter_Latency", "EmmaGate_Interventions", "Memory_Usage", "Thermal_Load"])',
  },
  { id: 11, name: "Simulation", cmd: "lucy.begin_simulation()" },
];

export const LaunchSequence: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const setMetaState = useNodeStore((state) => state.setMetaState);

  const startLaunch = async () => {
    setIsLaunching(true);
    setCurrentStep(0);
    setLogs(["[SYSTEM] Initiating Cross-Platform Launch Sequence..."]);

    for (let i = 0; i < LAUNCH_STEPS.length; i++) {
      const step = LAUNCH_STEPS[i];
      setCurrentStep(i + 1);

      // Simulate typing the command
      const cmdLines = step.cmd.split("\n");
      for (const line of cmdLines) {
        setLogs((prev) => [...prev, `> ${line}`]);
        await new Promise((r) => setTimeout(r, 400));
      }

      // Simulate execution time
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 1000));

      setLogs((prev) => [
        ...prev,
        `[OK] ${step.name} initialized successfully.`,
      ]);

      // Apply actual state changes based on steps
      if (step.id === 9) {
        setMetaState({ synapticVisualsEnabled: true, nodeHalosEnabled: true });
      }
      if (step.id === 10) {
        setMetaState({ telemetryEnabled: true });
      }
    }

    setLogs((prev) => [
      ...prev,
      "\n[SUCCESS] All systems nominal. Simulation active.",
    ]);
    setTimeout(() => {
      setIsLaunching(false);
      setIsOpen(false);
    }, 3000);
  };

  return (
    <>
      {/* Launch Control Button */}
      <div className="absolute left-6 top-24 z-50 flex flex-col gap-4">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl w-64 shadow-2xl">
          <h3 className="text-white/80 font-mono text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
            <Rocket className="w-4 h-4 text-blue-400" />
            Cross-Platform Launch
          </h3>
          <button
            onClick={() => setIsOpen(true)}
            className="w-full py-2 px-3 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/50 rounded text-blue-100 font-mono text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
          >
            <Terminal className="w-3 h-3" />
            Open Launch Terminal
          </button>
          <p className="text-[9px] text-white/40 mt-3 font-mono leading-relaxed">
            Execute the full boot sequence including Unreal Engine, FiveM, MR
            Headsets, and Paid Modules.
          </p>
        </div>
      </div>

      {/* Full Screen Launch Terminal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8"
          >
            <div className="w-full max-w-4xl h-full max-h-[80vh] bg-[#050505] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <Rocket className="w-5 h-5 text-blue-500" />
                  <h2 className="text-white font-mono text-sm tracking-widest uppercase">
                    Lucy Boot Sequence
                  </h2>
                </div>
                {!isLaunching && (
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 flex overflow-hidden">
                {/* Checklist Sidebar */}
                <div className="w-64 border-r border-white/10 p-4 overflow-y-auto bg-black/20">
                  <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-4">
                    Integration Sequence
                  </h3>
                  <div className="space-y-3">
                    {LAUNCH_STEPS.map((step, idx) => {
                      const isComplete = currentStep > idx + 1;
                      const isCurrent = currentStep === idx + 1;
                      return (
                        <div
                          key={step.id}
                          className={`flex items-center gap-3 text-[10px] font-mono ${isComplete ? "text-green-400" : isCurrent ? "text-blue-400" : "text-white/30"}`}
                        >
                          {isComplete ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : isCurrent ? (
                            <CircleDashed className="w-3 h-3 animate-spin" />
                          ) : (
                            <div className="w-3 h-3 rounded-full border border-white/20" />
                          )}
                          {step.name}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Terminal Output */}
                <div
                  className="flex-1 p-6 overflow-y-auto font-mono text-xs leading-relaxed custom-scrollbar"
                  id="launch-terminal"
                >
                  {logs.map((log, i) => (
                    <div
                      key={i}
                      className={`${log.startsWith(">") ? "text-blue-300" : log.startsWith("[OK]") ? "text-green-400" : log.startsWith("[SUCCESS]") ? "text-green-400 font-bold text-sm mt-4" : "text-white/70"} mb-1`}
                    >
                      {log}
                    </div>
                  ))}
                  {isLaunching && (
                    <div className="text-blue-400 animate-pulse mt-2">_</div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end">
                {!isLaunching ? (
                  <button
                    onClick={startLaunch}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-mono text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                  >
                    <Rocket className="w-4 h-4" />
                    Initiate Cross-Platform Launch
                  </button>
                ) : (
                  <div className="px-6 py-3 text-blue-400 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                    <CircleDashed className="w-4 h-4 animate-spin" />
                    Sequence in Progress...
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
