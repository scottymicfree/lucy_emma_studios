/**
 * LLM Proxy Routes — Local Ollama Integration
 *
 * Proxies requests to local Ollama instance.
 * NO mock fallbacks — returns 503 when Ollama is unreachable.
 *
 * @license SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from "express";

const router = Router();

// Configuration (mutable via POST /api/local-llama/config)
let LOCAL_LLAMA_URL = process.env.LOCAL_LLAMA_URL || "http://127.0.0.1:11434/v1/chat/completions";
let ACTIVE_LOCAL_MODEL = process.env.LOCAL_LLAMA_MODEL || "llama3";
let MEDIA_GENERATION_PIPELINE = "Stable Diffusion XL (Local ComfyUI)";

/**
 * GET /api/local-llama/config
 */
router.get("/api/local-llama/config", (_req: Request, res: Response) => {
  res.json({
    url: LOCAL_LLAMA_URL,
    model: ACTIVE_LOCAL_MODEL,
    mediaPipeline: MEDIA_GENERATION_PIPELINE,
  });
});

/**
 * POST /api/local-llama/config
 */
router.post("/api/local-llama/config", (req: Request, res: Response) => {
  const { url, model, mediaPipeline } = req.body;
  if (url !== undefined) LOCAL_LLAMA_URL = url;
  if (model !== undefined) ACTIVE_LOCAL_MODEL = model;
  if (mediaPipeline !== undefined) MEDIA_GENERATION_PIPELINE = mediaPipeline;
  res.json({
    success: true,
    url: LOCAL_LLAMA_URL,
    model: ACTIVE_LOCAL_MODEL,
    mediaPipeline: MEDIA_GENERATION_PIPELINE,
  });
});

/**
 * POST /v1/chat/completions
 * OpenAI-compatible endpoint — proxies to local Ollama.
 * Returns 503 if Ollama is unreachable (NO mock fallback).
 */
router.post("/v1/chat/completions", async (req: Request, res: Response) => {
  try {
    const { messages, model } = req.body;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch(LOCAL_LLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model || ACTIVE_LOCAL_MODEL,
          messages,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }

      // Ollama returned an error
      return res.status(response.status).json({
        error: "LLM_ERROR",
        message: `Ollama returned HTTP ${response.status}`,
        ollamaConnected: true,
      });
    } catch (e: any) {
      clearTimeout(timeout);

      if (e.name === "AbortError") {
        return res.status(504).json({
          error: "LLM_TIMEOUT",
          message: "Request to local LLM timed out after 30 seconds",
        });
      }

      // Connection refused / network error — Ollama not running
      return res.status(503).json({
        error: "LLM_OFFLINE",
        message: "Local LLM (Ollama) is not running. Start it with: ollama serve",
        endpoint: LOCAL_LLAMA_URL,
      });
    }
  } catch (error: any) {
    console.error("[LLM Proxy] Unexpected error:", error);
    res.status(500).json({ error: "INTERNAL_ERROR", message: error.message });
  }
});

/**
 * POST /api/embedding
 * Generate embeddings via local Ollama nomic-embed-text model.
 * Returns 503 if embedding service is unavailable (NO random vectors).
 */
router.post("/api/embedding", async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "INVALID_INPUT", message: "Text field is required" });
    }

    const embedUrl = process.env.LOCAL_EMBED_URL || "http://127.0.0.1:11434/api/embeddings";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch(embedUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "nomic-embed-text", prompt: text }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        if (data.embedding) {
          return res.json({ embedding: data.embedding });
        }
        return res.status(502).json({
          error: "EMBEDDING_INVALID",
          message: "Ollama returned a response but no embedding vector was present",
        });
      }

      return res.status(response.status).json({
        error: "EMBEDDING_ERROR",
        message: `Embedding service returned HTTP ${response.status}. Ensure nomic-embed-text is pulled: ollama pull nomic-embed-text`,
      });
    } catch (e: any) {
      clearTimeout(timeout);

      if (e.name === "AbortError") {
        return res.status(504).json({
          error: "EMBEDDING_TIMEOUT",
          message: "Embedding request timed out after 15 seconds",
        });
      }

      return res.status(503).json({
        error: "EMBEDDING_OFFLINE",
        message: "Embedding service (Ollama) is not running. Start it with: ollama serve",
        endpoint: embedUrl,
      });
    }
  } catch (error: any) {
    console.error("[Embedding] Unexpected error:", error);
    res.status(500).json({ error: "INTERNAL_ERROR", message: error.message });
  }
});

// Export config getters for other modules
export function getLlamaUrl(): string { return LOCAL_LLAMA_URL; }
export function getActiveModel(): string { return ACTIVE_LOCAL_MODEL; }

export default router;
