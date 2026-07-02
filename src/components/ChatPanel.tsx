import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Brain,
  MapPin,
  Zap,
  Loader2,
  Mic,
  Volume2,
  AlertTriangle,
  CheckCircle2,
  Search,
  Paperclip,
  X,
  MicOff,
  Network,
  Cpu,
  Check,
  Activity,
  Code,
  ExternalLink,
  ShieldCheck,
  Play,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import {
  generateIntelligence,
  textToSpeech,
  analyzeIntent,
  scoreTranscription,
  transcribeAudio,
} from "../lib/llama";
import { useNodeStore } from "../store/useNodeStore";
import { NodeStatus, EventPriority } from "../types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: boolean;
  modelUsed?: string;
  transcriptionConfidence?: number;
  attachments?: { data: string; mimeType: string }[];
  agent?: "lucy" | "emma" | "both" | "system";
  interactiveElements?: any;
  emmaState?: any;
}

export const ChatPanel = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      agent: "lucy",
      content:
        "Lucy Prime online. How can I assist with your cognitive orchestration today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [expandedEmmaTrace, setExpandedEmmaTrace] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<
    { data: string; mimeType: string }[]
  >([]);
  const [isRecording, setIsRecording] = useState(false);
  const [confirmationNeeded, setConfirmationNeeded] = useState<{
    intent: string;
    suggestedMessage?: string;
    action: () => void;
  } | null>(null);

  // Hands-Free Voice Integration State
  const [voiceOutput, setVoiceOutput] = useState(() => {
    return localStorage.getItem("lucy_voice_output") !== "false";
  });
  const [lucyVoiceURI, setLucyVoiceURI] = useState(() => {
    return localStorage.getItem("lucy_voice_uri") || "";
  });
  const [emmaVoiceURI, setEmmaVoiceURI] = useState(() => {
    return localStorage.getItem("emma_voice_uri") || "";
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  // Split Studio Mode State
  const [isSplitStudioMode, setIsSplitStudioMode] = useState(false);
  const [selectedStudioFile, setSelectedStudioFile] = useState("src/components/ChatPanel.tsx");
  const [studioCode, setStudioCode] = useState("");
  const [studioOriginalCode, setStudioOriginalCode] = useState("");
  const [studioLoading, setStudioLoading] = useState(false);
  const [studioSaving, setStudioSaving] = useState(false);
  const [studioPrompt, setStudioPrompt] = useState("Verify stability.");
  const [studioOutput, setStudioOutput] = useState("Active.");
  const [studioRiskLevel, setStudioRiskLevel] = useState("medium");
  const [studioMessage, setStudioMessage] = useState("");
  const [studioAuditLogs, setStudioAuditLogs] = useState<string[]>([]);
  const [studioDiffMode, setStudioDiffMode] = useState(false);
  const [studioRollbackLoading, setStudioRollbackLoading] = useState(false);

  const studioFiles = [
    { label: "App.tsx", path: "src/App.tsx", language: "typescript" },
    { label: "ChatPanel.tsx", path: "src/components/ChatPanel.tsx", language: "typescript" },
    { label: "SelfMutationPanel.tsx", path: "src/components/SelfMutationPanel.tsx", language: "typescript" },
    { label: "CodingStationPanel.tsx", path: "src/components/CodingStationPanel.tsx", language: "typescript" },
    { label: "server.ts", path: "server.ts", language: "typescript" },
    { label: "isolation.py", path: "emma-core/mirror/isolation.py", language: "python" },
    { label: "intuition.py", path: "emma-core/mirror/intuition.py", language: "python" },
    { label: "orchestrator.py", path: "emma-core/kernel/orchestrator.py", language: "python" },
    { label: "package.json", path: "package.json", language: "json" },
  ];

  const loadStudioFile = async (filePath: string) => {
    setStudioLoading(true);
    setStudioMessage("");
    try {
      const res = await fetch(`/api/mirror/read-file?path=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (data.success) {
        setStudioCode(data.content);
        setStudioOriginalCode(data.content);
      } else {
        setStudioMessage(`❌ Error loading file: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      setStudioMessage(`❌ Connection error: ${err.message}`);
    } finally {
      setStudioLoading(false);
    }
  };

  useEffect(() => {
    if (isSplitStudioMode) {
      loadStudioFile(selectedStudioFile);
    }
  }, [selectedStudioFile, isSplitStudioMode]);

  const handleStudioUpgrade = async () => {
    if (!studioCode.trim()) return;
    setStudioSaving(true);
    setStudioMessage("");
    setStudioAuditLogs(["⚡ Spawning isolated twin sandbox...", "⚡ Syncing git and db snapshot..."]);
    
    try {
      const res = await fetch("/api/mirror/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: selectedStudioFile,
          new_code: studioCode,
          live_prompt: studioPrompt || "Verify stability.",
          live_output: studioOutput || "Active.",
          risk_level: studioRiskLevel
        })
      });
      
      const data = await res.json();
      setStudioSaving(false);
      
      if (data.success) {
        setStudioMessage("✅ SUCCESS! Self-upgrade verified, hot-swapped, and atomically deployed!");
        setStudioAuditLogs(prev => [...prev, "⚡ STAGING SANDBOX COMPLIANCE: SAFE ✔", "⚡ Hot-swapped atomically at: " + selectedStudioFile]);
        setStudioOriginalCode(studioCode);
      } else {
        setStudioMessage(`❌ REJECTED: ${data.reason}`);
        setStudioAuditLogs(prev => [...prev, "❌ STAGING SANDBOX COMPLIANCE: REJECTED", "❌ Reason: " + data.reason]);
      }
    } catch (err: any) {
      setStudioSaving(false);
      setStudioMessage(`❌ System Error: ${err.message}`);
    }
  };

  const handleStudioRollback = async () => {
    setStudioRollbackLoading(true);
    setStudioMessage("");
    try {
      const res = await fetch("/api/mirror/rollback", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setStudioMessage("✅ Manual system rollback completed. Hard revert of code repository.");
        setStudioAuditLogs(prev => [...prev, "⚡ SYSTEM REVERT TRIGGERED", "⚡ Hard reset applied."]);
        loadStudioFile(selectedStudioFile);
      } else {
        setStudioMessage(`❌ Rollback failed: ${data.reason}`);
      }
    } catch (err: any) {
      setStudioMessage(`❌ Connection error: ${err.message}`);
    } finally {
      setStudioRollbackLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const list = window.speechSynthesis.getVoices();
        setVoices(list);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const toggleVoiceOutput = () => {
    const newVal = !voiceOutput;
    setVoiceOutput(newVal);
    localStorage.setItem("lucy_voice_output", String(newVal));
  };

  const handleLucyVoiceChange = (uri: string) => {
    setLucyVoiceURI(uri);
    localStorage.setItem("lucy_voice_uri", uri);
  };

  const handleEmmaVoiceChange = (uri: string) => {
    setEmmaVoiceURI(uri);
    localStorage.setItem("emma_voice_uri", uri);
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const emitEvent = useNodeStore((state) => state.emitEvent);
  const addToMemory = useNodeStore((state) => state.addToMemory);
  const detectPatterns = useNodeStore((state) => state.detectPatterns);
  const isMuted = useNodeStore((state) => state.isMuted);

  const activeSimulation = useNodeStore((state) => state.activeSimulation);
  const startSimulation = useNodeStore((state) => state.startSimulation);
  const pauseSimulation = useNodeStore((state) => state.pauseSimulation);
  const resumeSimulation = useNodeStore((state) => state.resumeSimulation);
  const tickSimulation = useNodeStore((state) => state.tickSimulation);

  const executiveSummary = useNodeStore((state) => state.executiveSummary);
  const isCompressingMemory = useNodeStore((state) => state.isCompressingMemory);
  const compressMemory = useNodeStore((state) => state.compressMemory);

  // Auto-saving active simulation frames to Local Storage
  useEffect(() => {
    if (activeSimulation) {
      localStorage.setItem('lucy_sim_recovery_matrix', JSON.stringify(activeSimulation));
    } else {
      localStorage.removeItem('lucy_sim_recovery_matrix');
    }
  }, [activeSimulation]);

  // Re-hydration on component mount with both Local Storage AND hardened daemon DB backstop fallback
  useEffect(() => {
    const cachedSim = localStorage.getItem('lucy_sim_recovery_matrix');
    if (cachedSim) {
      try {
        const recoveredData = JSON.parse(cachedSim);
        useNodeStore.getState().rehydrateSimulation(recoveredData);
      } catch (e) {
        console.warn("Could not parse cached simulation frame:", e);
      }
    } else {
      // Backstop: Check daemon db for any recoverable active / pending simulation
      fetch("/api/simulation/active")
        .then(res => res.json())
        .then(data => {
          if (data && data.found && data.simulation) {
            console.log("[Simulation Backstop] Recovered active simulation from SQLite daemon:", data.simulation);
            useNodeStore.getState().rehydrateSimulation(data.simulation);
          }
        })
        .catch(err => console.warn("Could not check daemon for active simulations:", err));
    }
  }, []);

  // Simulation ticking logic
  useEffect(() => {
    let intervalId: any = null;
    if (activeSimulation && activeSimulation.status === 'RUNNING') {
      intervalId = setInterval(() => {
        tickSimulation();
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeSimulation?.status, tickSimulation]);

  // Sliding-Window memory compression hook
  useEffect(() => {
    if (messages.length > 8 && !isCompressingMemory) {
      const chunkToCompress = messages.slice(0, 4);
      compressMemory(chunkToCompress).then(() => {
        setMessages(prev => prev.slice(4));
      });
    }
  }, [messages.length, isCompressingMemory, compressMemory]);

  const handleInteractiveAction = (msgId: string, actionType: string, payload: any) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        if (actionType === 'complete_step') {
          const hb = { ...m.interactiveElements.handbook };
          const stepIdx = hb.plan.findIndex((s: any) => s.id === payload.id);
          if (stepIdx !== -1) {
            hb.plan[stepIdx].status = 'completed';
            // Promote next pending step to in_progress
            const nextStep = hb.plan[stepIdx + 1];
            if (nextStep) {
              nextStep.status = 'in_progress';
            } else {
              hb.status = 'completed';
            }
          }
          return {
            ...m,
            interactiveElements: {
              ...m.interactiveElements,
              handbook: hb
            }
          };
        }
        if (actionType === 'run_sim_cycle') {
          return {
            ...m,
            content: m.content + "\n\n**[SIMULATOR HEARTBEAT]** Cycle complete. Population metric stable at +4.2% annual growth. Tech index advanced to level 4."
          };
        }
      }
      return m;
    }));

    // Trigger store events for interactive control actions
    if (actionType === 'complete_step') {
      emitEvent("LP1", NodeStatus.ACTIVE, EventPriority.NORMAL, { step: payload.description });
      // Optimize mesh dynamically based on actual step payload instead of random
      let derivedTaskType = "Code Construction / Scripting";
      if (payload.description?.toLowerCase().includes("planet") || payload.description?.toLowerCase().includes("spatial")) {
        derivedTaskType = "Planetary Pulse Analysis";
      } else if (payload.description?.toLowerCase().includes("render") || payload.description?.toLowerCase().includes("vr")) {
        derivedTaskType = "Mixed Reality Rendering";
      }
      useNodeStore.getState().optimizeMeshForTask(derivedTaskType);
    } else if (actionType === 'run_sim_cycle') {
      emitEvent("E1", NodeStatus.SYNCING, EventPriority.NORMAL, { simulation: "cycle update" });
    } else if (actionType === 'optimize_mesh') {
      useNodeStore.getState().optimizeMeshForTask("Code Construction / Scripting");
      emitEvent("CN-001", NodeStatus.SYNCING, EventPriority.HIGH, { mesh: "optimized" });
    } else if (actionType === 'deploy_sandbox') {
      emitEvent("E1", NodeStatus.ACTIVE, EventPriority.CRITICAL, { sandbox: "staging sandbox live" });
    }
  };

  // Load initial messages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("lucy_chat_messages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved chat messages:", e);
      }
    }
  }, []);

  // Save messages to localStorage and scroll to bottom on change
  useEffect(() => {
    if (messages.length > 1 || (messages.length === 1 && messages[0].id !== "1")) {
      localStorage.setItem("lucy_chat_messages", JSON.stringify(messages));
    }
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachments((prev) => [
            ...prev,
            { data: reader.result as string, mimeType: file.type },
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const audioData = reader.result as string;
          setLoading(true);
          try {
            const text = await transcribeAudio(audioData);
            if (text && text.trim()) {
              const userMsg: Message = {
                id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                role: "user",
                content: text,
              };
              setMessages((prev) => [...prev, userMsg]);
              processRequest(text, true, []);
            }
          } catch (err) {
            console.error("Transcription error:", err);
          } finally {
            setLoading(false);
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processRequest = async (
    prompt: string,
    isVoice: boolean = false,
    currentAttachments: { data: string; mimeType: string }[] = [],
  ) => {
    setLoading(true);

    // Parse commands for visual feedback loop and emit targeted events
    const allNodes = useNodeStore.getState().nodes;
    let highlightIds: string[] = [];
    const lowerPrompt = prompt.toLowerCase().trim();

    if (lowerPrompt.startsWith('/sim')) {
      highlightIds = allNodes.filter(n => n.cluster === 'Temporal' || n.cluster === 'Parietal').map(n => n.id);
      emitEvent("LP1", NodeStatus.SYNCING, EventPriority.HIGH, { command: "sim", target: "Temporal & Parietal clusters" });
      
      // Parse parameters from command e.g., /sim --sector "Fenton, MO" --metric "flash flood" --value 25.0 --ticks 1000
      let sector = "Fenton, MO";
      let ticks = 100;
      
      const sectorMatch = prompt.match(/--sector\s+["']([^"']+)["']/i) || prompt.match(/--sector\s+([^\s]+)/i);
      if (sectorMatch) sector = sectorMatch[1];
      
      const ticksMatch = prompt.match(/--ticks\s+(\d+)/i);
      if (ticksMatch) ticks = parseInt(ticksMatch[1], 10);
      
      startSimulation(sector, ticks);
    } else if (lowerPrompt.startsWith('/dream')) {
      highlightIds = allNodes.filter(n => n.cluster === 'Occipital').map(n => n.id);
      emitEvent("LP1", NodeStatus.ACTIVE, EventPriority.NORMAL, { command: "dream", target: "Creative Agents" });
    } else if (lowerPrompt.startsWith('/mesh')) {
      highlightIds = allNodes.filter(n => n.cluster === 'Nucleus' || n.id.startsWith('CN-')).map(n => n.id);
      emitEvent("LP1", NodeStatus.SYNCING, EventPriority.CRITICAL, { command: "mesh", target: "Cortical Nucleus" });
    } else if (lowerPrompt.startsWith('/task')) {
      highlightIds = allNodes.filter(n => n.cluster === 'Ledger' || n.cluster === 'Frontal').map(n => n.id);
      emitEvent("LP1", NodeStatus.ACTIVE, EventPriority.HIGH, { command: "task", target: "Ledger & Frontal" });
    }

    if (highlightIds.length > 0) {
      const highlightNodes = (useNodeStore.getState() as any).highlightNodes;
      if (highlightNodes) {
        highlightNodes(highlightIds, 8000);
      }
    }

    emitEvent("LP1", NodeStatus.THINKING, EventPriority.CRITICAL, {
      prompt,
      isVoice,
      hasAttachments: currentAttachments.length > 0,
    });
    addToMemory(prompt);

    try {
      // 1. Score Transcription if Voice
      let transcriptionConfidence = 1.0;
      if (isVoice) {
        const score = await scoreTranscription(prompt);
        transcriptionConfidence = score.confidence;
      }

      // 2. Analyze Intent
      const intentResult = await analyzeIntent(prompt);

      if (intentResult.requiresConfirmation || transcriptionConfidence < 0.8) {
        setConfirmationNeeded({
          intent: intentResult.intent,
          suggestedMessage: intentResult.suggestedConfirmationMessage,
          action: () =>
            executeIntelligence(
              prompt,
              transcriptionConfidence,
              currentAttachments,
            ),
        });

        if (!isMuted && intentResult.suggestedConfirmationMessage) {
          playTTS(intentResult.suggestedConfirmationMessage);
        }

        setLoading(false);
        return;
      }

      await executeIntelligence(
        prompt,
        transcriptionConfidence,
        currentAttachments,
      );
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: "assistant",
          content: "Error: Failed to connect to cognitive core.",
        },
      ]);
      emitEvent("LP1", NodeStatus.ERROR, EventPriority.CRITICAL, {
        error: "Chat Core Failure",
        details: error,
      });
    } finally {
      setLoading(false);
    }
  };

  const executeIntelligence = async (
    prompt: string,
    transcriptionConfidence?: number,
    currentAttachments: { data: string; mimeType: string }[] = [],
  ) => {
    setLoading(true);
    setConfirmationNeeded(null);

    const response = await generateIntelligence(prompt, {
      thinking: thinkingMode,
      useMaps: useMaps,
      useSearch: useSearch,
      attachments: currentAttachments,
    });

    if (response.responses && response.responses.length > 0) {
      const msgsToAdd: Message[] = response.responses.map((r: any, idx: number) => ({
        id: `assistant-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
        role: "assistant" as const,
        agent: r.agent,
        content: r.text || "",
        thinking: thinkingMode,
        modelUsed: response.modelUsed,
        interactiveElements: r.interactive_elements,
        transcriptionConfidence,
        emmaState: response.pipeline_trace?.emmaState,
      }));
      setMessages((prev) => [...prev, ...msgsToAdd]);
      
      // Speak the first message content if voice is active
      if (!isMuted && msgsToAdd[0]?.content) {
        playTTS(msgsToAdd[0].content, msgsToAdd[0].agent);
      }
    } else {
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: "assistant",
        agent: "lucy",
        content: response.text || "I'm sorry, I couldn't process that.",
        thinking: thinkingMode,
        modelUsed: response.modelUsed,
        transcriptionConfidence,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      
      if (!isMuted) {
        playTTS(assistantMsg.content, assistantMsg.agent);
      }
    }

    emitEvent("LP1", NodeStatus.RESPONDING, EventPriority.CRITICAL, response);

    // Check for patterns
    const pattern = detectPatterns();
    if (pattern) {
      emitEvent("LP1", NodeStatus.ALERT, EventPriority.NORMAL, {
        pattern,
        suggestion: "Create Handbook Entry",
      });
    }
  };

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || loading) return;
    const userMsg: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: "user",
      content: input,
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    const currentAttachments = [...attachments];
    setInput("");
    setAttachments([]);
    processRequest(currentInput, false, currentAttachments);
  };

  const playTTS = async (text: string, agent: string = "lucy") => {
    if (isMuted || !voiceOutput) return;

    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        const preferredVoiceURI = agent === "emma" ? emmaVoiceURI : lucyVoiceURI;
        const selectedVoice = window.speechSynthesis.getVoices().find(v => v.voiceURI === preferredVoiceURI);
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        } else {
          const availableVoices = window.speechSynthesis.getVoices();
          if (agent === "emma") {
            const emmaVoice = availableVoices.find(v => v.name.includes("UK English") || v.name.includes("Zira") || v.name.includes("Google UK English Female")) || availableVoices.find(v => v.lang.startsWith("en") && (v.name.includes("Female") || v.name.includes("Zira")));
            if (emmaVoice) utterance.voice = emmaVoice;
          } else {
            const lucyVoice = availableVoices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha") || v.name.includes("Victoria") || v.name.includes("Google US English Female")) || availableVoices.find(v => v.lang.startsWith("en") && (v.name.includes("Female") || v.name.includes("Samantha")));
            if (lucyVoice) utterance.voice = lucyVoice;
          }
        }

        if (agent === "emma") {
          utterance.pitch = 0.95;
          utterance.rate = 1.0;
        } else {
          utterance.pitch = 1.1;
          utterance.rate = 1.05;
        }
        
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.warn("SpeechSynthesis error:", error);
    }
  };

  return (
    <div className={`h-full w-full bg-[#0a0a0a] ${isSplitStudioMode ? "flex flex-row overflow-hidden" : "flex justify-center"}`}>
      <div className={`flex flex-col h-full bg-[#0a0a0a] border-x border-white/10 ${isSplitStudioMode ? "w-full md:w-[45%] border-r border-white/10" : "w-full max-w-2xl mx-auto"}`}>
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/50">
            <Bot className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h2 className="text-white text-sm font-bold tracking-tight">
              LUCY CHAT
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest">
                COGNITIVE CORE ACTIVE
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSplitStudioMode(!isSplitStudioMode)}
            className={`p-2 rounded-lg transition-all flex items-center gap-2 border ${
              isSplitStudioMode
                ? "bg-purple-500/20 border-purple-500/50 text-purple-400 font-bold animate-pulse"
                : "bg-white/5 border-white/10 text-white/40 hover:text-white"
            }`}
            title="Toggle Split Code Studio"
          >
            <Code className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold">STUDIO</span>
          </button>
          <button
            onClick={() => setThinkingMode(!thinkingMode)}
            className={`p-2 rounded-lg transition-all flex items-center gap-2 border ${
              thinkingMode
                ? "bg-purple-500/20 border-purple-500/50 text-purple-500"
                : "bg-white/5 border-white/10 text-white/40 hover:text-white"
            }`}
            title="Enable High Thinking Mode"
          >
            <Brain className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold">THINKING</span>
          </button>
          <button
            onClick={() => setUseMaps(!useMaps)}
            className={`p-2 rounded-lg transition-all flex items-center gap-2 border ${
              useMaps
                ? "bg-green-500/20 border-green-500/50 text-green-500"
                : "bg-white/5 border-white/10 text-white/40 hover:text-white"
            }`}
            title="Enable Maps Grounding"
          >
            <MapPin className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold">MAPS</span>
          </button>
          <button
            onClick={() => setUseSearch(!useSearch)}
            className={`p-2 rounded-lg transition-all flex items-center gap-2 border ${
              useSearch
                ? "bg-blue-500/20 border-blue-500/50 text-blue-500"
                : "bg-white/5 border-white/10 text-white/40 hover:text-white"
            }`}
            title="Enable Search Grounding"
          >
            <Search className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold">SEARCH</span>
          </button>
          <button
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            className={`p-2 rounded-lg transition-all flex items-center gap-2 border ${
              showVoiceSettings
                ? "bg-amber-500/20 border-amber-500/50 text-amber-500"
                : "bg-white/5 border-white/10 text-white/40 hover:text-white"
            }`}
            title="Voice & Hands-Free Settings"
          >
            <Volume2 className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold">VOICE</span>
          </button>
        </div>
      </div>

      {showVoiceSettings && (
        <div className="bg-[#0f0f0f] border-b border-white/10 p-4 space-y-4 animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white text-xs font-mono font-bold uppercase tracking-wider">Voice Integration Settings</h3>
              <p className="text-[10px] text-white/40 font-mono">Configure hands-free voice synthesis and persona voices</p>
            </div>
            <button
              onClick={() => setShowVoiceSettings(false)}
              className="p-1 text-white/40 hover:text-white rounded hover:bg-white/5 font-mono text-[10px]"
            >
              [CLOSE]
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Voice Output Toggle */}
            <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-white text-[10px] font-mono font-bold block mb-1">VOICE OUTPUT</span>
                <span className="text-[9px] text-white/40 font-mono block">Speak agent responses automatically</span>
              </div>
              <button
                onClick={toggleVoiceOutput}
                className={`mt-2 py-1.5 px-3 rounded text-[10px] font-mono font-bold border transition-all ${
                  voiceOutput
                    ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                    : "bg-white/5 border-white/15 text-white/40 hover:text-white"
                }`}
              >
                {voiceOutput ? "ACTIVE (SPEAKING)" : "MUTED"}
              </button>
            </div>

            {/* Lucy Persona Voice */}
            <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
              <span className="text-white text-[10px] font-mono font-bold block mb-1">@LUCY VOICE</span>
              <span className="text-[9px] text-white/40 font-mono block mb-2">Warm & expressive female</span>
              <select
                value={lucyVoiceURI}
                onChange={(e) => handleLucyVoiceChange(e.target.value)}
                className="w-full bg-black/60 border border-white/20 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Default System Female</option>
                {voices.filter(v => v.lang.startsWith("en")).map(voice => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Emma Persona Voice */}
            <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
              <span className="text-white text-[10px] font-mono font-bold block mb-1">@EMMA VOICE</span>
              <span className="text-[9px] text-white/40 font-mono block mb-2">Calm & precise female</span>
              <select
                value={emmaVoiceURI}
                onChange={(e) => handleEmmaVoiceChange(e.target.value)}
                className="w-full bg-black/60 border border-white/20 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Default Calm Female</option>
                {voices.filter(v => v.lang.startsWith("en")).map(voice => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 🧠 Sliding-Window Executive Summary Panel */}
      <div className="bg-[#0b0c10]/80 border-b border-white/10 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
          <span className="font-bold text-white/50">WORKING STATE MEMORY:</span>
          <span className="text-white/80 max-w-[280px] md:max-w-[400px] truncate" title={executiveSummary}>
            {executiveSummary}
          </span>
        </div>
        <button
          onClick={() => alert(`Active Core System Memory State:\n\n${executiveSummary}`)}
          className="text-purple-400 hover:text-purple-300 font-bold hover:underline select-none"
        >
          [EXPAND]
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
      >
        <AnimatePresence mode="popLayout">
          {activeSimulation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="bg-black/80 border border-violet-500/40 rounded-2xl p-4 shadow-xl backdrop-blur-md mb-6 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-ping absolute" />
                    <div className="w-2.5 h-2.5 rounded-full bg-violet-600 relative" />
                  </div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-400">
                    ACTIVE SIMULATION LOOP: {activeSimulation.targetSector}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/60 font-mono">
                    ID: {activeSimulation.simId}
                  </span>
                  <button
                    onClick={() => useNodeStore.setState({ activeSimulation: null })}
                    className="text-[10px] text-red-400 hover:text-red-300 font-mono font-bold hover:underline"
                    title="Terminate Simulation"
                  >
                    [DISMISS]
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Progress bar */}
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] text-white/40 font-mono font-bold block uppercase">Simulation Tick Status</span>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-white/80">{activeSimulation.currentTick} / {activeSimulation.maxTicks}</span>
                    <span className="text-violet-400 font-bold">{Math.round((activeSimulation.currentTick / activeSimulation.maxTicks) * 100)}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-violet-500 to-blue-500 h-full transition-all duration-300"
                      style={{ width: `${(activeSimulation.currentTick / activeSimulation.maxTicks) * 100}%` }}
                    />
                  </div>
                </div>

                {/* State Machine controls */}
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] text-white/40 font-mono font-bold block uppercase font-bold">Control Operations</span>
                  <div className="flex items-center gap-2 mt-2">
                    {activeSimulation.status === 'RUNNING' ? (
                      <button
                        onClick={pauseSimulation}
                        className="flex-1 py-1 px-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 font-mono text-[10px] rounded transition-all font-bold uppercase"
                      >
                        Pause
                      </button>
                    ) : activeSimulation.status === 'PAUSED' ? (
                      <button
                        onClick={resumeSimulation}
                        className="flex-1 py-1 px-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] rounded transition-all font-bold uppercase"
                      >
                        Resume
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold">Completed</span>
                    )}
                    <button
                      onClick={() => startSimulation(activeSimulation.targetSector, activeSimulation.maxTicks)}
                      className="py-1 px-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white font-mono text-[10px] rounded transition-all uppercase"
                      title="Restart Drill"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Detected failure vectors */}
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] text-white/40 font-mono font-bold block uppercase">Failure Vectors</span>
                  {activeSimulation.failureVectorsDetected.length === 0 ? (
                    <span className="text-[10px] text-white/30 font-mono italic block">No critical faults parsed.</span>
                  ) : (
                    <div className="space-y-1 max-h-[48px] overflow-y-auto custom-scrollbar">
                      {activeSimulation.failureVectorsDetected.map((vec, idx) => (
                        <span key={idx} className="text-[9px] bg-red-500/15 border border-red-500/20 text-red-400 font-mono px-1.5 py-0.5 rounded block font-bold">
                          ⚠ {vec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={`chat-message-${msg.id}-${msg.role}`}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] group relative rounded-2xl p-4 shadow-xl transition-all duration-300 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none shadow-blue-900/20"
                    : msg.agent === "emma"
                    ? "bg-emerald-950/25 border border-emerald-500/30 text-emerald-100 rounded-tl-none shadow-emerald-950/30 backdrop-blur-md"
                    : msg.agent === "system"
                    ? "bg-violet-950/25 border border-violet-500/30 text-violet-100 rounded-tl-none shadow-violet-950/30 backdrop-blur-md"
                    : "bg-white/5 border border-white/10 text-white/80 rounded-tl-none shadow-black/20"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                      msg.agent === "emma"
                        ? "bg-emerald-500/20 border-emerald-500/35 text-emerald-400"
                        : msg.agent === "system"
                        ? "bg-violet-500/20 border-violet-500/35 text-violet-400"
                        : "bg-blue-500/20 border-blue-500/30 text-blue-400"
                    }`}>
                      {msg.agent === "emma" ? (
                        <ShieldCheck className="w-3 h-3" />
                      ) : msg.agent === "system" ? (
                        <Cpu className="w-3 h-3" />
                      ) : (
                        <Bot className="w-3 h-3" />
                      )}
                    </div>
                    <span className={`text-[10px] font-mono uppercase tracking-widest ${
                      msg.agent === "emma"
                        ? "text-emerald-400 font-bold"
                        : msg.agent === "system"
                        ? "text-violet-400 font-bold"
                        : "text-white/40"
                    }`}>
                      {msg.agent === "emma" ? "EMMA SECURE" : msg.agent === "system" ? "SYSTEM DAEMON" : "LUCY PRIME"}
                    </span>
                    {msg.thinking && (
                      <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30 font-mono">
                        HIGH THINKING
                      </span>
                    )}
                    {msg.modelUsed && (
                      <span className="text-[8px] text-white/20 font-mono uppercase ml-auto">
                        {msg.modelUsed}
                      </span>
                    )}
                    {msg.transcriptionConfidence && (
                      <span
                        className={`text-[8px] font-mono ml-2 ${msg.transcriptionConfidence > 0.8 ? "text-green-500" : "text-amber-500"}`}
                      >
                        CONFIDENCE:{" "}
                        {(msg.transcriptionConfidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}

                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {msg.attachments.map((att, i) => (
                      <div
                        key={i}
                        className="w-20 h-20 rounded-lg overflow-hidden border border-white/20"
                      >
                        {att.mimeType.startsWith("image/") ? (
                          <img
                            src={att.data}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            alt="Attachment"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/10 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white/40" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>

                {msg.emmaState && (
                  <div className="mt-2.5">
                    <button
                      onClick={() => setExpandedEmmaTrace(expandedEmmaTrace === msg.id ? null : msg.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer font-bold uppercase tracking-wider"
                    >
                      <Brain className="w-3 h-3 animate-pulse text-emerald-400" />
                      {expandedEmmaTrace === msg.id ? "Hide Cognitive Trace" : "Inspect Cognitive Trace"}
                    </button>

                    <AnimatePresence>
                      {expandedEmmaTrace === msg.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: "auto", marginTop: 10 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className="p-3.5 bg-zinc-950/85 border border-emerald-500/35 rounded-xl space-y-4 text-xs font-mono select-none overflow-hidden"
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                            <div className="flex items-center gap-1.5">
                              <Brain className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Emma Active Cognitive State</span>
                            </div>
                            <span className="text-[9px] text-emerald-500/60 uppercase">Real-time telemetry</span>
                          </div>

                          {/* Section 1: Active Emotional Engine Signals */}
                          {msg.emmaState.emotionalEngine && msg.emmaState.emotionalEngine.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">1. Emotional Signal Attention Weights</span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {msg.emmaState.emotionalEngine.map((sig: any, idx: number) => (
                                  <div key={idx} className="bg-zinc-900/60 p-2 rounded border border-zinc-800/80 flex flex-col space-y-1">
                                    <div className="flex justify-between items-center text-[10px]">
                                      <span className="text-emerald-400 font-bold">{sig.signal}</span>
                                      <span className="text-zinc-400">{(sig.intensity * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-zinc-950 rounded-full h-1">
                                      <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${sig.intensity * 100}%` }} />
                                    </div>
                                    <p className="text-[8px] text-zinc-500 mt-1 leading-normal italic">
                                      Trigger: {sig.trigger}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Section 2: Goal Engine Objectives */}
                          {msg.emmaState.goalEngine && msg.emmaState.goalEngine.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">2. Weighted Goals Distribution</span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2.5 bg-zinc-900/30 p-2.5 rounded border border-zinc-800/40">
                                {msg.emmaState.goalEngine.map((g: any, idx: number) => (
                                  <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-[9px]">
                                      <span className="text-zinc-300 truncate font-semibold" title={g.description}>{g.goal}</span>
                                      <span className="text-emerald-400 font-bold">{(g.weight * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-zinc-950 rounded-full h-1">
                                      <div className="bg-emerald-500/80 h-1 rounded-full" style={{ width: `${g.weight * 100}%` }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Section 3: World Model Hierarchy Ontology */}
                          {msg.emmaState.worldHierarchy && (
                            <div className="space-y-1.5">
                              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">3. World Ontology Focal Plane</span>
                              <div className="bg-zinc-900/40 p-2 rounded border border-zinc-800/60 space-y-1">
                                <div className="flex items-center gap-1 text-[9px] text-zinc-400 overflow-x-auto whitespace-nowrap pb-0.5 scrollbar-thin scrollbar-thumb-zinc-850">
                                  {msg.emmaState.worldHierarchy.path.map((p: string, idx: number, arr: string[]) => (
                                    <React.Fragment key={p}>
                                      <span className={`${p === msg.emmaState.worldHierarchy.level ? "text-emerald-400 font-bold underline underline-offset-2" : "text-zinc-500"}`}>
                                        {p}
                                      </span>
                                      {idx < arr.length - 1 && <span className="text-zinc-600">→</span>}
                                    </React.Fragment>
                                  ))}
                                </div>
                                <p className="text-[8px] text-zinc-500 leading-normal">
                                  Currently analyzing reality parameters from the <span className="text-emerald-400 font-semibold">{msg.emmaState.worldHierarchy.level}</span> dimension plane.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Section 4: Curiosity Engine Queries */}
                          {msg.emmaState.curiosityEngine && msg.emmaState.curiosityEngine.questions.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">4. Active Curiosity Engine Questions</span>
                              <div className="space-y-1">
                                {msg.emmaState.curiosityEngine.questions.map((q: string, idx: number) => (
                                  <div key={idx} className="flex gap-2 bg-zinc-900/60 p-1.5 rounded border border-zinc-800/80 text-[9px] text-emerald-300">
                                    <span className="text-emerald-500">?</span>
                                    <span className="leading-normal">{q}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Section 5: Creativity Recombinatory Flow & Long Term Purpose */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {msg.emmaState.creativityFlow && (
                              <div className="bg-zinc-900/40 p-2 rounded border border-zinc-800/60 space-y-1">
                                <span className="text-[8px] text-zinc-500 font-bold uppercase block">Creativity Stage</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    {msg.emmaState.creativityFlow.stage}
                                  </span>
                                </div>
                                <p className="text-[8px] text-zinc-500 leading-normal italic mt-1">
                                  "{msg.emmaState.creativityFlow.synthesisOutcome}"
                                </p>
                              </div>
                            )}
                            {msg.emmaState.longTermPurpose && (
                              <div className="bg-zinc-900/40 p-2 rounded border border-zinc-800/60 space-y-1">
                                <span className="text-[8px] text-zinc-500 font-bold uppercase block">Long-Term Purpose</span>
                                <p className="text-[8px] text-zinc-400 leading-normal">
                                  {msg.emmaState.longTermPurpose.direction}
                                </p>
                                {msg.emmaState.longTermPurpose.resilienceMetric !== undefined && (
                                  <div className="text-[8px] text-zinc-500 mt-1">
                                    System Resilience Index: <span className="text-emerald-400 font-bold">{msg.emmaState.longTermPurpose.resilienceMetric.toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* RICH INTERACTIVE CAPABILITIES PANEL */}
                {msg.interactiveElements && (
                  <div className="mt-4 p-3 rounded-lg bg-black/40 border border-white/10 space-y-3">
                    
                    {/* 1. Logic DAG Map */}
                    {msg.interactiveElements.dag_tree && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-blue-400">
                          <Network className="w-3.5 h-3.5" />
                          COGNITIVE DAG TRAVERSAL PATHWAY
                        </div>
                        <div className="flex flex-wrap items-center gap-2 py-1">
                          {msg.interactiveElements.dag_tree.map((node: string, idx: number) => (
                            <React.Fragment key={node}>
                              <span className="text-[10px] font-mono bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 rounded text-blue-300">
                                {node}
                              </span>
                              {idx < msg.interactiveElements.dag_tree.length - 1 && (
                                <span className="text-white/30 text-xs">→</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                        <button
                          onClick={() => handleInteractiveAction(msg.id, "optimize_mesh", {})}
                          className="w-full py-1 text-center bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 rounded text-[10px] font-mono text-blue-300 transition-all"
                        >
                          Animate Reasoning Pathway
                        </button>
                      </div>
                    )}

                    {/* 2. Drills Decomposition Panel */}
                    {msg.interactiveElements.drill_panel && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
                          <Activity className="w-3.5 h-3.5" />
                          RECURSIVE DECOMPOSITION DRILLS
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {msg.interactiveElements.drill_panel.map((drill: any, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setInput(drill.question);
                              }}
                              className="text-left text-[10px] font-mono bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/20 px-2 py-1.5 rounded text-amber-300 transition-all flex justify-between items-center"
                            >
                              <span>{drill.question}</span>
                              <span className="text-[8px] opacity-60">DRILL DOWN →</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. Creative Divergence Outlines */}
                    {msg.interactiveElements.creative_branches && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-purple-400">
                          <Sparkles className="w-3.5 h-3.5" />
                          CREATIVE DIVERGENCE OUTLINES
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {msg.interactiveElements.creative_branches.map((branch: any, idx: number) => (
                            <div key={idx} className="bg-purple-950/20 border border-purple-500/20 p-2 rounded flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-center text-[9px] font-bold font-mono text-purple-300">
                                  <span>{branch.name}</span>
                                  <span className="opacity-60">e={branch.entropy}</span>
                                </div>
                                <div className="text-[8px] text-white/60 font-mono mt-1 space-y-0.5">
                                  <p><strong>+</strong> {branch.strengths}</p>
                                  <p><strong>-</strong> {branch.weaknesses}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => alert(`Focused cognitive core onto branch: ${branch.name}`)}
                                className="w-full py-0.5 mt-2 text-center bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded text-[8px] font-mono text-purple-300 transition-all"
                              >
                                Anchor Branch
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. Cosmic Simulation Matrix */}
                    {msg.interactiveElements.civilization_sim && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-violet-400">
                          <Sparkles className="w-3.5 h-3.5" />
                          COSMIC SIMULATION MATRIX
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div className="bg-white/5 border border-white/10 p-1.5 rounded text-center">
                            <p className="text-[8px] text-white/40 font-mono">KARDASHEV</p>
                            <p className="text-[11px] font-bold font-mono text-violet-300">{msg.interactiveElements.civilization_sim.metrics.kardashev_level}</p>
                          </div>
                          <div className="bg-white/5 border border-white/10 p-1.5 rounded text-center">
                            <p className="text-[8px] text-white/40 font-mono">STABILITY</p>
                            <p className="text-[11px] font-bold font-mono text-violet-300">{msg.interactiveElements.civilization_sim.metrics.stability}</p>
                          </div>
                          <div className="bg-white/5 border border-white/10 p-1.5 rounded text-center">
                            <p className="text-[8px] text-white/40 font-mono">EFFICIENCY</p>
                            <p className="text-[11px] font-bold font-mono text-violet-300">{msg.interactiveElements.civilization_sim.metrics.resource_efficiency}</p>
                          </div>
                          <div className="bg-white/5 border border-white/10 p-1.5 rounded text-center">
                            <p className="text-[8px] text-white/40 font-mono">THREAT</p>
                            <p className="text-[11px] font-bold font-mono text-violet-300">{msg.interactiveElements.civilization_sim.metrics.threat_assessment}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleInteractiveAction(msg.id, "run_sim_cycle", {})}
                          className="w-full py-1 text-center bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 rounded text-[10px] font-mono text-violet-300 transition-all"
                        >
                          Run Simulation Cycle
                        </button>
                      </div>
                    )}

                    {/* 5. Project Handbook Steps */}
                    {msg.interactiveElements.handbook && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono font-bold text-green-400">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            AUTONOMOUS EXECUTION HANDBOOK
                          </div>
                          <span className="text-[9px] bg-green-500/10 border border-green-500/30 px-1.5 rounded uppercase">{msg.interactiveElements.handbook.status}</span>
                        </div>
                        <p className="text-[9px] font-mono text-white/60 bg-white/5 px-2 py-1 rounded">
                          <strong>OBJECTIVE:</strong> {msg.interactiveElements.handbook.objective}
                        </p>
                        <div className="space-y-1 py-1">
                          {msg.interactiveElements.handbook.plan.map((step: any, idx: number) => (
                            <div key={step.id} className="flex items-center justify-between bg-white/5 p-1.5 rounded border border-white/10">
                              <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-bold ${
                                  step.status === 'completed'
                                    ? 'bg-green-500 text-black'
                                    : step.status === 'in_progress'
                                    ? 'bg-blue-500 text-white animate-pulse'
                                    : 'bg-white/10 text-white/40'
                                }`}>
                                  {step.status === 'completed' ? '✓' : idx + 1}
                                </span>
                                <span className={`text-[10px] font-mono ${step.status === 'completed' ? 'line-through text-white/30' : 'text-white/80'}`}>
                                  {step.description}
                                </span>
                              </div>
                              {step.status === 'in_progress' && (
                                <button
                                  onClick={() => handleInteractiveAction(msg.id, "complete_step", step)}
                                  className="px-1.5 py-0.5 bg-green-500 hover:bg-green-600 rounded text-[8px] font-bold text-black font-mono transition-all"
                                >
                                  Complete Step
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 6. Mirror Self-Upgrade Checklist */}
                    {msg.interactiveElements.mirror_upgrade_preview && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-400">
                          <Cpu className="w-3.5 h-3.5" />
                          SELF-UPGRADE PROPOSAL CHECKLIST
                        </div>
                        <div className="bg-rose-950/20 border border-rose-500/20 p-2 rounded text-[9px] font-mono space-y-1">
                          <p><strong>Target File:</strong> {msg.interactiveElements.mirror_upgrade_preview.target_file}</p>
                          <p><strong>Sandbox Engine:</strong> {msg.interactiveElements.mirror_upgrade_preview.sandbox_isolation}</p>
                          <p><strong>Risk Evaluation:</strong> <span className="text-rose-400 font-bold">{msg.interactiveElements.mirror_upgrade_preview.risk_score}</span></p>
                          <p><strong>Proposed Code Signature:</strong> <span className="text-white/40">{msg.interactiveElements.mirror_upgrade_preview.proposed_code_hash}</span></p>
                        </div>
                        <button
                          onClick={() => handleInteractiveAction(msg.id, "deploy_sandbox", {})}
                          className="w-full py-1 text-center bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded text-[10px] font-mono text-rose-300 transition-all"
                        >
                          Deploy Sandbox & Apply Hot-swap
                        </button>
                      </div>
                    )}

                    {/* 7. VR Telemetry Stream */}
                    {msg.interactiveElements.vr_telemetry_card && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
                          <Play className="w-3.5 h-3.5" />
                          VR SPATIAL TELEMETRY STREAM
                        </div>
                        <div className="bg-emerald-950/20 border border-emerald-500/20 p-2 rounded text-[9px] font-mono grid grid-cols-2 gap-1">
                          <p><strong>Headset Pos:</strong> {msg.interactiveElements.vr_telemetry_card.headset_pos.join(", ")}</p>
                          <p><strong>Hands Status:</strong> L:{msg.interactiveElements.vr_telemetry_card.hands.left} | R:{msg.interactiveElements.vr_telemetry_card.hands.right}</p>
                          <p><strong>Spatial Audio:</strong> {msg.interactiveElements.vr_telemetry_card.spatial_audio_enabled ? "Active" : "Disabled"}</p>
                          <p><strong>Interface Latency:</strong> {msg.interactiveElements.vr_telemetry_card.latencies.headset_to_core}</p>
                        </div>
                        <button
                          onClick={() => alert("Spatial coordinates recalibrated to absolute zero plane.")}
                          className="w-full py-1 text-center bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded text-[10px] font-mono text-emerald-300 transition-all"
                        >
                          Recenter Spatial Coordinates
                        </button>
                      </div>
                    )}

                    {/* 8. Toolbelt Secure Assess */}
                    {msg.interactiveElements.toolbelt_safety && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          TOOLBELT SECURE SANDBOX EVALUATION
                        </div>
                        <div className="bg-amber-950/20 border border-amber-500/20 p-2 rounded text-[9px] font-mono space-y-1">
                          <p><strong>Virtual Tool:</strong> {msg.interactiveElements.toolbelt_safety.requested_tool}</p>
                          <p><strong>CWD Target:</strong> {msg.interactiveElements.toolbelt_safety.execution_cwd}</p>
                          <p><strong>Risk Level:</strong> <span className="text-amber-400 font-bold">{msg.interactiveElements.toolbelt_safety.risk_evaluation}</span></p>
                          <p><strong>Shield Status:</strong> {msg.interactiveElements.toolbelt_safety.shield_active ? "FULLY SHIELDED" : "UNREGULATED"}</p>
                        </div>
                        <button
                          onClick={() => alert("Executing tool inside secure virtual sandbox environment.")}
                          className="w-full py-1 text-center bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded text-[10px] font-mono text-amber-300 transition-all"
                        >
                          Verify & Execute Shielded
                        </button>
                      </div>
                    )}

                    {/* 9. Swarm Consensus Mesh */}
                    {msg.interactiveElements.swarm_mesh_card && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-sky-400">
                          <Network className="w-3.5 h-3.5" />
                          CONSENSUS SWARM NEURAL MESH
                        </div>
                        <div className="bg-sky-950/20 border border-sky-500/20 p-2 rounded text-[9px] font-mono space-y-1">
                          <p><strong>Consensus Status:</strong> {msg.interactiveElements.swarm_mesh_card.consensus_reached ? "REACHED" : "COMPROMISED"}</p>
                          <p><strong>Active Nodes:</strong> {msg.interactiveElements.swarm_mesh_card.signatures_active} / 351</p>
                          <p><strong>Byzantine Toleration Margin:</strong> {msg.interactiveElements.swarm_mesh_card.byzantine_toleration_margin}</p>
                        </div>
                        <button
                          onClick={() => handleInteractiveAction(msg.id, "optimize_mesh", {})}
                          className="w-full py-1 text-center bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 rounded text-[10px] font-mono text-sky-300 transition-all"
                        >
                          Optimize Swarm Routing Network
                        </button>
                      </div>
                    )}

                  </div>
                )}

                {msg.role === "assistant" && (
                  <button
                    onClick={() => playTTS(msg.content, msg.agent)}
                    className="absolute -right-10 top-0 p-2 text-white/20 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {isCompressingMemory && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center space-x-2 text-xs text-amber-500/80 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl animate-pulse font-mono"
            >
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Emma Core is condensing immediate token buffers into long-term system memory...</span>
            </motion.div>
          )}
          
          {confirmationNeeded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-amber-500/10 border border-amber-500/50 rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center gap-3 text-amber-500">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-bold font-mono uppercase">
                  Safety Confirmation Required
                </span>
              </div>
              <p className="text-xs text-white/70">
                Lucy detected an intent to perform a system action:{" "}
                <span className="text-amber-400 font-bold">
                  "{confirmationNeeded.intent}"
                </span>
                .
                {confirmationNeeded.suggestedMessage && (
                  <span className="block mt-2 italic text-white/50">
                    "{confirmationNeeded.suggestedMessage}"
                  </span>
                )}
                Please confirm to proceed.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={confirmationNeeded.action}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  CONFIRM EXECUTION
                </button>
                <button
                  onClick={() => setConfirmationNeeded(null)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold py-2 rounded-lg transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </motion.div>
          )}

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white/5 border border-white/10 text-white/40 rounded-2xl rounded-tl-none p-4 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-xs font-mono animate-pulse">
                  {thinkingMode
                    ? "LUCY IS THINKING DEEPLY..."
                    : "LUCY IS PROCESSING..."}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 bg-black/40 backdrop-blur-md border-t border-white/10">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="relative group w-12 h-12 rounded-lg overflow-hidden border border-white/20"
              >
                {att.mimeType.startsWith("image/") ? (
                  <img
                    src={att.data}
                    className="w-full h-full object-cover"
                    alt="Preview"
                  />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white/40" />
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {isRecording && (
          <div className="flex items-center justify-center gap-2.5 mb-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-end gap-1 h-4">
              <span className="w-1 bg-red-500 rounded-full animate-bounce h-3 [animation-delay:0.1s] [animation-duration:0.6s]" />
              <span className="w-1 bg-red-500 rounded-full animate-bounce h-4 [animation-delay:0.2s] [animation-duration:0.5s]" />
              <span className="w-1 bg-red-500 rounded-full animate-bounce h-2 [animation-delay:0.3s] [animation-duration:0.7s]" />
              <span className="w-1 bg-red-500 rounded-full animate-bounce h-3 [animation-delay:0.4s] [animation-duration:0.4s]" />
              <span className="w-1 bg-red-500 rounded-full animate-bounce h-1.5 [animation-delay:0.5s] [animation-duration:0.8s]" />
            </div>
            <span className="text-[10px] text-red-400 font-mono font-bold uppercase tracking-wider">
              LUCY & EMMA ARE LISTENING... RELEASE TO TRANSCRIBE & SEND
            </span>
          </div>
        )}

        <div className="relative flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask Lucy Prime anything..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all resize-none max-h-32 custom-scrollbar"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-3 bottom-3 p-2 text-white/20 hover:text-white transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              className={`absolute right-3 bottom-3 p-2 transition-colors ${isRecording ? "text-red-500 animate-pulse" : "text-white/20 hover:text-white"}`}
            >
              {isRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={(!input.trim() && attachments.length === 0) || loading}
            className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all disabled:opacity-50 disabled:hover:bg-blue-600 shadow-lg shadow-blue-900/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          multiple
          className="hidden"
          accept="image/*,video/*"
        />
        <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-white/20 font-mono uppercase tracking-widest">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>COGNITIVE ROUTING ACTIVE</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>LLAMA 3 LOCAL INFERENCE</span>
          </div>
        </div>
      </div>
    </div>

      {/* RIGHT STUDIO CODE PANEL */}
      {isSplitStudioMode && (
        <div className="flex-1 flex flex-col h-full bg-[#050505] border-l border-white/10 overflow-hidden font-sans">
          {/* Studio Header */}
          <div className="p-4 border-b border-white/10 bg-black/60 backdrop-blur-md flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/50">
                <Code className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white text-xs font-bold tracking-tight uppercase">RECURSIVE MUTATION & CODE STUDIO</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                  <span className="text-[9px] text-white/40 font-mono uppercase tracking-wider">LIVE TWIN SANDBOX READY</span>
                </div>
              </div>
            </div>
            
            {/* Target File Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 font-mono uppercase">TARGET:</span>
              <select
                value={selectedStudioFile}
                onChange={(e) => setSelectedStudioFile(e.target.value)}
                className="bg-black/80 border border-white/10 focus:border-purple-500/50 rounded-lg px-2.5 py-1 text-xs text-white outline-none font-mono max-w-xs transition-all"
              >
                {studioFiles.map((file) => (
                  <option key={file.path} value={file.path}>
                    {file.label} ({file.path})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Code Area and Controls */}
          <div className="flex-1 p-5 flex flex-col gap-4 overflow-hidden">
            {/* Code Editor Box */}
            <div className="flex-1 flex flex-col bg-black border border-white/10 rounded-2xl overflow-hidden relative group">
              <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between shrink-0">
                <span className="text-[10px] text-white/60 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  {selectedStudioFile}
                </span>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStudioCode(studioOriginalCode)}
                    disabled={studioCode === studioOriginalCode}
                    className="text-[10px] font-mono text-white/40 hover:text-white disabled:text-white/10 transition-colors uppercase cursor-pointer"
                    title="Reset to Original Code"
                  >
                    RESET
                  </button>
                  <span className="text-[10px] text-white/20">|</span>
                  <span className="text-[10px] font-mono text-white/40">
                    {studioCode.split("\n").length} LINES
                  </span>
                </div>
              </div>

              {studioLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 font-mono text-xs text-white/40 bg-[#020202]">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                  <span>DECRYPTING SOURCE REPOSITORY FILE...</span>
                </div>
              ) : (
                <div className="flex-1 flex overflow-hidden relative">
                  {/* Line Numbers Column */}
                  <div className="select-none py-4 text-right pr-3 pl-4 text-white/20 bg-black/40 border-r border-white/5 font-mono text-xs min-w-[3rem] overflow-y-hidden text-right leading-relaxed h-full">
                    {studioCode.split("\n").map((_, i) => (
                      <div key={i} className="h-5">{i + 1}</div>
                    ))}
                  </div>

                  {/* Code Editor Input */}
                  <textarea
                    value={studioCode}
                    onChange={(e) => setStudioCode(e.target.value)}
                    className="flex-1 bg-transparent p-4 text-green-400/90 font-mono text-xs outline-none resize-none overflow-auto leading-relaxed custom-scrollbar whitespace-pre"
                    spellCheck={false}
                  />
                </div>
              )}
            </div>

            {/* Config & Audit Injection */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-black/40 border border-white/5 p-4 rounded-xl shrink-0">
              <div className="md:col-span-4 space-y-1">
                <label className="text-[9px] font-mono text-white/40 uppercase tracking-wider block">Risk Classification</label>
                <select
                  value={studioRiskLevel}
                  onChange={(e) => setStudioRiskLevel(e.target.value)}
                  className="w-full bg-black border border-white/10 focus:border-purple-500/50 rounded-lg px-2 py-1.5 text-xs text-white outline-none font-mono"
                >
                  <option value="low">Low (Patch Update)</option>
                  <option value="medium">Medium (Standard Upgrade)</option>
                  <option value="high">High (Core Refactor)</option>
                </select>
              </div>

              <div className="md:col-span-4 space-y-1">
                <label className="text-[9px] font-mono text-white/40 uppercase tracking-wider block">Sandbox Test Prompt</label>
                <input
                  type="text"
                  value={studioPrompt}
                  onChange={(e) => setStudioPrompt(e.target.value)}
                  className="w-full bg-black border border-white/10 focus:border-purple-500/50 rounded-lg px-2 py-1.5 text-xs text-white outline-none font-mono"
                  placeholder="e.g. Verify stability."
                />
              </div>

              <div className="md:col-span-4 space-y-1">
                <label className="text-[9px] font-mono text-white/40 uppercase tracking-wider block">Expected Output Check</label>
                <input
                  type="text"
                  value={studioOutput}
                  onChange={(e) => setStudioOutput(e.target.value)}
                  className="w-full bg-black border border-white/10 focus:border-purple-500/50 rounded-lg px-2 py-1.5 text-xs text-white outline-none font-mono"
                  placeholder="e.g. Active."
                />
              </div>
            </div>

            {/* Execution / Rollback Actions & Audit Logs */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 shrink-0">
              {/* Upgrade Trigger */}
              <div className="md:col-span-7 flex flex-col gap-2">
                <button
                  onClick={handleStudioUpgrade}
                  disabled={studioSaving || studioLoading}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800/40 text-white font-bold text-xs tracking-widest transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 uppercase font-mono cursor-pointer"
                >
                  {studioSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      STAGING SANDBOX PIPELINE ACTIVE...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      STAGE SANDBOX & MUTATE CODE
                    </>
                  )}
                </button>

                {studioMessage && (
                  <div className={`p-3 border rounded-xl text-xs font-mono flex items-start gap-2 ${
                    studioMessage.startsWith("❌") 
                      ? "bg-red-950/20 border-red-500/20 text-red-400" 
                      : "bg-green-950/20 border-green-500/20 text-green-400"
                  }`}>
                    {studioMessage.startsWith("❌") ? (
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                    )}
                    <span>{studioMessage}</span>
                  </div>
                )}
              </div>

              {/* Rollback Trigger */}
              <div className="md:col-span-5 space-y-2">
                <button
                  onClick={handleStudioRollback}
                  disabled={studioRollbackLoading || studioLoading}
                  className="w-full py-3 rounded-xl bg-amber-950/30 border border-amber-500/20 hover:bg-amber-900/20 disabled:opacity-50 text-amber-400 hover:text-amber-300 font-bold text-xs tracking-widest transition-all flex items-center justify-center gap-2 uppercase font-mono cursor-pointer"
                  title="Rollback all codebase files to last stable git commit"
                >
                  {studioRollbackLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      Reverting System...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Core Rollback
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Sandbox Execution Output / Audit Console */}
            {studioAuditLogs.length > 0 && (
              <div className="bg-black/80 border border-white/5 rounded-xl p-4 font-mono text-[10px] space-y-1.5 max-h-32 overflow-y-auto shrink-0 custom-scrollbar">
                <div className="flex items-center justify-between pb-1 border-b border-white/5 mb-1">
                  <span className="text-white/40 uppercase tracking-wider text-[8px] flex items-center gap-1">
                    <Activity className="w-3 h-3 text-purple-400" />
                    SANDBOX TRACE CONSOLE
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                </div>
                {studioAuditLogs.map((log, idx) => (
                  <div key={idx} className={
                    log.includes("❌") 
                      ? "text-red-400 font-bold" 
                      : log.includes("✅") || log.includes("SAFE") || log.includes("Succeeded")
                        ? "text-green-400 font-bold" 
                        : "text-purple-300/80"
                  }>
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
