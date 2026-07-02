/**
 * @file WorkerManager.ts
 * @description Manages a pool of background execution threads for isolated task processing.
 * Enforces heartbeat monitoring and autonomous recovery if a worker thread hangs.
 */

import { Worker } from 'worker_threads';
import { EventBus } from './EventBus';
import crypto from 'crypto';

export type WorkerStatus = 'STARTING' | 'IDLE' | 'BUSY' | 'UNRESPONSIVE' | 'DEAD';

export interface WorkerInstance {
  id: string;
  thread: Worker | null;
  status: WorkerStatus;
  lastHeartbeat: number;
  currentTask: string | null;
}

export class WorkerManager {
  private static instance: WorkerManager;
  private workers: Map<string, WorkerInstance> = new Map();
  private readonly POOL_SIZE = 4;
  private readonly HEARTBEAT_TIMEOUT = 10000; // 10 seconds
  private watchdogTimer: NodeJS.Timeout;

  private constructor() {
    this.initializePool();
    // Start continuous watchdog for heartbeat failures
    this.watchdogTimer = setInterval(() => this.checkHeartbeats(), 5000);
  }

  public static getInstance(): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager();
    }
    return WorkerManager.instance;
  }

  private initializePool() {
    for (let i = 0; i < this.POOL_SIZE; i++) {
      this.spawnWorker();
    }
    EventBus.getInstance().emit('WorkerManager', 'WORKER_POOL_READY', { size: this.POOL_SIZE });
  }

  private spawnWorker(): WorkerInstance {
    const id = `worker-${crypto.randomUUID()}`;
    const worker: WorkerInstance = {
      id,
      thread: null, // Note: For a real impl, we'd point to a compiled worker.js script
      status: 'IDLE',
      lastHeartbeat: Date.now(),
      currentTask: null
    };

    // Simulated worker startup since we don't have the script yet
    this.workers.set(id, worker);
    EventBus.getInstance().emit('WorkerManager', 'WORKER_SPAWNED', { id });
    return worker;
  }

  /**
   * Called continuously to detect hung threads.
   */
  private checkHeartbeats() {
    const now = Date.now();
    for (const [id, worker] of this.workers.entries()) {
      if (worker.status !== 'DEAD' && (now - worker.lastHeartbeat > this.HEARTBEAT_TIMEOUT)) {
        console.warn(`[Watchdog] Worker ${id} unresponsive! Initiating recovery...`);
        worker.status = 'UNRESPONSIVE';
        EventBus.getInstance().emit('WorkerManager', 'WORKER_UNRESPONSIVE', { id }, 'critical');
        this.recoverWorker(id);
      }
    }
  }

  /**
   * Autonomous recovery of a dead or hung worker thread.
   */
  private recoverWorker(id: string) {
    const worker = this.workers.get(id);
    if (!worker) return;
    
    // Terminate old thread if it exists
    if (worker.thread) {
      worker.thread.terminate().catch(err => console.error(err));
    }
    
    worker.status = 'DEAD';
    this.workers.delete(id);
    EventBus.getInstance().emit('WorkerManager', 'WORKER_KILLED', { id });
    
    // Respawn replacement
    this.spawnWorker();
  }

  /**
   * Process a heartbeat ping from an active worker thread.
   */
  public registerHeartbeat(id: string) {
    const worker = this.workers.get(id);
    if (worker) {
      worker.lastHeartbeat = Date.now();
      if (worker.status === 'UNRESPONSIVE') {
        worker.status = worker.currentTask ? 'BUSY' : 'IDLE';
        EventBus.getInstance().emit('WorkerManager', 'WORKER_RECOVERED_AUTONOMOUSLY', { id });
      }
    }
  }

  public getStatus() {
    return Array.from(this.workers.values()).map(w => ({
      id: w.id,
      status: w.status,
      lastHeartbeat: w.lastHeartbeat,
      currentTask: w.currentTask
    }));
  }

  public shutdown() {
    clearInterval(this.watchdogTimer);
    for (const [id, worker] of this.workers.entries()) {
      if (worker.thread) worker.thread.terminate();
    }
  }
}
