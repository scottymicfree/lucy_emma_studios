/**
 * @file SonificationEngine.ts
 * @description The Relativistic Sonification Layer (Gravitational Music).
 * Maps complex multi-dimensional telemetry and memory structures into auditory streams
 * by applying special and general relativistic equations (Lorentz transformations) 
 * to sound generation parameters (pitch, tempo, phase).
 */

import { EventBus } from './EventBus';

export interface MassMap {
  [nodeId: string]: number; // Virtual mass value for a given data node
}

export interface AudioSignal {
  frequencyHz: number;
  tempoBPM: number;
  amplitude: number;
}

export class SonificationEngine {
  private static instance: SonificationEngine;

  private readonly SPEED_OF_LIGHT = 299792458; // c
  private readonly GRAVITATIONAL_CONSTANT = 6.67430e-11; // G

  private constructor() {}

  public static getInstance(): SonificationEngine {
    if (!SonificationEngine.instance) {
      SonificationEngine.instance = new SonificationEngine();
    }
    return SonificationEngine.instance;
  }

  /**
   * Applies General Relativity Time Dilation to a baseline tempo.
   * t0 = tf * sqrt(1 - (2GM / rc^2))
   */
  private applyGravitationalTimeDilation(baseTempo: number, mass: number, radius: number): number {
    // Scaled for audible representation rather than literal physics
    const scaleFactor = 1e20; // arbitrary scaling to make the mass effect audible
    const schwarzschildRadius = (2 * this.GRAVITATIONAL_CONSTANT * (mass * scaleFactor)) / Math.pow(this.SPEED_OF_LIGHT, 2);
    
    // Prevent imaginary numbers if radius is inside the event horizon
    if (radius <= schwarzschildRadius) return baseTempo * 0.1; 

    const dilationFactor = Math.sqrt(1 - (schwarzschildRadius / radius));
    return baseTempo * dilationFactor;
  }

  /**
   * Core Tool: sonify_spacetime
   * Maps a dataset to an audio signal stream based on defined masses.
   */
  public sonifySpacetime(dataStream: any[], massMap: MassMap, correlationId: string): AudioSignal[] {
    EventBus.getInstance().emit('SonificationEngine', 'SONIFICATION_STARTED', { streamLength: dataStream.length }, 'normal', correlationId);

    const signals: AudioSignal[] = [];
    const baseTempo = 120; // 120 BPM base

    for (let i = 0; i < dataStream.length; i++) {
      const dataPoint = dataStream[i];
      // Simulated extraction of mass and distance from the data point
      const virtualMass = massMap[dataPoint.id] || 1.0; 
      const virtualRadius = dataPoint.distance || 1.0;

      // Heavy mass slows down tempo (dilation)
      const dilatedTempo = this.applyGravitationalTimeDilation(baseTempo, virtualMass, virtualRadius);

      signals.push({
        frequencyHz: 440 * (1 / virtualRadius), // Closer = higher pitch
        tempoBPM: dilatedTempo,
        amplitude: Math.min(1.0, virtualMass * 0.1) // Massive = louder
      });
    }

    EventBus.getInstance().emit('SonificationEngine', 'SONIFICATION_COMPLETED', { signalsGenerated: signals.length }, 'normal', correlationId);
    return signals;
  }
}
