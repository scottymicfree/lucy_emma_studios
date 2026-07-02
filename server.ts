/**
 * LUCY & EMMA Sovereign Architecture — Core Orchestrator
 *
 * Refactored Production Entry Point.
 *
 * @license SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

import { initAllDatabases } from "./server/db";
import { pythonBridge } from "./server/python-bridge";

// Import Route Modules
import healthRoutes from "./server/routes/health";
import llmRoutes from "./server/routes/llm";
import chatRoutes from "./server/routes/chat";
import toolRoutes from "./server/routes/tools";
import simulationRoutes from "./server/routes/simulation";
import telemetryRoutes, { setTelemetryIo } from "./server/routes/telemetry";
import worldRoutes, { setWorldIo } from "./server/routes/world";
import mirrorRoutes from "./server/routes/mirror";

dotenv.config();

// ---------------------------------------------------------------------------
// System Initialization
// ---------------------------------------------------------------------------

console.log("=======================================================");
console.log("    LUCY AI CORE & EMMA COGNITIVE ENGINE Bootloader    ");
console.log("=======================================================");

// 1. Initialize databases and graph schema
try {
  initAllDatabases();
} catch (e) {
  console.error("[Bootloader] FATAL: Database initialization failed:", e);
  process.exit(1);
}

// 2. Start Python Daemon Manager
pythonBridge.start().catch((err) => {
  console.error("[Bootloader] Python daemon failed to start:", err);
});

// ---------------------------------------------------------------------------
// Server Setup
// ---------------------------------------------------------------------------

const app = express();
const httpServer = createServer(app);

// CORS Hardening: Localhost only
const ALLOWED_ORIGINS = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.some((regex) => regex.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
  },
});

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.some((regex) => regex.test(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "50mb" }));

// Rate Limiting (Phase 2 requirement)
let rateLimit: any = null;
try {
  const expressRateLimit = require("express-rate-limit");
  rateLimit = expressRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "TOO_MANY_REQUESTS", message: "Rate limit exceeded." },
  });
  app.use(rateLimit);
  console.log("[Security] Rate limiting enabled");
} catch (e) {
  console.warn("[Security] express-rate-limit not installed, running without rate limits.");
}

// ---------------------------------------------------------------------------
// WebSockets (Injection into routes)
// ---------------------------------------------------------------------------

setTelemetryIo(io);
setWorldIo(io);

io.on("connection", (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// ---------------------------------------------------------------------------
// Mount Route Modules
// ---------------------------------------------------------------------------

app.use(healthRoutes);
app.use(llmRoutes);
app.use(chatRoutes);
app.use(toolRoutes);
app.use(simulationRoutes);
app.use(telemetryRoutes);
app.use(worldRoutes);
app.use(mirrorRoutes);

// RSS Feeds Proxy (Moved from monolith)
import Parser from "rss-parser";
const rssParser = new Parser({
  customFields: { item: ["gdacs:severity", "gdacs:country", "gdacs:eventtype"] },
  requestOptions: {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
  },
});
app.get("/api/rss/:source", async (req, res) => {
  try {
    const { source } = req.params;
    const urls: Record<string, string> = {
      gdacs: "https://www.gdacs.org/xml/rss.xml",
      noaa: "https://services.swpc.noaa.gov/text/wwv.txt",
    };
    if (!urls[source]) return res.status(400).json({ error: "Unknown source" });
    if (source === "gdacs") {
      const feed = await rssParser.parseURL(urls.gdacs);
      return res.json(feed);
    } else {
      const response = await fetch(urls[source]);
      const text = await response.text();
      return res.send(text);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Frontend / Vite Integration
// ---------------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Setup Vite for development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(process.cwd(), "dist/client")));
    app.use("*", (_req, res) => {
      res.sendFile(path.join(process.cwd(), "dist/client/index.html"));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  httpServer.listen(PORT, () => {
    console.log(`\n🚀 Sovereign System active on http://localhost:${PORT}`);
  });
}

// Graceful Shutdown
function gracefulShutdown() {
  console.log("\n[Bootloader] Initiating graceful shutdown...");
  pythonBridge.stop();
  const { closeAll } = require("./server/db");
  closeAll();
  httpServer.close(() => {
    console.log("[Bootloader] Server closed.");
    process.exit(0);
  });
}
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

startServer();
