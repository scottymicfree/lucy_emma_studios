/**
 * @file GlobalEventSequencer.ts
 * @description The Global Ordering Authority (GOA).
 * Assigns strictly monotonic sequence numbers. Evaluates causalParentId to physically 
 * reject out-of-order writes. Guarantees true causal determinism under high concurrency.
 */

import { BaseEvent } from './BaseEvent';

export class GlobalEventSequencer {
  private static instance: GlobalEventSequencer;
  
  // The absolute monotonic sequence counter
  private currentSequence: number = 0;
  
  // Tracks processed events to validate causal parents
  private processedEvents: Set<string> = new Set();

  private constructor() {
    // Genesis event
    this.processedEvents.add('genesis');
  }

  public static getInstance(): GlobalEventSequencer {
    if (!GlobalEventSequencer.instance) {
      GlobalEventSequencer.instance = new GlobalEventSequencer();
    }
    return GlobalEventSequencer.instance;
  }

  /**
   * Validates causality and assigns the monotonic sequence number.
   * If causality is broken (causalParentId does not exist in processed history),
   * the event is violently rejected before reaching the Reducer.
   */
  public sequence(eventPayload: Omit<BaseEvent, 'sequenceNumber'>): BaseEvent {
    // 1. Causal Validation Rule
    // If the event claims to be caused by X, but X has not been processed, we have a causal break.
    if (eventPayload.causalParentId && !this.processedEvents.has(eventPayload.causalParentId)) {
      throw new Error(`[GOA] Causal Violation! Parent event ${eventPayload.causalParentId} is missing or out of order.`);
    }

    // 2. Monotonic Assignment
    this.currentSequence++;
    const sequencedEvent: BaseEvent = {
      ...eventPayload,
      sequenceNumber: this.currentSequence
    };

    // 3. Commit to processed history
    this.processedEvents.add(sequencedEvent.eventId);

    return sequencedEvent;
  }

  public getCurrentSequence(): number {
    return this.currentSequence;
  }
}
