/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CognitiveNode,
  NodeStatus,
  EventPriority,
  EventIntegrity,
} from "../../types";
import { useNodeStore } from "../../store/useNodeStore";

/**
 * ValidationLayer: Ensures NodeMesh reflects reality and maintains event integrity.
 * Detects desync, deduplicates events, and enforces schemas.
 */
export class ValidationLayer {
  private static instance: ValidationLayer;
  private eventHistory: Map<string, number> = new Map(); // idempotencyKey -> timestamp
  private maxHistory = 1000;

  private constructor() {
    // Start periodic truth verification
    setInterval(() => this.verifyTruth(), 60000);
  }

  static getInstance(): ValidationLayer {
    if (!this.instance) {
      this.instance = new ValidationLayer();
    }
    return this.instance;
  }

  /**
   * Validates an incoming event for integrity and deduplication.
   */
  validateEvent(
    nodeId: string,
    status: NodeStatus,
    priority: EventPriority,
    payload?: any,
  ): boolean {
    const idempotencyKey = `${nodeId}:${status}:${JSON.stringify(payload)}`;
    const now = Date.now();

    // 1. Deduplication
    const lastSeen = this.eventHistory.get(idempotencyKey);
    if (lastSeen && now - lastSeen < 500) {
      console.warn(`[EventIntegrity] Deduplicated event for node ${nodeId}`);
      return false;
    }

    // 2. Schema Enforcement (Simplified)
    if (!nodeId || !status || !priority) {
      console.error(
        `[EventIntegrity] Corrupted event detected: missing core fields.`,
      );
      return false;
    }

    // 3. Update history
    this.eventHistory.set(idempotencyKey, now);
    if (this.eventHistory.size > this.maxHistory) {
      const oldestKey = this.eventHistory.keys().next().value;
      this.eventHistory.delete(oldestKey);
    }

    return true;
  }

  /**
   * Verifies NodeMesh state against backend reality.
   */
  async verifyTruth() {
    const state = useNodeStore.getState();
    const nodes = state.nodes;
    let desyncDetected = false;

    // Example: Verify server nodes against current server list
    const serverNodes = nodes.filter((n) => n.id.startsWith("SVR_"));
    const actualServers = state.servers;

    if (serverNodes.length !== actualServers.length) {
      desyncDetected = true;
    }

    if (desyncDetected) {
      console.warn(
        "[ValidationLayer] Desync detected in NodeMesh. Triggering resync...",
      );
      state.emitEvent("LP1", NodeStatus.ALERT, EventPriority.SYSTEM, {
        action: "desync_detected",
        reason: "Node count mismatch",
      });

      // Auto-correct: Re-trigger server sync
      state.syncServers();
    }
  }

  /**
   * Generates an integrity signature for an event.
   */
  generateIntegrity(nodeId: string): EventIntegrity {
    const timestamp = Date.now();
    const idempotencyKey = crypto.randomUUID();
    return {
      idempotencyKey,
      timestamp,
      signature: btoa(`${nodeId}:${timestamp}:${idempotencyKey}`),
      origin: "LucyCore",
    };
  }
}
