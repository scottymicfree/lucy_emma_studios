/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FiveMServer, NodeStatus, EventPriority } from '../../types';
import { useNodeStore } from '../../store/useNodeStore';
import { txAdminAdapter } from '../server_adapters/txAdminAdapter';

export class FiveMBridge {
  private static instance: FiveMBridge;
  private pollingIntervals: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): FiveMBridge {
    if (!FiveMBridge.instance) {
      FiveMBridge.instance = new FiveMBridge();
    }
    return FiveMBridge.instance;
  }

  public startPolling(server: FiveMServer, token: string) {
    if (this.pollingIntervals.has(server.id)) return;

    const interval = setInterval(async () => {
      const adapter = txAdminAdapter.getInstance();
      const updateServer = useNodeStore.getState().updateServer;
      const emitEvent = useNodeStore.getState().emitEvent;

      try {
        const status = await adapter.getStatus(server, token);
        updateServer(server.id, { 
          status: status.status as any, 
          players: status.players, 
          lastSync: Date.now() 
        });

        // Emit Telemetry Event
        emitEvent('TEL1', NodeStatus.ACTIVE, EventPriority.BACKGROUND, { 
          source: server.name, 
          players: status.players, 
          latency: status.latency 
        });

        if (status.status === 'online') {
          emitEvent(`SVR_${server.id}`, NodeStatus.HEARTBEAT, EventPriority.BACKGROUND, { 
            players: status.players, 
            latency: status.latency 
          });

          // If high load, trigger active load visual
          if (status.players > 50) {
            emitEvent(`SVR_${server.id}`, NodeStatus.ACTIVE, EventPriority.NORMAL, { load: 'high' });
          }
        } else {
          emitEvent(`SVR_${server.id}`, NodeStatus.ERROR, EventPriority.NORMAL, { 
            error: status.error 
          });
        }
      } catch (error) {
        console.error(`[FiveMBridge] Polling failed for server ${server.id}:`, error);
        emitEvent(`SVR_${server.id}`, NodeStatus.ERROR, EventPriority.NORMAL, { 
          error: 'Polling failed' 
        });
      }
    }, 10000); // Poll every 10 seconds

    this.pollingIntervals.set(server.id, interval);
  }

  public stopPolling(serverId: string) {
    const interval = this.pollingIntervals.get(serverId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(serverId);
    }
  }

  public stopAll() {
    this.pollingIntervals.forEach(interval => clearInterval(interval));
    this.pollingIntervals.clear();
  }
}
