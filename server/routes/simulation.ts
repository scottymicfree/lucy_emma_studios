/**
 * Simulation Routes — CRUD for simulation tasks
 *
 * Uses pooled database connections. No mock data.
 *
 * @license SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from "express";
import { getDb } from "../db";

const router = Router();

/**
 * POST /api/simulation/start
 */
router.post("/api/simulation/start", (req: Request, res: Response) => {
  try {
    const { simId, targetSector, status, currentTick, maxTicks, failureVectorsDetected } = req.body;

    if (!simId || !targetSector || !maxTicks) {
      return res.status(400).json({
        success: false,
        error: "simId, targetSector, and maxTicks are required",
      });
    }

    const db = getDb("lucy_tasks.db");
    db.prepare(`
      INSERT OR REPLACE INTO simulation_tasks
      (sim_id, sector_target, current_status, ticks_processed, total_ticks, state_payload_json, last_updated_timestamp)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      simId,
      targetSector,
      status || "PENDING",
      currentTick || 0,
      maxTicks,
      JSON.stringify({ failureVectorsDetected: failureVectorsDetected || [] })
    );

    res.json({ success: true, message: `Simulation ${simId} started and logged.` });
  } catch (error: any) {
    console.error("[Simulation Start] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/simulation/update
 */
router.post("/api/simulation/update", (req: Request, res: Response) => {
  try {
    const { simId, status, currentTick, maxTicks, failureVectorsDetected } = req.body;

    if (!simId) {
      return res.status(400).json({ success: false, error: "simId is required" });
    }

    const db = getDb("lucy_tasks.db");
    const result = db.prepare(`
      UPDATE simulation_tasks
      SET current_status = ?, ticks_processed = ?, total_ticks = ?,
          state_payload_json = ?, last_updated_timestamp = datetime('now')
      WHERE sim_id = ?
    `).run(
      status || "RUNNING",
      currentTick || 0,
      maxTicks || 0,
      JSON.stringify({ failureVectorsDetected: failureVectorsDetected || [] }),
      simId
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: `Simulation ${simId} not found` });
    }

    res.json({ success: true, message: `Simulation ${simId} state updated.` });
  } catch (error: any) {
    console.error("[Simulation Update] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/simulation/active
 */
router.get("/api/simulation/active", (_req: Request, res: Response) => {
  try {
    const db = getDb("lucy_tasks.db");
    const activeTasks = db.prepare(`
      SELECT * FROM simulation_tasks
      WHERE current_status IN ('RUNNING', 'PAUSED', 'PENDING')
      ORDER BY last_updated_timestamp DESC
      LIMIT 1
    `).get() as any;

    if (activeTasks) {
      let payload: any = {};
      try {
        payload = JSON.parse(activeTasks.state_payload_json || "{}");
      } catch {
        payload = { failureVectorsDetected: [] };
      }

      return res.json({
        found: true,
        simulation: {
          simId: activeTasks.sim_id,
          targetSector: activeTasks.sector_target,
          status: activeTasks.current_status,
          currentTick: activeTasks.ticks_processed,
          maxTicks: activeTasks.total_ticks,
          failureVectorsDetected: payload.failureVectorsDetected || [],
          checkpointTimestamp: Date.now(),
        },
      });
    }

    res.json({ found: false });
  } catch (error: any) {
    console.error("[Simulation Active] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
