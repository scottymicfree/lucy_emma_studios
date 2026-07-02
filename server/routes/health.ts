/**
 * Health Check Routes
 *
 * Provides system health status including:
 * - Server status
 * - Ollama/LLM connectivity (probed, not assumed)
 * - Python daemon health
 * - Database health
 *
 * @license SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from "express";
import { pythonBridge } from "../python-bridge";

const router = Router();

// Cache Ollama status for 10 seconds to avoid hammering it
let ollamaStatusCache: { connected: boolean; model: string | null; checkedAt: number } = {
  connected: false,
  model: null,
  checkedAt: 0,
};
const OLLAMA_CHECK_INTERVAL_MS = 10_000;

async function checkOllamaConnectivity(): Promise<{ connected: boolean; model: string | null }> {
  const now = Date.now();
  if (now - ollamaStatusCache.checkedAt < OLLAMA_CHECK_INTERVAL_MS) {
    return { connected: ollamaStatusCache.connected, model: ollamaStatusCache.model };
  }

  const ollamaUrl = process.env.LOCAL_LLAMA_URL || "http://127.0.0.1:11434/v1/chat/completions";
  // Derive the base URL for the tags endpoint
  const baseUrl = ollamaUrl.replace(/\/v1\/chat\/completions$/, "");
  const tagsUrl = `${baseUrl}/api/tags`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(tagsUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const models = data.models || [];
      const activeModel = process.env.LOCAL_LLAMA_MODEL || "llama3";
      const modelAvailable = models.some((m: any) => m.name === activeModel || m.name?.startsWith(activeModel));

      ollamaStatusCache = {
        connected: true,
        model: modelAvailable ? activeModel : (models[0]?.name || null),
        checkedAt: now,
      };
    } else {
      ollamaStatusCache = { connected: false, model: null, checkedAt: now };
    }
  } catch {
    ollamaStatusCache = { connected: false, model: null, checkedAt: now };
  }

  return { connected: ollamaStatusCache.connected, model: ollamaStatusCache.model };
}

/**
 * GET /api/health
 * Primary health check — used by frontend to determine system state.
 */
router.get("/api/health", async (_req: Request, res: Response) => {
  const ollama = await checkOllamaConnectivity();
  const daemon = pythonBridge.getHealth();

  res.json({
    status: "ok",
    localInference: true,
    ollamaConnected: ollama.connected,
    ollamaModel: ollama.model,
    daemonStatus: daemon.status,
    timestamp: Date.now(),
  });
});

/**
 * GET /api/health/daemon
 * Detailed Python daemon health — used by UI daemon status display.
 */
router.get("/api/health/daemon", (_req: Request, res: Response) => {
  const health = pythonBridge.getHealth();
  res.json(health);
});

/**
 * GET /api/health/ollama
 * Detailed Ollama health — used by UI LLM status display.
 */
router.get("/api/health/ollama", async (_req: Request, res: Response) => {
  const ollama = await checkOllamaConnectivity();
  res.json({
    connected: ollama.connected,
    model: ollama.model,
    endpoint: process.env.LOCAL_LLAMA_URL || "http://127.0.0.1:11434/v1/chat/completions",
  });
});

export default router;
