/**
 * Lucy & Emma Control Studio - Electron App Wrapper
 * Boots the unified full-stack Node server and loads it inside a native window.
 */

const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const { fork } = require("child_process");
const http = require("http");

let serverProcess = null;
let mainWindow = null;

function startBackendServer() {
  console.log("[Electron Main] Spawning server process...");
  // Use compiled bundle in production, tsx in development
  const serverPath = path.join(__dirname, "dist", "server.cjs");
  
  serverProcess = fork(serverPath, [], {
    env: { ...process.env, NODE_ENV: "production", PORT: "3000" }
  });

  serverProcess.on("message", (msg) => {
    console.log(`[Electron Main - Server]:`, msg);
  });

  serverProcess.on("error", (err) => {
    console.error("[Electron Main] Server process error:", err);
  });
}

function pollHealth(url, timeoutMs, intervalMs) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
      }).on("error", retry);
    };
    
    const retry = () => {
      if (Date.now() - startTime > timeoutMs) {
        reject(new Error("Server timeout"));
      } else {
        setTimeout(check, intervalMs);
      }
    };
    
    check();
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Lucy & Emma Control Studio",
    backgroundColor: "#09090b",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "public", "icon.png"),
  });

  try {
    console.log("[Electron Main] Waiting for server health check...");
    await pollHealth("http://localhost:3000/api/health", 20000, 500);
    console.log("[Electron Main] Server is healthy, loading UI...");
    mainWindow.loadURL("http://localhost:3000");
  } catch (err) {
    console.error("[Electron Main] Failed to connect to local server.", err);
    dialog.showErrorBox("Startup Error", "Failed to start the local unified server. Check your environment setup.");
    app.quit();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackendServer();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  if (serverProcess) {
    console.log("[Electron Main] Gracefully shutting down server...");
    serverProcess.kill("SIGTERM");
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
