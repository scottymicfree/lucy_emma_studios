/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from 'axios';
import { FiveMServer, NodeStatus, EventPriority } from '../../types';

export class txAdminAdapter {
  private static instance: txAdminAdapter;
  private client = axios.create();
  private cooldowns: Map<string, number> = new Map(); // serverId:action -> timestamp
  private lastExecution: Map<string, number> = new Map(); // serverId -> timestamp
  private commandQueue: { serverId: string; action: string; timestamp: number }[] = [];

  private constructor() {}

  public static getInstance(): txAdminAdapter {
    if (!txAdminAdapter.instance) {
      txAdminAdapter.instance = new txAdminAdapter();
    }
    return txAdminAdapter.instance;
  }

  private async getHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  public async getStatus(server: FiveMServer, token: string) {
    const startTime = Date.now();
    try {
      const response = await this.client.get(`${server.baseUrl}/info.json`, {
        headers: await this.getHeaders(token),
        timeout: 5000
      });
      
      const latency = Date.now() - startTime;
      return {
        status: 'online',
        players: response.data.players?.length || 0,
        maxPlayers: response.data.vars?.sv_maxclients || 32,
        latency,
        version: response.data.version
      };
    } catch (error) {
      return {
        status: 'offline',
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  public async executeAction(server: FiveMServer, token: string, action: string, params: any = {}, sandbox = false) {
    const cooldownKey = `${server.id}:${action}`;
    const now = Date.now();

    // 1. Rate Limiting (Global per server)
    const lastSvrExec = this.lastExecution.get(server.id) || 0;
    if (now - lastSvrExec < 1000) {
      throw new Error(`Rate limit exceeded for server ${server.name}. Please wait.`);
    }

    // 2. Cooldowns for critical actions
    const lastActionExec = this.cooldowns.get(cooldownKey) || 0;
    const cooldownPeriod = action === 'restart_resource' ? 30000 : action === 'kick_player' ? 10000 : 2000;
    
    if (now - lastActionExec < cooldownPeriod) {
      const remaining = Math.ceil((cooldownPeriod - (now - lastActionExec)) / 1000);
      throw new Error(`Action ${action} is on cooldown. ${remaining}s remaining.`);
    }

    // 3. Sandbox Mode
    if (sandbox) {
      console.log(`[txAdmin] [SANDBOX] Simulating action ${action} on ${server.name}`, params);
      return { success: true, sandbox: true, message: 'Simulated execution successful' };
    }

    // 4. Command Queue Visibility
    this.commandQueue.push({ serverId: server.id, action, timestamp: now });
    if (this.commandQueue.length > 20) this.commandQueue.shift();

    try {
      // txAdmin specific endpoints
      let endpoint = '';
      let method: 'get' | 'post' = 'post';

      switch (action) {
        case 'restart_resource':
          endpoint = `/fxserver/commands`;
          params = { command: `ensure ${params.resourceName}` };
          break;
        case 'kick_player':
          endpoint = `/fxserver/commands`;
          params = { command: `kick ${params.playerId} "${params.reason || 'Kicked by Lucy Prime'}"` };
          break;
        case 'server_command':
          endpoint = `/fxserver/commands`;
          break;
        default:
          throw new Error(`Unsupported action: ${action}`);
      }

      const response = await this.client({
        method,
        url: `${server.baseUrl}${endpoint}`,
        headers: await this.getHeaders(token),
        data: params
      });

      // Update execution markers
      this.lastExecution.set(server.id, now);
      this.cooldowns.set(cooldownKey, now);

      return { success: true, data: response.data };
    } catch (error) {
      console.error(`[txAdmin] Action ${action} failed:`, error);
      throw error;
    }
  }

  public getCommandQueue() {
    return this.commandQueue;
  }
}
