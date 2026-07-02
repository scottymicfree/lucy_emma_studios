/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Activity,
  Shield,
  Zap,
  Loader2,
  Radio,
  Headphones,
  Cpu,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNodeStore } from "../store/useNodeStore";
import { NodeStatus, EventPriority } from "../types";

export const LiveVoicePanel = () => {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [status, setStatus] = useState<
    "idle" | "connecting" | "active" | "error"
  >("idle");

  const streamRef = useRef<MediaStream | null>(null);

  const emitEvent = useNodeStore((state) => state.emitEvent);
  const isGlobalMuted = useNodeStore((state) => state.isMuted);

  const startSession = async () => {
    setStatus("connecting");
    emitEvent("LP1", NodeStatus.ACTIVE, EventPriority.NORMAL, {
      action: "voice_init",
    });

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setTranscription((prev) => [
          ...prev,
          "System: Web Speech API not supported in this browser.",
        ]);
        setStatus("error");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setStatus("active");
        setIsActive(true);
        emitEvent("LP1", NodeStatus.RESPONDING, EventPriority.NORMAL, {
          action: "voice_active",
        });
        setTranscription((prev) => [
          ...prev,
          "System: Voice engine listening...",
        ]);
      };

      recognition.onresult = async (event: any) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript;

        setTranscription((prev) => [...prev, `You: ${transcript}`]);

        // Call the local LLM endpoint via our server
        try {
          const res = await fetch("/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [{ role: "user", content: transcript }],
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const aiResponse =
              data.choices?.[0]?.message?.content || "No response";
            setTranscription((prev) => [...prev, `Lucy: ${aiResponse}`]);

            // Text to speech
            if (!isMuted && !isGlobalMuted) {
              const utterance = new SpeechSynthesisUtterance(aiResponse);
              utterance.pitch = 1.1;
              utterance.rate = 1.05;
              window.speechSynthesis.speak(utterance);
            }
          }
        } catch (err) {
          console.error("Failed to query model", err);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== "no-speech") {
          setStatus("error");
        }
      };

      recognition.start();

      // Store it so we can stop it later
      (window as any)._activeRecognition = recognition;
    } catch (error) {
      console.error("Failed to start Live session:", error);
      setStatus("error");
      emitEvent("LP1", NodeStatus.ERROR, EventPriority.CRITICAL, {
        error: "Voice Session Failed",
        details: error,
      });
    }
  };

  const stopSession = () => {
    if ((window as any)._activeRecognition) {
      (window as any)._activeRecognition.stop();
      delete (window as any)._activeRecognition;
    }
    window.speechSynthesis.cancel();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setIsActive(false);
    setStatus("idle");
    emitEvent("LP1", NodeStatus.IDLE, EventPriority.NORMAL, {
      action: "voice_closed",
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-x border-white/10 w-full max-w-2xl mx-auto overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/50">
            <Radio className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <h2 className="text-white text-sm font-bold tracking-tight uppercase">
              LIVE VOICE CORE
            </h2>
            <div className="flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500 animate-pulse" : "bg-white/20"}`}
              />
              <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest leading-none">
                {status === "active"
                  ? "LOW LATENCY STREAM ACTIVE"
                  : "VOICE ENGINE IDLE"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
            <Shield className="w-3 h-3 text-blue-500" />
            <span className="text-[9px] text-white/40 font-mono uppercase tracking-widest leading-none">
              SECURE PCM
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-12 relative">
        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center"
            >
              <div className="relative w-48 h-48 mb-12">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-green-500 rounded-full blur-3xl"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-end gap-1 h-12">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <motion.div
                        key={`voice-visualizer-bar-${i}`}
                        animate={{ height: [10, 40, 10] }}
                        transition={{
                          duration: 0.5 + Math.random(),
                          repeat: Infinity,
                        }}
                        className="w-1.5 bg-green-500 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <h3 className="text-white font-mono text-sm tracking-widest mb-2 uppercase">
                LISTENING TO VECTORS
              </h3>
              <p className="text-white/40 text-xs font-mono animate-pulse">
                LUCY PRIME IS READY TO CONVERSE
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center max-w-sm"
            >
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-8">
                <Headphones className="w-10 h-10 text-white/20" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">
                Real-time Voice Interface
              </h3>
              <p className="text-white/40 text-sm leading-relaxed mb-8">
                Establish a low-latency neural link with Lucy Prime for fluid,
                real-time voice conversations.
              </p>
              <button
                onClick={startSession}
                disabled={status === "connecting"}
                className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl transition-all font-bold tracking-widest text-xs shadow-lg shadow-green-900/20 flex items-center gap-3"
              >
                {status === "connecting" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    ESTABLISHING LINK...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    INITIALIZE VOICE LINK
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-8 left-8 right-8 max-h-32 overflow-y-auto custom-scrollbar space-y-2">
          {transcription.slice(-3).map((line, i) => (
            <div
              key={`transcription-line-${i}-${line.substring(0, 10)}`}
              className="text-[10px] font-mono text-white/30 uppercase tracking-widest"
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      <div className="p-8 bg-black/40 backdrop-blur-md border-t border-white/10 flex items-center justify-center gap-8">
        <button
          onClick={() => setIsMuted(!isMuted)}
          disabled={!isActive}
          className={`p-6 rounded-full transition-all border ${
            isMuted
              ? "bg-red-500/20 border-red-500/50 text-red-500"
              : "bg-white/5 border-white/10 text-white/40 hover:text-white"
          } disabled:opacity-20`}
        >
          {isMuted ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>

        {isActive && (
          <button
            onClick={stopSession}
            className="px-12 py-6 bg-red-600 hover:bg-red-500 text-white rounded-3xl transition-all font-bold tracking-widest text-xs shadow-lg shadow-red-900/20"
          >
            TERMINATE LINK
          </button>
        )}

        <button
          className="p-6 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all disabled:opacity-20"
          disabled={!isActive}
        >
          <Volume2 className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
