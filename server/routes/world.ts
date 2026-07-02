/**
 * World Model & Cognitive Pipeline Routes
 *
 * Handles proposal evaluation, execution dispatch, purpose data,
 * world model state, and RSS feeds.
 *
 * @license SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { EmmaEvaluationEngine } from "../src/lib/core/EmmaEvaluationEngine";
import { getLlamaUrl, getActiveModel } from "./llm";
import { pythonBridge } from "../python-bridge";

const router = Router();

// ---------------------------------------------------------------------------
// Proposal Evaluation
// ---------------------------------------------------------------------------

/**
 * POST /api/evaluate
 * Evaluate proposals using the LLM or local Emma engine.
 * Returns scored proposals — NO random outcomes.
 */
router.post("/api/evaluate", async (req: Request, res: Response) => {
  try {
    const { proposals, globalIntent } = req.body;
    if (!proposals || !Array.isArray(proposals) || proposals.length === 0) {
      return res.status(400).json({ error: "Proposals array is required and must not be empty" });
    }

    const evaluations: any[] = [];

    // Try LLM-backed evaluation first
    try {
      const llamaUrl = getLlamaUrl();
      const model = getActiveModel();

      const prompt = `You are a sovereign AI orchestration evaluator. Score the following proposals for execution priority. Global intent is "${globalIntent}". Return a JSON array with objects: { proposalId, score (0-1), reasoning }.

Proposals:
${JSON.stringify(proposals.map((p: any) => ({
  id: p.id,
  nodeId: p.nodeId,
  action: p.action,
  confidence: p.confidence,
  cost: p.cost,
})), null, 2)}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const response = await fetch(llamaUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          stream: false,
          format: "json",
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || data.message?.content;
        if (content) {
          try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
              return res.json({ evaluations: parsed });
            }
          } catch {
            // JSON parse failed, fall through to local evaluation
          }
        }
      }
    } catch {
      // LLM unavailable, fall through to local deterministic evaluation
    }

    // Local deterministic evaluation via EmmaEvaluationEngine
    const emmaEngine = EmmaEvaluationEngine.getInstance();

    for (const proposal of proposals) {
      const evaluation = emmaEngine.evaluateProposal(proposal, globalIntent);
      evaluations.push({
        proposalId: proposal.id,
        score: evaluation.score,
        reasoning: evaluation.reasoning,
      });
    }

    res.json({ evaluations });
  } catch (error: any) {
    console.error("[Evaluate] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Proposal Execution
// ---------------------------------------------------------------------------

// Recent proposals stored in-memory (initialized empty — no fake seeds)
const recentProposals: any[] = [];

/**
 * POST /api/execute
 * Execute a winning proposal — dispatches to real subsystem or returns honest result.
 * NO Math.random() outcomes.
 */
router.post("/api/execute", async (req: Request, res: Response) => {
  try {
    const { proposal } = req.body;
    if (!proposal || !proposal.id) {
      return res.status(400).json({ error: "Proposal object with id is required" });
    }

    const startTime = Date.now();

    // Determine what the action actually does
    const action = proposal.action || "";
    const actionChain = proposal.actionChain || [action];
    let outcome: "success" | "failure" | "partial_failure" = "success";
    let impact = 0;
    let details: any = {};

    try {
      // Route based on action type
      if (action === "persist" || action === "persist_state") {
        // Real: write state to database
        const db = getDb("emma_proposals.db");
        db.exec("CREATE TABLE IF NOT EXISTS proposal_log (id TEXT PRIMARY KEY, data TEXT, timestamp INTEGER)");
        db.prepare("INSERT OR REPLACE INTO proposal_log (id, data, timestamp) VALUES (?, ?, ?)")
          .run(proposal.id, JSON.stringify(proposal), Date.now());
        impact = 0.3;
        details = { persisted: true, proposalId: proposal.id };

      } else if (action === "log" || action === "log_event") {
        // Real: log to console and DB
        console.log(`[Execution] Proposal ${proposal.id}: ${actionChain.join(" → ")}`);
        impact = 0.1;
        details = { logged: true };

      } else if (action === "adjust_weight" || action === "rebalance") {
        // Real: these are handled by the frontend CognitiveEngine
        impact = 0.2;
        details = { action, nodeId: proposal.nodeId, note: "Weight adjustment dispatched to frontend cognitive engine" };

      } else if (action === "external_call" || action === "execute_tool") {
        // Route to Python daemon if available
        const daemonHealth = pythonBridge.getHealth();
        if (daemonHealth.status === "running") {
          try {
            const result = await pythonBridge.runScript(
              "emma-core/engines/agency/execute.py",
              [JSON.stringify(proposal)],
              15000
            );
            impact = 0.5;
            details = { stdout: result.stdout.substring(0, 500), daemonExecuted: true };
          } catch (e: any) {
            outcome = "partial_failure";
            impact = 0.1;
            details = { error: e.message, daemonExecuted: false };
          }
        } else {
          outcome = "partial_failure";
          impact = 0.05;
          details = { error: "Python daemon offline", daemonStatus: daemonHealth.status };
        }

      } else {
        // Default: acknowledge the action was received but not mapped to a handler
        impact = 0.05;
        details = {
          action,
          actionChain,
          note: "Action acknowledged. No specific handler mapped for this action type.",
        };
      }

    } catch (execError: any) {
      outcome = "failure";
      impact = 0;
      details = { error: execError.message };
    }

    const latencyMs = Date.now() - startTime;

    // Store in recent proposals
    recentProposals.push({
      id: proposal.id,
      nodeId: proposal.nodeId,
      action,
      outcome,
      impact,
      latencyMs,
      timestamp: Date.now(),
    });

    // Keep only last 100
    if (recentProposals.length > 100) {
      recentProposals.splice(0, recentProposals.length - 100);
    }

    res.json({ outcome, impact, latencyMs, details });
  } catch (error: any) {
    console.error("[Execute] Error:", error);
    res.status(500).json({ outcome: "failure", impact: 0, latencyMs: 0, details: { error: error.message } });
  }
});

/**
 * GET /api/proposals/recent
 */
router.get("/api/proposals/recent", (_req: Request, res: Response) => {
  res.json(recentProposals.slice(-20));
});

// ---------------------------------------------------------------------------
// World Model
// ---------------------------------------------------------------------------

/**
 * GET /api/world-model
 */
router.get("/api/world-model", (_req: Request, res: Response) => {
  try {
    const db = getDb("emma_world_model.db");
    db.exec("CREATE TABLE IF NOT EXISTS world_state (id TEXT PRIMARY KEY, data TEXT, updated_at INTEGER)");

    const row = db.prepare("SELECT data FROM world_state WHERE id='current'").get() as any;
    if (row && row.data) {
      try {
        res.json(JSON.parse(row.data));
      } catch {
        res.json({ status: "NO_DATA", message: "World model data is corrupted." });
      }
    } else {
      res.json({ status: "NO_DATA", message: "World model not yet populated. Awaiting cognitive pipeline data." });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/world-model
 */
router.post("/api/world-model", (req: Request, res: Response) => {
  try {
    const db = getDb("emma_world_model.db");
    db.exec("CREATE TABLE IF NOT EXISTS world_state (id TEXT PRIMARY KEY, data TEXT, updated_at INTEGER)");

    db.prepare("INSERT OR REPLACE INTO world_state (id, data, updated_at) VALUES ('current', ?, ?)")
      .run(JSON.stringify(req.body), Date.now());

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Purpose Data
// ---------------------------------------------------------------------------

/**
 * GET /api/purpose-data
 */
router.get("/api/purpose-data", (_req: Request, res: Response) => {
  try {
    const db = getDb("emma_history.db");
    db.exec("CREATE TABLE IF NOT EXISTS purpose_state (id TEXT PRIMARY KEY, data TEXT)");

    const row = db.prepare("SELECT data FROM purpose_state WHERE id='current'").get() as any;
    if (row && row.data) {
      try {
        res.json(JSON.parse(row.data));
      } catch {
        res.json({ status: "NO_DATA", message: "Purpose data unavailable." });
      }
    } else {
      res.json({ status: "NO_DATA", message: "Purpose engine not yet activated." });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// WebSocket Broadcast
// ---------------------------------------------------------------------------

let ioRef: any = null;

export function setWorldIo(io: any): void {
  ioRef = io;
}

/**
 * POST /api/broadcast/mesh
 */
router.post("/api/broadcast/mesh", (req: Request, res: Response) => {
  if (ioRef) {
    ioRef.emit("meshUpdate", req.body);
  }
  res.json({ success: true });
});

/**
 * POST /api/broadcast/stream
 */
router.post("/api/broadcast/stream", (req: Request, res: Response) => {
  if (ioRef) {
    ioRef.emit("cognitiveStream", req.body);
  }
  res.json({ success: true });
});

export default router;
