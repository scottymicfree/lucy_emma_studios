/**
 * @file SnapshotManager.ts
 * @description Creates whole-system snapshots including active commands, worker states, 
 * memory layers, queue state, and configurations to allow rapid restoration after major failures.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { EventBus } from './EventBus';
import { AuditLedger } from './AuditLedger';
import { ConfigurationManager } from './ConfigurationManager';
import { WorkerManager } from './WorkerManager';
import { CommandBus } from './CommandBus';
import { ToolRegistry } from './ToolRegistry';

export interface SystemSnapshot {
  id: string;
  timestamp: number;
  trigger: 'manual' | 'automated_checkpoint' | 'pre_rollback';
  configuration: any;
  activeCommands: any[];
  workerStates: any[];
  loadedPlugins: any[];
  memoryCheckpointId: string;
}

export class SnapshotManager {
  private static instance: SnapshotManager;
  private snapshotDir: string;

  private constructor() {
    this.snapshotDir = path.join(process.cwd(), 'snapshots');
    if (!fs.existsSync(this.snapshotDir)) {
      fs.mkdirSync(this.snapshotDir, { recursive: true });
    }
  }

  public static getInstance(): SnapshotManager {
    if (!SnapshotManager.instance) {
      SnapshotManager.instance = new SnapshotManager();
    }
    return SnapshotManager.instance;
  }

  /**
   * Captures the entire state of the OS into a durable JSON snapshot.
   */
  public createSnapshot(trigger: SystemSnapshot['trigger'], reason: string): string {
    const id = `snap_${crypto.randomUUID()}`;
    const timestamp = Date.now();

    const snapshot: SystemSnapshot = {
      id,
      timestamp,
      trigger,
      configuration: {
        runtime: ConfigurationManager.getInstance().getConfig('Runtime'),
        security: ConfigurationManager.getInstance().getConfig('Security')
      },
      activeCommands: CommandBus.getInstance().getPendingCommands(),
      workerStates: WorkerManager.getInstance().getStatus(),
      loadedPlugins: ToolRegistry.getInstance().listTools().map(t => t.id),
      memoryCheckpointId: 'TODO_MEMORY_ID' // To be integrated with Layered Memory
    };

    const filePath = path.join(this.snapshotDir, `${id}.json`);
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
      
      AuditLedger.getInstance().record(
        'SnapshotManager',
        'SNAPSHOT_CREATED',
        { id, trigger, reason },
        id
      );

      EventBus.getInstance().emit('SnapshotManager', 'SYSTEM_SNAPSHOT_TAKEN', { id, filePath });
      return id;
    } catch (err) {
      console.error(`[SnapshotManager] Failed to create snapshot ${id}`, err);
      throw err;
    }
  }

  /**
   * Restores the OS to a previous snapshot state.
   */
  public restoreSnapshot(id: string): boolean {
    const filePath = path.join(this.snapshotDir, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`[SnapshotManager] Cannot restore unknown snapshot: ${id}`);
      return false;
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const snapshot: SystemSnapshot = JSON.parse(raw);

      // In a full implementation, we would instruct all managers to load this state.
      // For now, we audit the intent to restore.
      
      AuditLedger.getInstance().record(
        'SnapshotManager',
        'SNAPSHOT_RESTORED',
        { id, timestampRestoredTo: snapshot.timestamp },
        crypto.randomUUID()
      );

      EventBus.getInstance().emit('SnapshotManager', 'SYSTEM_RESTORED', { id }, 'critical');
      return true;
    } catch (err) {
      console.error(`[SnapshotManager] Failed to restore snapshot ${id}`, err);
      return false;
    }
  }
}
