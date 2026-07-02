/**
 * Python Daemon Bridge — Lifecycle Manager with Auto-Restart
 *
 * Manages the emma-core Python process as a graceful optional subsystem.
 * Features:
 * - Auto-restart with exponential backoff (3 attempts)
 * - Health endpoint integration
 * - Graceful shutdown on process exit
 * - Cross-platform Python binary detection
 *
 * @license SPDX-License-Identifier: Apache-2.0
 */

import { spawn, ChildProcess, execFile } from "child_process";
import path from "path";
import os from "os";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DaemonHealth {
  status: "running" | "stopped" | "restarting" | "failed";
  pid: number | null;
  uptime: number; // seconds
  restarts: number;
  lastError: string | null;
  pythonBinary: string | null;
}

// ---------------------------------------------------------------------------
// Python Binary Detection
// ---------------------------------------------------------------------------

let resolvedPythonBinary: string | null = null;

/**
 * Detect the correct Python binary for this platform.
 * Tries python3, python, py (Windows launcher) in order.
 */
async function detectPython(): Promise<string | null> {
  if (resolvedPythonBinary) return resolvedPythonBinary;

  const candidates = process.platform === "win32"
    ? ["python", "python3", "py"]
    : ["python3", "python"];

  for (const cmd of candidates) {
    try {
      const result = await new Promise<boolean>((resolve) => {
        const proc = spawn(cmd, ["--version"], { stdio: "pipe", shell: false });
        proc.on("error", () => resolve(false));
        proc.on("close", (code) => resolve(code === 0));
        // Kill after 5 seconds if hanging
        setTimeout(() => { proc.kill(); resolve(false); }, 5000);
      });

      if (result) {
        resolvedPythonBinary = cmd;
        console.log(`[PythonBridge] Detected Python binary: ${cmd}`);
        return cmd;
      }
    } catch {
      // Try next candidate
    }
  }

  console.warn("[PythonBridge] No Python binary found. Python daemon will be unavailable.");
  return null;
}

// ---------------------------------------------------------------------------
// Daemon Manager
// ---------------------------------------------------------------------------

class PythonDaemonManager {
  private static instance: PythonDaemonManager;

  private process: ChildProcess | null = null;
  private status: DaemonHealth["status"] = "stopped";
  private pid: number | null = null;
  private startTime: number = 0;
  private restartCount: number = 0;
  private lastError: string | null = null;
  private maxRestarts: number = 3;
  private restartDelayMs: number = 2000; // Base delay, doubled each attempt
  private restartTimer: NodeJS.Timeout | null = null;
  private isShuttingDown: boolean = false;
  private scriptPath: string;

  private constructor() {
    this.scriptPath = path.join(process.cwd(), "emma-core", "main.py");
  }

  public static getInstance(): PythonDaemonManager {
    if (!PythonDaemonManager.instance) {
      PythonDaemonManager.instance = new PythonDaemonManager();
    }
    return PythonDaemonManager.instance;
  }

  /**
   * Start the Python daemon process.
   */
  public async start(): Promise<void> {
    if (this.status === "running") {
      console.log("[PythonBridge] Daemon already running.");
      return;
    }

    const pythonBin = await detectPython();
    if (!pythonBin) {
      this.status = "failed";
      this.lastError = "No Python binary found on system PATH. Install Python 3.10+ and add to PATH.";
      console.error(`[PythonBridge] ${this.lastError}`);
      return;
    }

    this.spawn(pythonBin);
  }

