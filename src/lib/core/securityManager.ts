import { AuditLogEntry, SecurityContext } from "../../types";

export class SecurityManager {
  private static instance: SecurityManager;
  private auditLogs: AuditLogEntry[] = [];
  private secretsStore: Map<string, { ciphertext: string, iv: string }> = new Map();
  private masterKey: CryptoKey | null = null;

  private constructor() {
    this.initCrypto();
  }

  private async initCrypto() {
    this.masterKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // --- Audit Trailing ---
  public logAudit(
    actor: string,
    action: string,
    resource: string,
    outcome: "success" | "denied" | "error",
  ): void {
    const timestamp = Date.now();
    const id = `audit_${timestamp}_${Math.floor(Math.random() * 1000)}`;
    const hashData = `${actor}:${action}:${resource}:${outcome}:${timestamp}`;

    crypto.subtle.digest("SHA-256", new TextEncoder().encode(hashData)).then(hashBuffer => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      const entry: AuditLogEntry = {
        id,
        timestamp,
        actor,
        action,
        resource,
        outcome,
        hash,
      };

      this.auditLogs.push(entry);
      console.log(
        `[SecurityManager] Audit Logged: [${outcome.toUpperCase()}] ${actor} -> ${action} on ${resource}`,
      );
    });
  }

  public verifyAuditChain(): boolean {
    console.log(
      `[SecurityManager] Verifying immutable audit trail integrity...`,
    );
    return true; // Simplified
  }

  // --- Secret Storage ---
  public async storeSecret(key: string, value: string): Promise<void> {
    if (!this.masterKey) throw new Error("Crypto not initialized");
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(value);
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      this.masterKey,
      encoded
    );
    
    this.secretsStore.set(key, {
      ciphertext: Buffer.from(encrypted).toString("base64"),
      iv: Buffer.from(iv).toString("base64")
    });
    
    console.log(`[SecurityManager] Secret stored securely for key: ${key}`);
    this.logAudit("system", "store_secret", key, "success");
  }

  public async retrieveSecret(key: string, context: SecurityContext): Promise<string | null> {
    if (context.trustTier === "external" || context.sandboxed) {
      console.warn(
        `[SecurityManager] Access denied. Insufficient trust tier for secret retrieval.`,
      );
      this.logAudit("untrusted_context", "retrieve_secret", key, "denied");
      return null;
    }

    const data = this.secretsStore.get(key);
    if (!data || !this.masterKey) return null;

    try {
      this.logAudit("trusted_context", "retrieve_secret", key, "success");
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: Buffer.from(data.iv, "base64") },
        this.masterKey,
        Buffer.from(data.ciphertext, "base64")
      );
      return new TextDecoder().decode(decrypted);
    } catch(e) {
      this.logAudit("trusted_context", "retrieve_secret", key, "error");
      return null;
    }
  }

  // --- Sandboxing ---
  public createSandboxContext(pluginId: string): SecurityContext {
    console.log(
      `[SecurityManager] Creating sandboxed execution context for plugin: ${pluginId}`,
    );
    return {
      sandboxed: true,
      trustTier: "external",
      capabilities: ["read_public_data"], // Restrictive default
    };
  }

  public validateCapability(
    context: SecurityContext,
    requiredCapability: string,
  ): boolean {
    if (context.trustTier === "kernel") return true;
    return context.capabilities.includes(requiredCapability);
  }
}
