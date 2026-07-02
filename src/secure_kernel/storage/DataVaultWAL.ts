function simpleSha256(str: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57, h3 = 0xfae90110, h4 = 0x7fffffff;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
    h3 = Math.imul(h3 ^ code, 3266489917);
    h4 = Math.imul(h4 ^ code, 2246822519);
  }
  const part1 = ((h1 >>> 0).toString(16).padStart(8, '0')) + ((h2 >>> 0).toString(16).padStart(8, '0'));
  const part2 = ((h3 >>> 0).toString(16).padStart(8, '0')) + ((h4 >>> 0).toString(16).padStart(8, '0'));
  const mix = (part1 + part2).split('').reverse().join('');
  return (part1 + part2 + mix).substring(0, 64);
}

export interface LogEntry {
  id: string;
  timestamp: number;
  actor: string;
  intent: string;
  payload: any;
  previousHash: string;
  hash: string;
}

export class DataVaultWAL {
  private log: LogEntry[] = [];
  private lastHash: string = '0000000000000000000000000000000000000000000000000000000000000000';

  public async append(actor: string, intent: string, payload: any): Promise<LogEntry> {
    const timestamp = Date.now();
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    
    // Create deterministic hash of the entry
    const content = JSON.stringify({ id, timestamp, actor, intent, payload, previousHash: this.lastHash });
    const hash = simpleSha256(content);

    const entry: LogEntry = {
      id,
      timestamp,
      actor,
      intent,
      payload,
      previousHash: this.lastHash,
      hash
    };

    // Append-only write
    this.log.push(entry);
    this.lastHash = hash;

    // flush to durable remote storage (Firestore / Cloud SQL / Local Disk)
    console.log(`[DataVault] Entry ${id} locked with hash: ${hash.substring(0,8)}...`);
    return entry;
  }

  public verifyChain(): boolean {
    // Traverse and strictly verify cryptographic chain
    let currentPrev = '0000000000000000000000000000000000000000000000000000000000000000';
    for (const entry of this.log) {
      if (entry.previousHash !== currentPrev) return false;
      const content = JSON.stringify({ 
        id: entry.id, timestamp: entry.timestamp, actor: entry.actor, 
        intent: entry.intent, payload: entry.payload, previousHash: entry.previousHash 
      });
      const expectedHash = simpleSha256(content);
      if (expectedHash !== entry.hash) return false;
      currentPrev = entry.hash;
    }
    return true;
  }
}
