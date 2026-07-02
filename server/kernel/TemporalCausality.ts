/**
 * @file TemporalCausality.ts
 * @description Layer 3: Transformation Pipeline (Temporal Causality Graph).
 * A runtime indexer that traces backwards through the causalParentId of the EventBus.
 * Acts as a "time-traveling debugger" for the FAE to instantly identify the root cause 
 * of systemic failures without wading through linear logs.
 */

import { BaseEvent } from './BaseEvent';

export class TemporalCausalityGraph {
  private static instance: TemporalCausalityGraph;

  // In-memory graph index: eventId -> Event
  private eventIndex: Map<string, BaseEvent> = new Map();

  private constructor() {}

  public static getInstance(): TemporalCausalityGraph {
    if (!TemporalCausalityGraph.instance) {
      TemporalCausalityGraph.instance = new TemporalCausalityGraph();
    }
    return TemporalCausalityGraph.instance;
  }

  /**
   * Indexes a sequenced event into the causal graph.
   * This is called passively by the EventBus, keeping Layer 3 decoupled from Layer 1.
   */
  public indexEvent(event: BaseEvent) {
    this.eventIndex.set(event.eventId, event);
  }

  /**
   * Traces an event backwards through time to find the original root cause.
   * Returns the exact causal chain.
   */
  public traceRootCause(terminalEventId: string): BaseEvent[] {
    const chain: BaseEvent[] = [];
    let currentEventId: string | null = terminalEventId;

    while (currentEventId) {
      const event = this.eventIndex.get(currentEventId);
      if (!event) {
        break; // Origin reached or event flushed from memory
      }
      
      chain.push(event);
      currentEventId = event.causalParentId || null;
    }

    return chain; // Index 0 is the terminal event, Index N is the root cause
  }
}