  private spawn(pythonBin: string): void {
    console.log(`[PythonBridge] Spawning: ${pythonBin} ${this.scriptPath}`);
    this.status = "restarting";

    try {
      this.process = spawn(pythonBin, [this.scriptPath], {
        env: { ...process.env },
        stdio: ["pipe", "pipe", "pipe"],
        shell: false,
      });

      this.pid = this.process.pid ?? null;
      this.startTime = Date.now();
      this.status = "running";

      console.log(`[PythonBridge] Daemon started (PID: ${this.pid})`);

      // stdout logging
      this.process.stdout?.on("data", (data: Buffer) => {
        const text = data.toString().trim();
        if (text) {
          console.log(`[E.M.M.A. Daemon] ${text}`);
        }
      });

      // stderr logging
      this.process.stderr?.on("data", (data: Buffer) => {
        const text = data.toString().trim();
        if (text) {
          console.error(`[E.M.M.A. Daemon Error] ${text}`);
        }
      });

      // Handle spawn errors
      this.process.on("error", (err: Error) => {
        console.error(`[PythonBridge] Spawn error: ${err.message}`);
        this.status = "failed";
        this.lastError = err.message;
        this.pid = null;
        this.attemptRestart(pythonBin);
      });

      // Handle process exit
      this.process.on("close", (code: number | null, signal: string | null) => {
        console.log(`[PythonBridge] Daemon exited (code: ${code}, signal: ${signal})`);
        this.pid = null;

        if (this.isShuttingDown) {
          this.status = "stopped";
          return;
        }

        if (code !== 0) {
          this.status = "failed";
          this.lastError = `Process exited with code ${code}`;
          this.attemptRestart(pythonBin);
        } else {
          this.status = "stopped";
        }
      });

    } catch (err: any) {
      this.status = "failed";
      this.lastError = err.message;
      console.error(`[PythonBridge] Failed to spawn daemon: ${err.message}`);
    }
  }

  /**
   * Attempt to restart with exponential backoff.
   */
  private attemptRestart(pythonBin: string): void {
    if (this.isShuttingDown) return;

    if (this.restartCount >= this.maxRestarts) {
      console.error(
        `[PythonBridge] Max restart attempts (${this.maxRestarts}) exhausted. ` +
        `Daemon will remain offline. Check Python installation and emma-core/main.py for errors.`
      );
      this.status = "failed";
      return;
    }

    this.restartCount++;
    const delay = this.restartDelayMs * Math.pow(2, this.restartCount - 1);
    console.log(
      `[PythonBridge] Scheduling restart attempt ${this.restartCount}/${this.maxRestarts} ` +
      `in ${delay}ms...`
    );

    this.status = "restarting";
    this.restartTimer = setTimeout(() => {
      this.spawn(pythonBin);
    }, delay);
  }

  /**
   * Stop the Python daemon gracefully.
   */
  public stop(): void {
    this.isShuttingDown = true;

    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    if (this.process) {
      console.log(`[PythonBridge] Stopping daemon (PID: ${this.pid})...`);

      // Try graceful SIGTERM first, then SIGKILL after timeout
      this.process.kill("SIGTERM");

      const killTimer = setTimeout(() => {
        if (this.process && !this.process.killed) {
          console.warn("[PythonBridge] Daemon did not exit gracefully, sending SIGKILL...");
          this.process.kill("SIGKILL");
        }
      }, 5000);

      this.process.once("close", () => {
        clearTimeout(killTimer);
        this.process = null;
        this.pid = null;
        this.status = "stopped";
        console.log("[PythonBridge] Daemon stopped successfully.");
      });
    } else {
      this.status = "stopped";
    }
  }

  /**
   * Get daemon health information for the /api/health/daemon endpoint.
   */
  public getHealth(): DaemonHealth {
    const uptime = this.status === "running" && this.startTime > 0
      ? Math.floor((Date.now() - this.startTime) / 1000)
      : 0;

    return {
      status: this.status,
      pid: this.pid,
      uptime,
      restarts: this.restartCount,
      lastError: this.lastError,
      pythonBinary: resolvedPythonBinary,
    };
  }

  /**
   * Run a one-shot Python script (replaces exec() with safe execFile()).
   * Returns { stdout, stderr } on completion.
   */
  public async runScript(
    scriptPath: string,
    args: string[] = [],
    timeoutMs: number = 30000
  ): Promise<{ stdout: string; stderr: string }> {
    const pythonBin = await detectPython();
    if (!pythonBin) {
      throw new Error("No Python binary found. Cannot execute script.");
    }

    return new Promise((resolve, reject) => {
      const proc = execFile(
        pythonBin,
        [scriptPath, ...args],
        {
          env: { ...process.env },
          timeout: timeoutMs,
          maxBuffer: 10 * 1024 * 1024, // 10MB
        },
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`Script execution failed: ${error.message}. stderr: ${stderr}`));
          } else {
            resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
          }
        }
      );
    });
  }

  /**
   * Reset restart counter (call after a successful health check period).
   */
  public resetRestartCounter(): void {
    if (this.status === "running") {
      this.restartCount = 0;
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton Export
// ---------------------------------------------------------------------------

export const pythonBridge = PythonDaemonManager.getInstance();
