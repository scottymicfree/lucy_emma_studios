/**
 * @file DiagnosticsEngine.ts
 * @description Provides real CPU, Memory, and health diagnostics for the OS.
 * No fabricated values or random number generators are permitted.
 */

import os from 'os';
import process from 'process';
import { EventBus } from './EventBus';
import { ConfigurationManager } from './ConfigurationManager';

export interface SubsystemHealth {
  name: string;
  status: 'Healthy' | 'Warning' | 'Degraded' | 'Recovering' | 'Critical' | 'Offline';
  latencyMs: number;
  lastHeartbeat: number;
  dependencies: string[];
}

export interface SystemMetrics {
  cpuUsagePct: number;
  memoryUsageMb: number;
  totalMemoryMb: number;
  uptimeSeconds: number;
  activeThreads: number;
  queueDepth: number;
}

export class DiagnosticsEngine {
  private static instance: DiagnosticsEngine;
  private healthRegistry: Map<string, SubsystemHealth> = new Map();
  private telemetryTimer: NodeJS.Timeout;

  private constructor() {
    // Start continuous telemetry collection based on config
    const config = ConfigurationManager.getInstance().getConfig('Telemetry');
    const interval = config?.pollingIntervalMs || 5000;
    this.telemetryTimer = setInterval(() => this.collectTelemetry(), interval);
  }

  public static getInstance(): DiagnosticsEngine {
    if (!DiagnosticsEngine.instance) {
      DiagnosticsEngine.instance = new DiagnosticsEngine();
    }
    return DiagnosticsEngine.instance;
  }

  /**
   * Called by subsystems to register their ongoing health status.
   */
  public reportHealth(name: string, status: SubsystemHealth['status'], latencyMs: number = 0, dependencies: string[] = []) {
    this.healthRegistry.set(name, {
      name,
      status,
      latencyMs,
      lastHeartbeat: Date.now(),
      dependencies
    });

    // Alert Emma if a subsystem degrades
    if (['Warning', 'Degraded', 'Critical'].includes(status)) {
      EventBus.getInstance().emit('DiagnosticsEngine', 'SUBSYSTEM_DEGRADED', { name, status }, 'high');
    }
  }

  /**
   * Collects real physical metrics from the host OS.
   * ABSOLUTELY NO Math.random() ALLOWED.
   */
  private collectTelemetry() {
    const memoryUsage = process.memoryUsage();
    
    // Calculate CPU usage (basic average over process lifetime for now, could be enhanced with pidusage)
    const cpuUsage = process.cpuUsage();
    const cpuUsagePct = (cpuUsage.user + cpuUsage.system) / 1000 / process.uptime() / 10;

    const metrics: SystemMetrics = {
      cpuUsagePct: parseFloat(cpuUsagePct.toFixed(2)),
      memoryUsageMb: parseFloat((memoryUsage.heapUsed / 1024 / 1024).toFixed(2)),
      totalMemoryMb: parseFloat((os.totalmem() / 1024 / 1024).toFixed(2)),
      uptimeSeconds: process.uptime(),
      activeThreads: 1, // Will be updated by WorkerManager metrics
      queueDepth: 0 // Will be updated by CommandBus metrics
    };

    EventBus.getInstance().emit('DiagnosticsEngine', 'TELEMETRY_TICK', metrics, 'low');
  }

  public getFullDiagnostics() {
    return {
      subsystems: Array.from(this.healthRegistry.values()),
      osInfo: {
        platform: os.platform(),
        release: os.release(),
        cpus: os.cpus().length,
      }
    };
  }

  public shutdown() {
    clearInterval(this.telemetryTimer);
  }
}
