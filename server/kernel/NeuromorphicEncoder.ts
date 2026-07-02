/**
 * @file NeuromorphicEncoder.ts
 * @description Layer 3: Transformation Pipeline (Eventified Delta Coding).
 * Converts continuous numerical telemetry into discrete, time-based "spikes".
 * If the delta doesn't cross the dynamic threshold, the signal is dropped,
 * saving massive computational overhead for the cognition layer.
 */

import { EventBus } from './EventBus';

export interface SpikeSignal {
  sourceId: string;
  metric: string;
  magnitude: number;
  timestamp: number;
}

export class NeuromorphicEncoder {
  private static instance: NeuromorphicEncoder;

  // Tracks the last emitted value for each metric stream
  private baselineMemory: Map<string, number> = new Map();
  
  // The threshold delta required to emit a spike
  private spikeThreshold: number = 0.05; // 5% variance threshold

  private constructor() {}

  public static getInstance(): NeuromorphicEncoder {
    if (!NeuromorphicEncoder.instance) {
      NeuromorphicEncoder.instance = new NeuromorphicEncoder();
    }
    return NeuromorphicEncoder.instance;
  }

  /**
   * Ingests a raw numerical telemetry reading.
   * Only emits a discrete SpikeSignal if the value deviates significantly from the baseline.
   */
  public ingestTelemetry(sourceId: string, metric: string, value: number, correlationId: string): SpikeSignal | null {
    const memoryKey = `${sourceId}:${metric}`;
    const baseline = this.baselineMemory.get(memoryKey);

    if (baseline === undefined) {
      // First time seeing this metric, memorize and spike
      this.baselineMemory.set(memoryKey, value);
      return this.emitSpike(sourceId, metric, value, correlationId);
    }

    const delta = Math.abs((value - baseline) / baseline);

    if (delta >= this.spikeThreshold) {
      // Threshold crossed. Update baseline and spike.
      this.baselineMemory.set(memoryKey, value);
      return this.emitSpike(sourceId, metric, value, correlationId);
    }

    // Sub-threshold. Drop the signal. (Compute saved)
    return null;
  }

  private emitSpike(sourceId: string, metric: string, magnitude: number, correlationId: string): SpikeSignal {
    const spike: SpikeSignal = {
      sourceId,
      metric,
      magnitude,
      timestamp: Date.now()
    };

    // Emit to Layer 4 (Presentation/Observability) or Layer 3 (Memory), never Layer 1
    EventBus.getInstance().emit('NeuromorphicEncoder', 'SPIKE_EMITTED', spike, 'normal', correlationId);
    return spike;
  }
}
