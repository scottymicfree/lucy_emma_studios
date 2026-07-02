/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useNodeStore } from '../store/useNodeStore';
import { NodeStatus, EventPriority } from '../types';

export enum WSStatus {
  CONNECTING = 'CONNECTING',
  OPEN = 'OPEN',
  CLOSING = 'CLOSING',
  CLOSED = 'CLOSED',
  ERROR = 'ERROR',
}

interface WSConfig {
  url: string;
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: any) => void;
  retryInterval?: number;
  maxRetries?: number;
}

/**
 * WebSocket Manager with Retry/Backoff and Diagnostics
 */
export class WSManager {
  private socket: WebSocket | null = null;
  private status: WSStatus = WSStatus.CLOSED;
  private retryCount = 0;
  private config: WSConfig;
  private reconnectTimer: any = null;

  constructor(config: WSConfig) {
    this.config = {
      retryInterval: 3000,
      maxRetries: 10,
      ...config,
    };
  }

  public connect() {
    if (this.status === WSStatus.OPEN || this.status === WSStatus.CONNECTING) return;

    this.status = WSStatus.CONNECTING;
    this.updateStatus();

    try {
      this.socket = new WebSocket(this.config.url);

      this.socket.onopen = () => {
        this.status = WSStatus.OPEN;
        this.retryCount = 0;
        this.updateStatus();
        this.config.onOpen?.();
        console.log(`[WS] Connected to ${this.config.url}`);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.config.onMessage?.(data);
        } catch (e) {
          this.config.onMessage?.(event.data);
        }
      };

      this.socket.onclose = () => {
        this.status = WSStatus.CLOSED;
        this.updateStatus();
        this.config.onClose?.();
        this.handleReconnect();
      };

      this.socket.onerror = (err) => {
        this.status = WSStatus.ERROR;
        this.updateStatus();
        this.config.onError?.(err);
        useNodeStore.getState().emitEvent('LP1', NodeStatus.ERROR, EventPriority.CRITICAL, {
          error: 'WebSocket connection failed',
          url: this.config.url,
        });
      };
    } catch (err) {
      this.status = WSStatus.ERROR;
      this.updateStatus();
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.retryCount < (this.config.maxRetries || 10)) {
      const delay = (this.config.retryInterval || 3000) * Math.pow(1.5, this.retryCount);
      this.retryCount++;
      console.log(`[WS] Retrying connection in ${delay}ms (Attempt ${this.retryCount})`);
      
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => this.connect(), delay);
    } else {
      console.error('[WS] Max retries reached. Connection failed.');
      useNodeStore.getState().emitEvent('LP1', NodeStatus.ERROR, EventPriority.CRITICAL, {
        error: 'WebSocket max retries reached',
        url: this.config.url,
      });
    }
  }

  private updateStatus() {
    // Surface health in NodeMesh
    useNodeStore.getState().updateNode('LP1', {
      lastPayload: { wsStatus: this.status, wsUrl: this.config.url }
    });
  }

  public send(data: any) {
    if (this.status === WSStatus.OPEN && this.socket) {
      this.socket.send(typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      console.warn('[WS] Cannot send message, socket not open');
    }
  }

  public close() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.socket?.close();
  }

  public getStatus() {
    return this.status;
  }
}
