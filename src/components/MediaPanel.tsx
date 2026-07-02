import React, { useState, useRef } from "react";
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  Upload,
  Sparkles,
  Maximize2,
  Download,
  Loader2,
  Play,
  Pause,
  Monitor,
  Layout,
  RefreshCw,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateImage, generateVideo, generateMusic } from "../lib/llama";
import { useNodeStore } from "../store/useNodeStore";
import { NodeStatus, EventPriority } from "../types";

export const MediaPanel = () => {
  const [activeType, setActiveType] = useState<"image" | "video" | "music">(
    "image",
  );
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [isHighQuality, setIsHighQuality] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emitEvent = useNodeStore((state) => state.emitEvent);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setError(null);

    emitEvent("LP1", NodeStatus.ACTIVE, EventPriority.NORMAL, {
      type: activeType,
      prompt,
    });

    try {
      if (activeType === "image") {
        const url = await generateImage(prompt, {
          size: imageSize,
          aspectRatio,
          image: uploadedImage || undefined,
          model: isHighQuality ? "local-sd-pro" : "local-sd-fast",
        });
        setResult(url);
      } else if (activeType === "video") {
        const url = await generateVideo(prompt, {
          aspectRatio: aspectRatio as "16:9" | "9:16",
          image: uploadedImage || undefined,
        });
        setResult(url);
      } else if (activeType === "music") {
        const url = await generateMusic(prompt, true);
        setResult(url);
      }
      emitEvent("LP1", NodeStatus.RESPONDING, EventPriority.NORMAL, {
        success: true,
      });
    } catch (err: any) {
      console.error("Media generation error:", err);
      setError(err.message || "Generation failed");
      emitEvent("LP1", NodeStatus.ERROR, EventPriority.NORMAL, err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-x border-white/10 w-full max-w-4xl mx-auto overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/50">
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <h2 className="text-white text-sm font-bold tracking-tight uppercase">
              COGNITIVE MEDIA LAB
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest leading-none">
                VEO + LYRIA + IMAGEN
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          {[
            { id: "image", icon: ImageIcon, label: "IMAGE" },
            { id: "video", icon: VideoIcon, label: "VIDEO" },
            { id: "music", icon: MusicIcon, label: "MUSIC" },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveType(type.id as any)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold tracking-widest transition-all ${
                activeType === type.id
                  ? "bg-white/10 text-white shadow-lg"
                  : "text-white/30 hover:text-white hover:bg-white/5"
              }`}
            >
              <type.icon className="w-3 h-3" />
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center custom-scrollbar">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center max-w-md p-8 bg-red-500/10 border border-red-500/50 rounded-2xl"
            >
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-white font-bold mb-2 uppercase tracking-widest">
                Generation Blocked
              </h3>
              <p className="text-red-400 text-sm font-mono">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-6 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-all"
              >
                DISMISS
              </button>
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group w-full max-w-2xl aspect-square bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
            >
              {activeType === "image" && (
                <img
                  src={result}
                  className="w-full h-full object-cover"
                  alt="Generated"
                  referrerPolicy="no-referrer"
                />
              )}
              {activeType === "video" && (
                <video
                  src={result}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  loop
                />
              )}
              {activeType === "music" && (
                <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-500/50 mb-6 animate-pulse">
                    <MusicIcon className="w-10 h-10 text-purple-500" />
                  </div>
                  <h3 className="text-white font-mono text-sm mb-4">
                    GENERATED TRACK READY
                  </h3>
                  <audio src={result} controls className="w-full" />
                </div>
              )}

              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setResult(null)}
                  className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white/60 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <a
                  href={result}
                  download={`lucy-${activeType}-${Date.now()}`}
                  className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white/60 hover:text-white transition-colors"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          ) : loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-blue-500 animate-pulse" />
                </div>
              </div>
              <h3 className="text-white font-mono text-sm tracking-widest mb-2 uppercase">
                SYNTHESIZING MEDIA
              </h3>
              <p className="text-white/40 text-xs font-mono animate-pulse">
                LUCY IS PROCESSING MULTIMODAL VECTORS...
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center max-w-md"
            >
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 mb-8">
                <Layout className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">
                Create something extraordinary
              </h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Use Lucy's generative cores to synthesize high-fidelity images,
                cinematic video, or custom music tracks.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-black/40 backdrop-blur-md border-t border-white/10 space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                activeType === "image" && uploadedImage
                  ? "Describe edits for the image..."
                  : `Describe the ${activeType} you want to generate...`
              }
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-4 pr-12 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-all resize-none custom-scrollbar"
            />
            {(activeType === "video" || activeType === "image") && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`absolute right-3 bottom-3 p-2 rounded-lg transition-all ${
                  uploadedImage
                    ? "text-green-500 bg-green-500/10"
                    : "text-white/20 hover:text-white"
                }`}
                title={
                  activeType === "video"
                    ? "Upload starting frame"
                    : "Upload image to edit"
                }
              >
                <Upload className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || loading}
            className="h-full px-8 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-purple-900/20 font-bold tracking-widest text-xs"
          >
            GENERATE
          </button>
        </div>

        <div className="flex items-center gap-8 border-t border-white/5 pt-6">
          <div className="space-y-2">
            <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest">
              ASPECT RATIO
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"].map(
                (ratio) => (
                  <button
                    key={`aspect-ratio-${ratio}`}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-mono transition-all border ${
                      aspectRatio === ratio
                        ? "bg-white/10 border-white/20 text-white"
                        : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                    }`}
                  >
                    {ratio}
                  </button>
                ),
              )}
            </div>
          </div>

          {activeType === "image" && (
            <div className="space-y-2">
              <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest">
                ENGINE
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsHighQuality(false)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-mono transition-all border ${
                    !isHighQuality
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-500"
                      : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                  }`}
                >
                  FLASH (FAST)
                </button>
                <button
                  onClick={() => setIsHighQuality(true)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-mono transition-all border ${
                    isHighQuality
                      ? "bg-purple-500/20 border-purple-500/50 text-purple-500"
                      : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                  }`}
                >
                  PRO (HQ)
                </button>
              </div>
            </div>
          )}

          {activeType === "image" && isHighQuality && (
            <div className="space-y-2">
              <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest">
                RESOLUTION
              </span>
              <div className="flex items-center gap-2">
                {["1K", "2K", "4K"].map((size) => (
                  <button
                    key={`resolution-${size}`}
                    onClick={() => setImageSize(size as any)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-mono transition-all border ${
                      imageSize === size
                        ? "bg-blue-500/20 border-blue-500/50 text-blue-500"
                        : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {uploadedImage && (
            <div className="space-y-2">
              <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest">
                REFERENCE IMAGE
              </span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/20">
                  <img
                    src={uploadedImage}
                    className="w-full h-full object-cover"
                    alt="Ref"
                  />
                </div>
                <button
                  onClick={() => setUploadedImage(null)}
                  className="p-1 text-white/20 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};
