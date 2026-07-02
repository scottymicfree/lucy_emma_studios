/**
 * @file NarrativeAggregator.ts
 * @description Lucy's Narrative Layer for Dual-Mode Cognition.
 * Aggregates raw MeshEvents and translates them into human-readable commentary
 * stream for the chat UI, without blocking the underlying execution mesh.
 */

import { EventBus, SystemEvent } from './EventBus';
import { ReasoningRuntime } from './ReasoningRuntime';
import { PersonaLockEngine } from './PersonaIdentityLayer';
import { APIServer } from './APIServer';

export class NarrativeAggregator {
  private static instance: NarrativeAggregator;

  private constructor() {
    this.attachToEventBus();
  }

  public static getInstance(): NarrativeAggregator {
    if (!NarrativeAggregator.instance) {
      NarrativeAggregator.instance = new NarrativeAggregator();
    }
    return NarrativeAggregator.instance;
  }

  private attachToEventBus() {
    // Listen to all Mesh-related events
    EventBus.getInstance().on('MeshOrchestrator', (event) => this.handleMeshEvent(event));
    EventBus.getInstance().on('AgentNode', (event) => this.handleMeshEvent(event));
  }

  /**
   * Translates raw events into conversational narrative dynamically.
   */
  private async handleMeshEvent(event: SystemEvent) {
    // Only aggregate important state transitions to avoid spamming the LLM
    if (event.type !== 'NODE_STATE_CHANGED' && event.type !== 'MESH_TASK_SPAWNED' && event.type !== 'MESH_TASK_COMPLETE') {
      return;
    }

    try {
      // 1. Lock Lucy's identity for narrative generation
      const narrativeRequest = PersonaLockEngine.inject('lucy', event.correlationId || 'narrative-layer', {
        userPrompt: `The underlying execution mesh just emitted the following event:\n${JSON.stringify(event.payload)}\n\nProvide a very brief (1 sentence) technical summary of what is happening in the system right now.`
      });

      // 2. Generate the narrative summary
      const response = await ReasoningRuntime.getInstance().generate(narrativeRequest, event.correlationId || 'narrative-layer');

      // 3. Emit the Narrative Event (Stream B)
      EventBus.getInstance().emit('NarrativeAggregator', 'LUCY_NARRATIVE_UPDATE', {
        narrative: response.text,
        sourceEvent: event.type
      }, 'normal', event.correlationId);

    } catch (err: any) {
      console.error('[NarrativeAggregator] Failed to generate narrative:', err.message);
    }
  }
}
