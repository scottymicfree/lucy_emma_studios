/**
 * Chat Routes — Cognitive Architecture Pipeline
 *
 * Handles chat messages, voice transcription, and memory compression.
 * Uses Python bridge for safe script execution (no exec()).
 *
 * @license SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from "express";
import path from "path";
import os from "os";
import fs from "fs";
import Database from "better-sqlite3";
import { getDb, DB_DIR } from "../db";
import { pythonBridge } from "../python-bridge";
import { lucyEmmaCognitiveArchitecture } from "../src/lib/core/LucyEmmaCognitiveArchitecture";

const router = Router();

/**
 * POST /api/chat/message
 */
router.post("/api/chat/message", async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    console.log(`[Cognitive Architecture] Ingesting command prompt: "${prompt}"`);

    const dbPath = path.join(DB_DIR, "emma_wisdom.db");
    const sqliteDb = new Database(dbPath, { fileMustExist: false });

    try {
      lucyEmmaCognitiveArchitecture.setDatabase(sqliteDb);
      const result = await lucyEmmaCognitiveArchitecture.execute(prompt, "operator");
      res.json(result);
    } catch (pipelineErr: any) {
      console.error("[Cognitive Architecture] Pipeline error:", pipelineErr);

      // Fallback: try Python runner via safe execFile
      try {
        const tempFilename = `tmp_chat_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.json`;
        const tempPath = path.join(os.tmpdir(), tempFilename);
        fs.writeFileSync(tempPath, JSON.stringify({ user_input: prompt }));

        const scriptPath = path.join(process.cwd(), "emma-core", "engines", "chat", "runner.py");
        const { stdout } = await pythonBridge.runScript(scriptPath, [tempPath]);

        // Cleanup temp file
        try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch {}

        const result = JSON.parse(stdout.trim());
        res.json(result);
      } catch (pyErr: any) {
        console.error("[Cognitive Architecture] Python fallback failed:", pyErr);
        res.status(503).json({
          error: "PIPELINE_OFFLINE",
          message: "Both the cognitive pipeline and Python fallback are unavailable.",
          details: pyErr.message,
        });
      }
    } finally {
      if (sqliteDb) sqliteDb.close();
    }
  } catch (err: any) {
    console.error("Error in /api/chat/message:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/voice/transcribe
 */
router.post(
  "/api/voice/transcribe",
  (req: Request, res: Response, next) => {
    // Use raw body parser for audio
    const contentType = req.headers["content-type"] || "";
    if (contentType.startsWith("audio/")) {
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => {
        (req as any).rawBody = Buffer.concat(chunks);
        next();
      });
    } else {
      next();
    }
  },
  async (req: Request, res: Response) => {
    try {
      const audioBuffer = (req as any).rawBody || req.body;
      if (!audioBuffer || audioBuffer.length === 0) {
        return res.status(400).json({ error: "No audio data received" });
      }

      const tempAudioPath = path.join(os.tmpdir(), `voice_${Date.now()}.wav`);
      fs.writeFileSync(tempAudioPath, audioBuffer);

      try {
        const scriptPath = path.join(process.cwd(), "emma-core", "engines", "chat", "transcribe.py");
        const { stdout } = await pythonBridge.runScript(scriptPath, [tempAudioPath]);

        // Cleanup
        try { if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath); } catch {}

        const result = JSON.parse(stdout.trim());
        res.json(result);
      } catch (pyErr: any) {
        // Cleanup
        try { if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath); } catch {}

        console.error("[Transcribe] Python runner failed:", pyErr);
        res.json({
          success: false,
          text: "",
          error: "Transcription service unavailable. Ensure Whisper is installed and Python daemon is running.",
        });
      }
    } catch (err: any) {
      console.error("Error in /api/voice/transcribe:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/memory/compress — Memory summarization
 */
router.post("/api/memory/compress", (req: Request, res: Response) => {
  try {
    const { messages, currentSummary } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    let summary = currentSummary || "System initiated. No historical drift recorded.";
    const facts: string[] = [];

    messages.forEach((msg: any) => {
      const text = msg.content || msg.text || "";
      if (!text) return;

      if (text.includes("/sim") || text.includes("simulation") || text.includes("Simulation")) {
        const sectorMatch =
          text.match(/--sector\s+["']([^"']+)["']/i) ||
          text.match(/--sector\s+([^\s]+)/i) ||
          text.match(/--target\s+["']([^"']+)["']/i);
        const sector = sectorMatch ? sectorMatch[1] : "unknown sector";
        facts.push(`Simulation initiated for sector ${sector}.`);
      }

      if (text.includes("/dream") || text.includes("dreaming")) {
        facts.push("Agent creative divergence loops fired via /dream command.");
      }
      if (text.includes("diagnostic") || text.includes("self-diagnostic")) {
        facts.push("Deep core self-diagnostic routine performed.");
      }
      if (text.includes("manifesto") || text.includes("Optimization Manifesto")) {
        facts.push("Optimization Manifesto compiled.");
      }
    });

    if (facts.length > 0) {
      const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
      summary += `\n[Updated ${timestamp}]: Absorbed ${facts.length} core milestone(s):\n` +
        facts.map((f) => `- ${f}`).join("\n");
    }

    res.json({ success: true, summary });
  } catch (err: any) {
    console.error("[Memory Compression] Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
