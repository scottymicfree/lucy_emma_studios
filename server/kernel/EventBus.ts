/**
 * @file EventBus.ts
 * @description Centralized, real-time backend Event Bus for the local AI OS.
 * Every subsystem communicates by emitting and listening to events here.
 * Events are immutable once emitted.
 */

import { EventEmitter } from 'events';

export type EventPriority = 'low' | 'normal' | 'high' | 'critical';

export interface SystemEvent<T = any> {
  id: string; // Unique correlation ID
  source: string; // Which subsystem emitted this (e.g., 'WorkerManager', 'Lucy')
  type: string; // The event type (e.g., 'SYSTEM_BOOT', 'TASK_COMPLETED')
  payload: T; // The immutable data payload
  timestamp: number; // Date.now()
  priority: EventPriority;
}

export class EventBus {
  private static instance: EventBus;
  private emitter: EventEmitter;
  private history: SystemEvent[] = []; // In-memory buffer before flushing to DataVault
  private readonly MAX_HISTORY = 1000;

  private constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100); // Allow many subsystems to listen
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Emits an immutable event to all subscribers.
   */
  public emit<T>(
    source: string,
    type: string,
    payload: T,
    priority: EventPriority = 'normal',
    correlationId?: string
  ): SystemEvent<T> {
    const event: SystemEvent<T> = {
      id: correlationId || crypto.randomUUID(),
      source,
      type,
      payload: Object.freeze(payload), // Enforce immutability
      timestamp: Date.now(),
      priority,
    };

    // Store in transient history
    this.history.push(event);
    if (this.history.length > this.MAX_HISTORY) {
      this.history.shift();
    }

    // Dispatch
    this.emitter.emit(type, event);
    this.emitter.emit('*', event); // Wildcard listener support

    return event;
  }

  /**
   * Subscribe to specific event types.
   */
  public on(type: string, listener: (event: SystemEvent) => void): void {
    this.emitter.on(type, listener);
  }

  /**
   * Unsubscribe from event types.
   */
  public off(type: string, listener: (event: SystemEvent) => void): void {
    this.emitter.off(type, listener);
  }

  /**
   * Subscribe to all events (useful for DataVault Ledger and WebSockets).
   */
  public onAny(listener: (event: SystemEvent) => void): void {
    this.emitter.on('*', listener);
  }

  /**
   * Retrieves the recent event history.
   */
  public getHistory(): SystemEvent[] {
    return [...this.history];
  }
}
