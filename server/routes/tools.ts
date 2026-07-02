/**
 * Toolbelt Routes — Tool List & Execution
 *
 * Tool definitions loaded from config/tools.json.
 * Execution routed through real subsystems or returned as NOT_IMPLEMENTED.
 * No fake setTimeout theater.
 *
 * @license SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { EmmaEvaluationEngine } from "../src/lib/core/EmmaEvaluationEngine";
import { getDb, blastRadiusTraversal, crossLayerIntersection, shortestPath as graphShortestPath } from "../db";
import { Proposal } from "../src/types";

const router = Router();

// ---------------------------------------------------------------------------
// Load tool definitions from config file
// ---------------------------------------------------------------------------

let toolDefinitions: any[] = [];

function loadToolDefinitions(): void {
  const configPath = path.join(process.cwd(), "config", "tools.json");
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    toolDefinitions = JSON.parse(raw);
    console.log(`[Toolbelt] Loaded ${toolDefinitions.length} tool definitions from config/tools.json`);
  } catch (e) {
    console.error("[Toolbelt] Failed to load config/tools.json:", e);
    toolDefinitions = [];
  }
}

// Load on module init
loadToolDefinitions();

/**
 * GET /api/toolbelt/list
 */
router.get("/api/toolbelt/list", (_req: Request, res: Response) => {
  res.json(toolDefinitions);
});

/**
 * POST /api/toolbelt/execute
 */
router.post("/api/toolbelt/execute", async (req: Request, res: Response) => {
  try {
    const { toolId, input, userRole } = req.body;
    console.log(`[Toolbelt] Executing tool ${toolId} by ${userRole || "operator"}`);

    // Validate tool exists
    const tool = toolDefinitions.find((t: any) => t.id === toolId);
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: `Tool '${toolId}' not found in configuration.`,
      });
    }

    // Run Emma Emotional Evaluation on the execution proposal
    const isHighRisk = tool.riskLevel === "high";
    const syntheticProposal: Proposal = {
      id: `tool_${toolId}_${Date.now()}`,
      nodeId: "toolbelt_manager",
      action: "external_call",
      intentAlignment: userRole === "admin" ? 0.95 : 0.70,
      confidence: 0.9,
      cost: isHighRisk ? 0.8 : 0.25,
      novelty: 0.3,
    };

    const emmaInstance = EmmaEvaluationEngine.getInstance();
    const evaluation = emmaInstance.evaluateProposal(
      syntheticProposal,
      "Execute verified system automation via control studio toolbelt."
    );

    // Block if evaluation fails trust check
    if (evaluation.score < 0.45 || evaluation.trustTier === "external") {
      console.warn(`[Toolbelt-Emma] BLOCKED: ${toolId} — ${evaluation.reasoning}`);
      return res.status(403).json({
        success: false,
        message: `Blocked by Emma Resilience Engine: ${evaluation.reasoning} (Score: ${evaluation.score})`,
      });
    }

    // Execute the specific tool
    let output = "";

    if (toolId === "bounded_blast_radius") {
      const targetId = sanitizeInput(input?.target_node_id || input?.targetId || "");
      if (!targetId) {
        return res.status(400).json({ success: false, message: "target_node_id is required" });
      }

      const graphDb = getDb("emma_graph.db");
      const results = blastRadiusTraversal(graphDb, targetId);

      if (results.length === 0) {
        output = `[GRAPH QUERY] Bounded Blast-Radius Tracing\n\nNo downstream dependencies found for node "${targetId}".\nEnsure the graph database has been seeded with infrastructure data.`;
      } else {
        output = `[GRAPH QUERY] Bounded Blast-Radius Tracing\n\nTarget: "${targetId}"\nResults:\n` +
          JSON.stringify(results, null, 2);
      }

    } else if (toolId === "cross_layer_geo_semantic") {
      const sector = sanitizeInput(input?.sector_name || input?.sector || "");
      const eventId = sanitizeInput(input?.event_id || input?.eventId || "");
      if (!sector || !eventId) {
        return res.status(400).json({ success: false, message: "sector_name and event_id are required" });
      }

      const graphDb = getDb("emma_graph.db");
      const results = crossLayerIntersection(graphDb, sector, eventId);

      if (results.length === 0) {
        output = `[GRAPH QUERY] Cross-Layer Geo-Semantic Intersection\n\nNo intersections found for sector "${sector}" and event "${eventId}".\nEnsure the graph database contains the relevant location, event, and infrastructure nodes.`;
      } else {
        output = `[GRAPH QUERY] Cross-Layer Geo-Semantic Intersection\n\nSector: "${sector}", Event: "${eventId}"\nResults:\n` +
          JSON.stringify(results, null, 2);
      }

    } else if (toolId === "shortest_path_network") {
      const provider = sanitizeInput(input?.provider_name || input?.provider || "");
      const targetId = sanitizeInput(input?.target_node_id || input?.targetId || "");
      if (!provider || !targetId) {
        return res.status(400).json({ success: false, message: "provider_name and target_node_id are required" });
      }

      const graphDb = getDb("emma_graph.db");
      const results = graphShortestPath(graphDb, provider, targetId);

      if (!results) {
        output = `[GRAPH QUERY] Shortest Path Network Analytics\n\nNo path found between "${provider}" and "${targetId}".\nEnsure both nodes exist in the graph database.`;
      } else {
        output = `[GRAPH QUERY] Shortest Path Network Analytics\n\nProvider: "${provider}" → Target: "${targetId}"\nResults:\n` +
          JSON.stringify(results, null, 2);
      }

    } else if (toolId === "schema_path_extractor") {
      const text = (input?.text || "").toString();
      if (!text.trim()) {
        return res.status(400).json({ success: false, message: "text input is required" });
      }

      // Import SpatialSemanticEngine for path extraction
      // Note: This still uses the existing heuristic parser or Ollama-backed extraction
      try {
        const { SpatialSemanticEngine } = await import("../src/lib/core/SpatialSemanticEngine");
        const engine = SpatialSemanticEngine.getInstance();
        const results = await engine.extractSchemaPaths(text);
        output = `[SchemaLLMPathExtractor]\n\nInput: "${text}"\n\nExtracted Paths (${results.length}):\n` +
          JSON.stringify(results, null, 2);
      } catch (e: any) {
        output = `[SchemaLLMPathExtractor] Extraction failed: ${e.message}`;
      }

    } else if (toolId === "system_reboot" || toolId === "flush_memory" || toolId === "enable_debug") {
      // These are system administration tools that need real implementation
      output = `[SYSTEM] Tool '${toolId}' acknowledged.\n` +
        `Status: NOT_FULLY_IMPLEMENTED\n` +
        `This tool requires integration with the actual process management layer.\n` +
        `The Emma evaluation passed (score: ${evaluation.score.toFixed(2)}).`;

    } else {
      output = `[SYSTEM] Tool '${toolId}' is registered but has no execution handler.\n` +
        `Add implementation in server/routes/tools.ts.`;
    }

    res.json({
      success: true,
      message: `Tool '${toolId}' executed.`,
      output,
      evaluation: {
        score: evaluation.score,
        reasoning: evaluation.reasoning,
        trustTier: evaluation.trustTier,
      },
    });

  } catch (error: any) {
    console.error("[Toolbelt] Execution error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sanitize user input to prevent injection.
 * Strips characters that could be dangerous in shell or query contexts.
 */
function sanitizeInput(value: any): string {
  if (value === null || value === undefined) return "";
  return value.toString().replace(/['"\\;`$]/g, "").trim();
}

export default router;
