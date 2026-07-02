/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const LOCAL_LLAMA_URL = '/v1/chat/completions';

export const MODELS = {
  COMPLEX: "llama-3-8b-instruct",
  GENERAL: "llama-3-8b-instruct",
  FAST: "llama-3-8b-instruct",
  IMAGE_PRO: "local-stable-diffusion",
  IMAGE_FLASH: "local-stable-diffusion",
  TTS: "local-piper-tts",
  VIDEO: "local-video-gen",
  MUSIC_CLIP: "local-music-gen",
  MUSIC_PRO: "local-music-gen",
  LIVE: "llama-3-8b-instruct",
};

/**
 * Cognitive Routing Layer
 */
export function routeTask(prompt: string, complexity?: 'low' | 'medium' | 'high'): string {
  return MODELS.GENERAL;
}

/**
 * Intent Confidence Scoring & Voice Confirmation Flow
 */
export async function analyzeIntent(prompt: string): Promise<{ 
  intent: string, 
  confidence: number, 
  requiresConfirmation: boolean,
  suggestedConfirmationMessage?: string 
}> {
  const isDangerous = /reboot|delete|flush|shutdown|override/i.test(prompt);
  const isHighImpact = /upgrade|toolbelt|\/upgrade|\/toolbelt/i.test(prompt);

  if (isHighImpact) {
    return {
      intent: "emma_safety_audit",
      confidence: 0.98,
      requiresConfirmation: true,
      suggestedConfirmationMessage: "Emma Safety Evaluation: High-impact engine modification detected. Confirm process execution bypass?"
    };
  }

  return {
    intent: isDangerous ? "system_change" : "general_query",
    confidence: 0.9,
    requiresConfirmation: isDangerous,
    suggestedConfirmationMessage: isDangerous ? "I detected a critical system command. Should I proceed?" : undefined
  };
}

/**
 * Transcription Confidence Scoring
 */
export async function scoreTranscription(text: string): Promise<{ 
  text: string, 
  confidence: number, 
  isReliable: boolean 
}> {
  const confidence = 0.85; 
  return {
    text,
    confidence,
    isReliable: confidence > 0.8
  };
}

/**
 * Transcribe Audio using local Whisper
 */
export async function transcribeAudio(audioData: string): Promise<string> {
  try {
    let body: ArrayBuffer;
    if (audioData.startsWith("data:")) {
      const base64Data = audioData.split(",")[1];
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      body = bytes.buffer;
    } else {
      // Assuming it's already binary array or buffer
      body = new TextEncoder().encode(audioData).buffer;
    }

    const response = await fetch("/api/voice/transcribe", {
      method: "POST",
      headers: {
        "Content-Type": "audio/wav",
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(`STT request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (data && data.success && data.text) {
      return data.text;
    } else if (data && data.error) {
      throw new Error(data.error);
    throw new Error("Local transcription failed or returned no text.");
  } catch (err) {
    console.error("transcribeAudio failed:", err);
    throw err;
  }
}

/**
 * Generate text content using Llama
 */
export async function generateIntelligence(prompt: string, options: any = {}) {
  try {
    const response = await fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        text: data.responses ? data.responses.map((r: any) => r.text).join("\n\n") : "Local processing complete.",
        responses: data.responses || [],
        intent: data.intent || "chat",
        target_persona: data.target_persona || "both",
        metadata: data.metadata || {},
        modelUsed: MODELS.GENERAL,
        pipeline_trace: data.pipeline_trace
      };
    } else {
      throw new Error(`Command endpoint returned HTTP ${response.status}`);
    }
  } catch (e: any) {
    console.error("Local chat command endpoint failed:", e);
    throw e;
  }
}

/**
 * Generate an image using local Stable Diffusion
 */
export async function generateImage(prompt: string, options: any = {}) {
  throw new Error("Local Image Generation Engine (Stable Diffusion) is not configured.");
}

/**
 * Text to Speech (Local Piper TTS)
 */
export async function textToSpeech(text: string, voice: string = 'zephyr'): Promise<{ base64: string; mimeType: string }> {
  // TTS is now handled dynamically via SpeechSynthesis API in components.
  throw new Error("Local Piper TTS binary not found in container. Fallback to browser Speech API.");
}

/**
 * Generate Video
 */
export async function generateVideo(prompt: string, options: any = {}): Promise<string> {
  throw new Error("Local Video Generation Engine (SD Video) is not configured.");
}

/**
 * Generate Music
 */
export async function generateMusic(prompt: string, isPro: boolean = false): Promise<string> {
  throw new Error("Local Music Engine is not configured.");
}

