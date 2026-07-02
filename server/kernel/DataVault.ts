/**
 * @file DataVault.ts
 * @description Durable storage for the OS. Implements the SQLite-backed event log and append-only ledger.
 * Subscribes to the EventBus to record system activity.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { EventBus, SystemEvent } from './EventBus';

export class DataVault {
  private static instance: DataVault;
  private db: Database.Database;

  private constructor() {
    const dbPath = path.join(process.cwd(), 'emma_ledger.db');
    this.db = new Database(dbPath);
    
    // Performance and safety pragmas
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    
    this.initializeSchema();
    this.attachToEventBus();
  }

  public static getInstance(): DataVault {
    if (!DataVault.instance) {
      DataVault.instance = new DataVault();
    }
    return DataVault.instance;
  }

  private initializeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_events (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        type TEXT NOT NULL,
        priority TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        payload TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_events_timestamp ON system_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_events_source ON system_events(source);
      CREATE INDEX IF NOT EXISTS idx_events_type ON system_events(type);
    `);
  }

  /**
   * Listen to ALL events on the EventBus and persist them to the durable ledger.
   */
  private attachToEventBus() {
    const insertStmt = this.db.prepare(`
      INSERT INTO system_events (id, source, type, priority, timestamp, payload)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Use a batched or immediate insert approach depending on load. 
    // For now, immediate insertion.
    EventBus.getInstance().onAny((event: SystemEvent) => {
      try {
        insertStmt.run(
          event.id,
          event.source,
          event.type,
          event.priority,
          event.timestamp,
          JSON.stringify(event.payload)
        );
      } catch (err) {
        console.error('[DataVault] Failed to persist event to ledger:', err);
      }
    });
  }

  /**
   * Retrieve historical events for recovery or UI streaming.
   */
  public getEvents(limit = 100, offset = 0, typeFilter?: string): any[] {
    if (typeFilter) {
      const stmt = this.db.prepare('SELECT * FROM system_events WHERE type = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?');
      return stmt.all(typeFilter, limit, offset);
    }
    const stmt = this.db.prepare('SELECT * FROM system_events ORDER BY timestamp DESC LIMIT ? OFFSET ?');
    return stmt.all(limit, offset);
  }
}
