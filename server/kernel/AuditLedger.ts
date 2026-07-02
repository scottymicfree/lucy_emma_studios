/**
 * @file AuditLedger.ts
 * @description Provides append-only, cryptographic hash-chain integrity for critical system events.
 * Specifically audits commands, capabilities granted, and recovery actions.
 */

import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';
import { EventBus } from './EventBus';

export interface AuditRecord {
  id: string;
  timestamp: number;
  actor: string;
  action: string;
  details: any;
  previousHash: string;
  hash: string;
}

export class AuditLedger {
  private static instance: AuditLedger;
  private db: Database.Database;
  private lastHash: string = 'GENESIS_BLOCK';

  private constructor() {
    const dbPath = path.join(process.cwd(), 'emma_audit.db');
    this.db = new Database(dbPath);
    
    this.db.pragma('journal_mode = WAL');
    this.initializeSchema();
    this.loadLastHash();
  }

  public static getInstance(): AuditLedger {
    if (!AuditLedger.instance) {
      AuditLedger.instance = new AuditLedger();
    }
    return AuditLedger.instance;
  }

  private initializeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_chain (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        previous_hash TEXT NOT NULL,
        hash TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_chain(timestamp);
    `);
  }

  private loadLastHash() {
    const row = this.db.prepare('SELECT hash FROM audit_chain ORDER BY timestamp DESC LIMIT 1').get() as { hash: string } | undefined;
    if (row && row.hash) {
      this.lastHash = row.hash;
    }
  }

  /**
   * Generates a SHA-256 hash for the block.
   */
  private generateHash(id: string, timestamp: number, actor: string, action: string, details: string, previousHash: string): string {
    const data = `${id}|${timestamp}|${actor}|${action}|${details}|${previousHash}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Records an immutable entry into the audit chain.
   */
  public record(actor: string, action: string, details: any, correlationId?: string): AuditRecord {
    const id = correlationId || crypto.randomUUID();
    const timestamp = Date.now();
    const detailsStr = JSON.stringify(details);
    const hash = this.generateHash(id, timestamp, actor, action, detailsStr, this.lastHash);

    const record: AuditRecord = {
      id,
      timestamp,
      actor,
      action,
      details,
      previousHash: this.lastHash,
      hash
    };

    const insertStmt = this.db.prepare(`
      INSERT INTO audit_chain (id, timestamp, actor, action, details, previous_hash, hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      insertStmt.run(id, timestamp, actor, action, detailsStr, this.lastHash, hash);
      this.lastHash = hash;

      // Emit to EventBus for observability
      EventBus.getInstance().emit('AuditLedger', 'AUDIT_RECORD_APPENDED', record, 'high', id);
    } catch (err) {
      console.error('[AuditLedger] Failed to write audit record:', err);
    }

    return record;
  }

  /**
   * Verifies the integrity of the entire audit chain.
   */
  public verifyIntegrity(): boolean {
    const records = this.db.prepare('SELECT * FROM audit_chain ORDER BY timestamp ASC').all() as any[];
    
    let currentPrevHash = 'GENESIS_BLOCK';
    
    for (const rec of records) {
      if (rec.previous_hash !== currentPrevHash) {
        console.error(`[AuditLedger] Integrity check failed at record ${rec.id}: Invalid previous hash.`);
        return false;
      }
      
      const expectedHash = this.generateHash(rec.id, rec.timestamp, rec.actor, rec.action, rec.details, rec.previous_hash);
      if (expectedHash !== rec.hash) {
        console.error(`[AuditLedger] Integrity check failed at record ${rec.id}: Content hash mismatch.`);
        return false;
      }
      
      currentPrevHash = expectedHash;
    }
    
    return true;
  }
}
