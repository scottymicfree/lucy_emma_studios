export interface WALEntry {
  id: string;
  timestamp: number;
  actor: string;
  action: string;
  payload: any;
  previousHash: string;
  hash: string;
  signature?: string;
}

export class DataVaultWAL {
  private static instance: DataVaultWAL;
  private log: WALEntry[] = [];

  private constructor() {}

  public static getInstance(): DataVaultWAL {
    if (!DataVaultWAL.instance) {
      DataVaultWAL.instance = new DataVaultWAL();
    }
    return DataVaultWAL.instance;
  }

  private async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  }

  public async append(
    actor: string,
    action: string,
    payload: any,
  ): Promise<WALEntry> {
    const previousHash =
      this.log.length > 0 ? this.log[this.log.length - 1].hash : "0";
    const timestamp = Date.now();
    const id = crypto.randomUUID();

    const dataToHash = JSON.stringify({
      id,
      timestamp,
      actor,
      action,
      payload,
      previousHash,
    });
    const hash = await this.hashData(dataToHash);

    const entry: WALEntry = {
      id,
      timestamp,
      actor,
      action,
      payload,
      previousHash,
      hash,
    };

    this.log.push(entry);
    return entry;
  }

  public getLog(): WALEntry[] {
    return [...this.log];
  }

  public async verifyIntegrity(): Promise<boolean> {
    for (let i = 0; i < this.log.length; i++) {
      const entry = this.log[i];
      const dataToHash = JSON.stringify({
        id: entry.id,
        timestamp: entry.timestamp,
        actor: entry.actor,
        action: entry.action,
        payload: entry.payload,
        previousHash: entry.previousHash,
      });
      const expectedHash = await this.hashData(dataToHash);
      if (entry.hash !== expectedHash) {
        return false;
      }
      if (i > 0) {
        if (entry.previousHash !== this.log[i - 1].hash) {
          return false;
        }
      } else {
        if (entry.previousHash !== "0") {
          return false;
        }
      }
    }
    return true;
  }
}

export const dataVault = DataVaultWAL.getInstance();
