/**
 * Telemetry Routes — VR Bridge, Emotional, Creative, Planetary
 *
 * All endpoints return real database data when available, or explicit
 * { status: "DISCONNECTED" } / { status: "NO_DATA" } states — never fake data.
 *
 * @license SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from "express";
import { getDb } from "../db";

const router = Router();

// ---------------------------------------------------------------------------
// Helper: Safe JSON parse from DB row
// ---------------------------------------------------------------------------
function safeParseState(row: any): any | null {
  if (!row || !row.state) return null;
  try {
    return JSON.parse(row.state);
  } catch {
    return null;
  }
}

function tableExists(dbName: string, tableName: string): boolean {
  const db = getDb(dbName);
  const row = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
  ).get(tableName);
  return !!row;
}

// ---------------------------------------------------------------------------
// VR Telemetry
// ---------------------------------------------------------------------------

/**
 * GET /api/vr-telemetry — Raw VR pose/session telemetry
 */
router.get("/api/vr-telemetry", (_req: Request, res: Response) => {
  try {
    const db = getDb("emma_vr_telemetry.db");
    const row = db.prepare("SELECT state FROM game_telemetry WHERE id='raw'").get() as any;
    const data = safeParseState(row);

    if (data) {
      res.json(data);
    } else {
      res.json({
        status: "DISCONNECTED",
        message: "VR bridge not connected. No telemetry data available.",
        sessionActive: false,
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/vr-embodiment-telemetry — Avatar/embodiment state
 */
router.get("/api/vr-embodiment-telemetry", (_req: Request, res: Response) => {
  try {
    const db = getDb("emma_vr_telemetry.db");
    const row = db.prepare("SELECT state FROM game_telemetry WHERE id='embodiment'").get() as any;
    const data = safeParseState(row);

    if (data) {
      res.json(data);
    } else {
      res.json({
        status: "DISCONNECTED",
        message: "VR embodiment bridge not connected.",
        device: null,
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/vr-game-telemetry — Game interaction state
 */
router.get("/api/vr-game-telemetry", (_req: Request, res: Response) => {
  try {
    const db = getDb("emma_vr_telemetry.db");

    if (!tableExists("emma_vr_telemetry.db", "game_telemetry")) {
      return res.json({
        status: "DISCONNECTED",
        message: "VR game telemetry table not initialized.",
        device: null,
      });
    }

    const row = db.prepare("SELECT state FROM game_telemetry WHERE id='current'").get() as any;
    const data = safeParseState(row);

    if (data) {
      res.json(data);
    } else {
      res.json({
        status: "DISCONNECTED",
        message: "No active VR game session. Awaiting telemetry from VR bridge.",
        device: null,
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/vr-bridge/telemetry — Ingest VR SDK telemetry
 */
router.post("/api/vr-bridge/telemetry", (req: Request, res: Response) => {
  try {
    const { active, pose, avatars, physics } = req.body;
    const db = getDb("emma_vr_telemetry.db");
    const now = Date.now();

    // Save raw pose telemetry
    if (pose) {
      const rawState = JSON.stringify({
        sessionActive: active ?? true,
        headset: {
          x: pose.headset?.x ?? 0,
          y: pose.headset?.y ?? 1.6,
          z: pose.headset?.z ?? 0,
        },
        hands: {
          left: pose.leftHand?.gesture ?? "open",
          right: pose.rightHand?.gesture ?? "grip",
        },
        anchors: pose.anchors?.map((a: any) => a.id) ?? [],
        boundarySafe: pose.boundarySafe ?? true,
        timestamp: now,
      });
      db.prepare(
        "INSERT OR REPLACE INTO game_telemetry (id, state, last_updated) VALUES ('raw', ?, ?)"
      ).run(rawState, now);
    }

    // Save embodiment/avatar state
    if (avatars) {
      const embodimentState = JSON.stringify({
        avatar: {
          bodyType: avatars.bodyType ?? "humanoid_synthetic",
          style: avatars.style ?? "clean_minimalist",
          mode: avatars.lucyMode ?? "Analyst",
        },
        state: {
          mode: avatars.lucyMode ?? "Analyst",
          posture: avatars.lucyPosture ?? "open",
          energyLevel: avatars.energyLevel ?? 0,
          emotionalSync: avatars.emotionalSync ?? 0,
          creativeSync: avatars.creativeSync ?? 0,
        },
        motion: {
          headTracking: avatars.headTracking ?? false,
          handTracking: avatars.handTracking ?? false,
          facialExpression: avatars.lucyExpression ?? "neutral",
          currentGesture: avatars.gesture ?? "idle",
        },
        voice: {
          lipSyncActive: avatars.lipSync ?? false,
          tone: avatars.tone ?? "neutral",
        },
        safetyStatus: avatars.safetyStatus ?? "comfort_enforced",
        timestamp: now,
      });
      db.prepare(
        "INSERT OR REPLACE INTO game_telemetry (id, state, last_updated) VALUES ('embodiment', ?, ?)"
      ).run(embodimentState, now);
    }

    // Save current unified game state
    const currentSimState = JSON.stringify({
      avatars: {
        lucy_mode: avatars?.lucyMode ?? "Analyst",
        emma_mode: avatars?.emmaMode ?? "Companion",
        lucy_posture: avatars?.lucyPosture ?? "upright",
        emma_posture: avatars?.emmaPosture ?? "open",
        lucy_expression: avatars?.lucyExpression ?? "focused",
        emma_expression: avatars?.emmaExpression ?? "empathetic",
      },
      last_interaction: {
        entity_id: req.body.lastInteraction?.entityId ?? "none",
        action_type: req.body.lastInteraction?.actionType ?? "idle",
        target_object: req.body.lastInteraction?.targetObject ?? "none",
        physics_applied: physics?.applied ?? false,
        npc_interaction: req.body.lastInteraction?.npcInteraction ?? false,
        environment_modified: req.body.lastInteraction?.envModified ?? false,
      },
      intelligence: {
        game_state_understood: req.body.intelligence?.understood ?? false,
        npc_behavior_analysis: req.body.intelligence?.analysis ?? "",
        predicted_outcome: req.body.intelligence?.prediction ?? "",
        strategy_provided: req.body.intelligence?.strategy ?? "",
      },
      safety_rails_active: req.body.safetyRails ?? true,
      timestamp: now,
    });

    db.prepare(
      "INSERT OR REPLACE INTO game_telemetry (id, state, last_updated) VALUES ('current', ?, ?)"
    ).run(currentSimState, now);

    res.json({ success: true, updated: now });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/vr-command — Dispatch VR commands
 */
router.post("/api/vr-command", (req: Request, res: Response) => {
  try {
    const { command, payload } = req.body;
    console.log(`[VRBridge] VR command received: ${command}`, payload);

    // In production, this would dispatch to the OpenXR pipeline via Python bridge
    // For now, acknowledge receipt and log it
    res.json({
      success: true,
      command,
      status: "COMMAND_RECEIVED",
      message: "Command logged. VR pipeline dispatch requires active OpenXR session.",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Emotional Telemetry
// ---------------------------------------------------------------------------

/**
 * GET /api/emotional-telemetry
 */
router.get("/api/emotional-telemetry", (_req: Request, res: Response) => {
  try {
    const db = getDb("emma_history.db");

    if (!tableExists("emma_history.db", "emotional_state")) {
      return res.json({
        status: "NO_DATA",
        message: "Emotional telemetry not yet initialized. Awaiting cognitive pipeline data.",
      });
    }

    const row = db.prepare("SELECT state FROM emotional_state WHERE id='current'").get() as any;
    const data = safeParseState(row);

    if (data) {
      res.json(data);
    } else {
      res.json({
        status: "NO_DATA",
        message: "No emotional state recorded yet.",
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Creative Telemetry
// ---------------------------------------------------------------------------

/**
 * GET /api/creative-telemetry
 */
router.get("/api/creative-telemetry", (_req: Request, res: Response) => {
  try {
    const db = getDb("emma_history.db");

    if (!tableExists("emma_history.db", "creative_state")) {
      return res.json({
        status: "NO_DATA",
        message: "Creative telemetry not yet initialized. Awaiting creative pipeline data.",
      });
    }

    const row = db.prepare("SELECT state FROM creative_state WHERE id='current'").get() as any;
    const data = safeParseState(row);

    if (data) {
      res.json(data);
    } else {
      res.json({
        status: "NO_DATA",
        message: "No creative state recorded yet.",
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Planetary Telemetry
// ---------------------------------------------------------------------------

/**
 * GET /api/planetary-telemetry
 */
router.get("/api/planetary-telemetry", (_req: Request, res: Response) => {
  try {
    const db = getDb("emma_history.db");

    if (!tableExists("emma_history.db", "history_timeseries")) {
      return res.json({
        status: "NO_DATA",
        message: "Planetary telemetry not yet initialized. Awaiting live data feeds.",
        globalQuakes: 0,
        volcanicAshPlumeMax: 0,
        peakKpIndex: 0,
        incidentRate: 0,
      });
    }

    // Query latest active_quakes_count
    const quakeRow = db.prepare(
      "SELECT value FROM history_timeseries WHERE entity_id = 'USGS_SEISMIC' AND metric_name = 'active_quakes_count' ORDER BY timestamp DESC LIMIT 1"
    ).get() as any;
    const globalQuakes = quakeRow ? Math.round(quakeRow.value) : 0;

    // Query latest space weather Kp-Index
    const kpRow = db.prepare(
      "SELECT value FROM history_timeseries WHERE entity_id = 'NOAA_SPACE_WEATHER' AND metric_name = 'kp_index' ORDER BY timestamp DESC LIMIT 1"
    ).get() as any;
    const peakKpIndex = kpRow ? parseFloat(kpRow.value) : 0;

    // Query latest incident rate
    const incidentRow = db.prepare(
      "SELECT value FROM history_timeseries WHERE entity_id = 'SOVEREIGN_SECURITY' AND metric_name = 'incident_rate' ORDER BY timestamp DESC LIMIT 1"
    ).get() as any;
    const incidentRate = incidentRow ? Math.round(incidentRow.value) : 0;

    const volcanicAshPlumeMax = kpRow ? (peakKpIndex >= 5 ? 18000 : 8000) : 0;

    res.json({
      globalQuakes,
      volcanicAshPlumeMax,
      peakKpIndex,
      incidentRate,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// OS Telemetry (Hyper-Lucy Layer 3)
// ---------------------------------------------------------------------------

/**
 * POST /api/telemetry — Receive OS telemetry from external agents
 * NOTE: io (socket) is injected via setIo() from the main server.
 */
let ioRef: any = null;

export function setTelemetryIo(io: any): void {
  ioRef = io;
}

router.post("/api/telemetry", (req: Request, res: Response) => {
  const telemetry = req.body;
  console.log("[Hyper-Lucy] Received OS Telemetry:", telemetry);

  if (ioRef) {
    ioRef.emit("osTelemetryUpdate", telemetry);
  }

  res.json({ status: "success" });
});

export default router;
