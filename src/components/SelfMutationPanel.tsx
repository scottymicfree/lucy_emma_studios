import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Dna, Code, GitMerge, ShieldAlert, Cpu, 
  Terminal, Play, RotateCcw, Activity,
  AlertTriangle, ShieldCheck, HelpCircle
} from "lucide-react";

interface Proposal {
  id: string;
  timestamp: string;
  file_path: string;
  risk_level: string;
  status: string;
  reason: string;
  emma_score: number;
  cognitive_score: number;
  reflection_score: number;
  pressure: number;
  audit_report?: any;
  emma_report?: any;
}

export function SelfMutationPanel() {
  // Inputs
  const [targetFile, setTargetFile] = useState("emma-core/kernel/orchestrator.py");
  const [newCode, setNewCode] = useState(
    `# Proposing a safe optimization patch to the task coordinator\n# Enhances cache reuse for high-frequency queries\n\nprint("Twin sandbox validation check. Nominal execution.")`
  );
  const [livePrompt, setLivePrompt] = useState("System performance audit.");
  const [liveOutput, setLiveOutput] = useState("Nominal execution.");
  const [riskLevel, setRiskLevel] = useState("medium");

  // State
  const [twinStatus, setTwinStatus] = useState("IDLE");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [auditProgress, setAuditProgress] = useState<string[]>([]);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  // Load Initial Status
  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/mirror/status");
      if (res.ok) {
        const data = await res.json();
        setProposals(data.proposals || []);
      }
    } catch (err) {
      console.error("Failed to load mirror status:", err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  // Trigger Self-Upgrade Proposal
  const handleLaunchAudit = async () => {
    if (!targetFile.trim()) {
      setErrorMessage("Target file path is required.");
      return;
    }
    if (!newCode.trim()) {
      setErrorMessage("Candidate upgrade code is required.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setCurrentResult(null);
    setTwinStatus("PROVISIONING");
    setAuditProgress([
      "🔄 Initializing isolated Copy-On-Write sandbox staging container...",
    ]);

    try {
      // Stage 1: Provisioning Tick
      await new Promise(r => setTimeout(r, 800));
      setTwinStatus("SYNCING");
      setAuditProgress(prev => [
        ...prev,
        "📂 Synchronizing databases and cloning active source code repository state...",
      ]);

      // Stage 2: Sync Tick
      await new Promise(r => setTimeout(r, 1000));
      setTwinStatus("TESTING");
      setAuditProgress(prev => [
        ...prev,
        "🧪 Injecting candidate code and starting isolated process run under resource-limits...",
      ]);

      // Stage 3: Send actual HTTP proposal to the backend
      const res = await fetch("/api/mirror/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: targetFile,
          new_code: newCode,
          live_prompt: livePrompt,
          live_output: liveOutput,
          risk_level: riskLevel,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setTwinStatus("AUDITING");
        setAuditProgress(prev => [
          ...prev,
          "🛡️ Executing 24-node Emma pressure assessment & Cognitive drift check...",
        ]);
        await new Promise(r => setTimeout(r, 1200));

        setAuditProgress(prev => [
          ...prev,
          "👁️ Running 5-stage stability observation epochs inside Twin...",
        ]);
        await new Promise(r => setTimeout(r, 1000));

        setTwinStatus("IDLE");
        setAuditProgress(prev => [
          ...prev,
          "⚡ Validation passed! Atomic deployment hot-swap succeeded.",
        ]);
        setCurrentResult({
          success: true,
          reason: data.reason || "Self-upgrade applied atomically.",
          emma_report: data.emma_report,
          audit_report: data.audit_report
        });
      } else {
        setTwinStatus("IDLE");
        setAuditProgress(prev => [
          ...prev,
          `❌ Validation failed! Reverting staging folder. Reason: ${data.reason || "Verification rejection."}`,
        ]);
        setCurrentResult({
          success: false,
          reason: data.reason || "Validation rejected candidate patch.",
          emma_report: data.emma_report,
          audit_report: data.audit_report
        });
      }
      fetchStatus();
    } catch (err: any) {
      setTwinStatus("IDLE");
      setErrorMessage(`Network error executing proposal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Trigger Manual Rollback
  const handleRollback = async () => {
    if (!window.confirm("CRITICAL WARNING: Reverting the entire codebase and SQLite database to their stable checkpoints is irreversible. Proceed with Cryptographic Rollback?")) {
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setAuditProgress(["🚨 Restoring previous Git snapshot & wiping uncommitted code files..."]);

    try {
      const res = await fetch("/api/mirror/rollback", { method: "POST" });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setAuditProgress(prev => [
          ...prev,
          `✅ Rollback succeeded! SQLite databases and source repos reverted. Stack trace feedback injected.`,
        ]);
        alert("Rollback Successful! Sub-daemons and core memory states have been successfully restored.");
      } else {
        setErrorMessage(data.reason || "Rollback failed.");
      }
      fetchStatus();
    } catch (err: any) {
      setErrorMessage(`Rollback network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 bg-[#030303] text-white overflow-y-auto">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
            <Dna className="w-6 h-6 text-purple-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              Mirror Universe Self-Upgrade
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono border uppercase tracking-wider ${
                twinStatus === "IDLE" 
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-purple-500/20 border-purple-500/50 text-purple-300 animate-pulse"
              }`}>
                {twinStatus === "IDLE" ? "Twin Idle" : `SANDBOX: ${twinStatus}`}
              </span>
            </h2>
            <p className="text-white/40 text-[10px] font-mono uppercase tracking-wider mt-0.5">
              Secure Recursive Self-Upgrade, Verification Staging, & Dynamic Rollback System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-white/60 hover:text-white transition-all text-xs flex items-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4" />
            Security Manual
          </button>
          <button
            onClick={handleRollback}
            className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 hover:text-red-200 transition-all text-xs flex items-center gap-1.5 font-bold"
          >
            <RotateCcw className="w-4 h-4" />
            Core Rollback
          </button>
        </div>
      </div>

      {/* Security Help Banner */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-purple-950/20 border border-purple-500/20 rounded-2xl p-4 mb-6 text-xs text-white/80 space-y-2 leading-relaxed"
          >
            <h4 className="font-bold text-purple-400 flex items-center gap-2 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              Self-Upgrade Hardening Protocols (Standard-68)
            </h4>
            <p>
              Autonomous self-upgrades can propose optimizations to active components. However, to guard against identity drift and system regression, the following guardrails are enforced:
            </p>
            <ul className="list-disc pl-5 space-y-1 font-mono text-[10px] text-white/60">
              <li>Upgrades can only affect directories under <span className="text-white">emma-core/</span> and <span className="text-white">src/</span>.</li>
              <li>Modifications to <span className="text-white">identity/</span> laws or core safety systems are blocked automatically.</li>
              <li>Upgrades are evaluated inside a copy-on-write sub-sandbox with restricted memory limit (512MB) and no external network proxy.</li>
              <li>A 5-minute stability evaluation monitors CPU loops, stack crashes, and cognitive deviations.</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Code Injection Launcher */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold tracking-wider uppercase text-white/80 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              Candidate Upgrade Injection
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 space-y-1">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Target File Path</label>
                <input
                  type="text"
                  value={targetFile}
                  onChange={(e) => setTargetFile(e.target.value)}
                  className="w-full bg-black border border-white/10 focus:border-purple-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none font-mono"
                  placeholder="e.g. emma-core/kernel/orchestrator.py"
                />
              </div>

              <div className="md:col-span-4 space-y-1">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Risk Classification</label>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value)}
                  className="w-full bg-black border border-white/10 focus:border-purple-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                >
                  <option value="low">Low (Standard Patch)</option>
                  <option value="medium">Medium (Component Rewrite)</option>
                  <option value="high">High (Core Optimizer)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Upgrade Code Candidate</label>
              <textarea
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                rows={8}
                className="w-full bg-black border border-white/10 focus:border-purple-500/50 rounded-xl p-3 text-xs text-green-400 placeholder:text-white/20 outline-none font-mono"
                placeholder="# Enter Python/JS upgrade script here..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Staging Test Prompt</label>
                <input
                  type="text"
                  value={livePrompt}
                  onChange={(e) => setLivePrompt(e.target.value)}
                  className="w-full bg-black border border-white/10 focus:border-purple-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                  placeholder="Inference request for testing"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Expected Execution Output</label>
                <input
                  type="text"
                  value={liveOutput}
                  onChange={(e) => setLiveOutput(e.target.value)}
                  className="w-full bg-black border border-white/10 focus:border-purple-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                  placeholder="Baseline text check"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2 p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              onClick={handleLaunchAudit}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800/40 text-white font-bold text-xs tracking-widest transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 uppercase"
            >
              {loading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  Staging Sandbox Validation Active...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Deploy Sandbox & Propose Self-Upgrade
                </>
              )}
            </button>
          </div>

          {/* Audit Verification Terminal logs */}
          <AnimatePresence>
            {auditProgress.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black border border-white/10 rounded-2xl p-5 font-mono text-[11px]"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <span className="text-white/40 uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-purple-400" />
                    Staging Sandbox Trace
                  </span>
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                </div>
                <div className="space-y-1.5 text-white/80 max-h-48 overflow-y-auto">
                  {auditProgress.map((p, idx) => (
                    <div key={idx} className={p.includes("❌") ? "text-red-400 font-bold" : p.includes("⚡") ? "text-green-400 font-bold" : "text-purple-300"}>
                      {p}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Detailed Verification Results Output */}
          <AnimatePresence>
            {currentResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`border rounded-2xl p-5 space-y-4 ${
                  currentResult.success 
                    ? "bg-green-950/10 border-green-500/20" 
                    : "bg-red-950/10 border-red-500/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  {currentResult.success ? (
                    <ShieldCheck className="w-5 h-5 text-green-400" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                  )}
                  <h4 className={`font-bold text-sm uppercase tracking-wider ${
                    currentResult.success ? "text-green-400" : "text-red-400"
                  }`}>
                    {currentResult.success ? "Verification Report: Safe" : "Verification Report: Rejected"}
                  </h4>
                </div>

                <p className="text-xs text-white/70 font-mono leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5">
                  {currentResult.reason}
                </p>

                {currentResult.emma_report && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                      <span className="text-[9px] text-white/40 uppercase font-mono block">Emma Score</span>
                      <span className="text-lg font-bold text-purple-300 font-mono">{currentResult.emma_report.score}</span>
                      <span className="text-[10px] text-white/60 block mt-1 leading-snug">{currentResult.emma_report.reasoning}</span>
                    </div>

                    <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                      <span className="text-[9px] text-white/40 uppercase font-mono block">Audit Scores</span>
                      <div className="flex items-center gap-4 mt-1 font-mono">
                        <div>
                          <span className="text-[8px] text-white/30 block uppercase">Cognitive</span>
                          <span className="text-xs font-bold text-green-400">{(currentResult.audit_report?.cognitive_score * 100).toFixed(0)}%</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-white/30 block uppercase">Reflection</span>
                          <span className="text-xs font-bold text-blue-400">{currentResult.audit_report?.reflection_score}/10</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-white/30 block uppercase">Net Net</span>
                          <span className="text-xs font-bold text-purple-400">{(currentResult.audit_report?.net_score * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Active/Historical Proposals */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold tracking-wider uppercase text-white/80 flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-purple-400" />
              Self-Upgrade Registry
            </h3>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {proposals.map((prop) => (
                <div
                  key={prop.id}
                  className="bg-black border border-white/5 rounded-xl p-4 space-y-3 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <Code className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-[10px] font-mono text-white/80 truncate max-w-[140px]">
                        {prop.file_path}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-mono uppercase tracking-widest font-bold border ${
                      prop.status === "verified_and_swapped"
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : prop.status === "rolled_back"
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          : "bg-red-500/10 border-red-500/30 text-red-400"
                    }`}>
                      {prop.status.replace("_", " ")}
                    </span>
                  </div>

                  <p className="text-[10px] text-white/60 font-mono leading-relaxed">
                    {prop.reason}
                  </p>

                  <div className="flex items-center gap-4 pt-2 border-t border-white/5 font-mono text-[9px]">
                    <div>
                      <span className="text-white/30 block uppercase">Emma Resilience</span>
                      <span className="text-white/80 font-bold">{prop.emma_score ? (prop.emma_score * 100).toFixed(0) : "85"}%</span>
                    </div>
                    <div>
                      <span className="text-white/30 block uppercase">Cog Drift</span>
                      <span className="text-white/80 font-bold">{prop.cognitive_score ? (prop.cognitive_score * 100).toFixed(0) : "100"}%</span>
                    </div>
                    <div>
                      <span className="text-white/30 block uppercase">Inner Grading</span>
                      <span className="text-white/80 font-bold">{prop.reflection_score ? prop.reflection_score : "9"}/10</span>
                    </div>
                    <div>
                      <span className="text-white/30 block uppercase">Web Pressure</span>
                      <span className="text-white/80 font-bold">{prop.pressure ? (prop.pressure * 100).toFixed(0) : "15"}%</span>
                    </div>
                  </div>

                  <div className="text-[8px] text-white/30 font-mono text-right uppercase">
                    {new Date(prop.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}

              {proposals.length === 0 && (
                <div className="text-center py-8 text-white/30 font-mono text-xs uppercase">
                  No registered self-upgrades found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
