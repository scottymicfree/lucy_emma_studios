/**
 * @file RelativisticMapper.ts
 * @description Layer 3: Transformation Pipeline (Relativistic Data Mapper).
 * The concrete data pipeline for the SonificationEngine. Converts flat network 
 * and system telemetry logs (IPs, Ports, Payload size) into a physical MassMap
 * (virtual mass and orbital radius) to generate Gravitational Audio.
 */

import { MassMap } from './SonificationEngine';

export interface TelemetryLog {
  id: string;
  sourceIp: string;
  destinationPort: number;
  payloadSizeBytes: number;
  threatScore: number; // 0.0 to 1.0
}

export class RelativisticMapper {
  private static instance: RelativisticMapper;

  private constructor() {}

  public static getInstance(): RelativisticMapper {
    if (!RelativisticMapper.instance) {
      RelativisticMapper.instance = new RelativisticMapper();
    }
    return RelativisticMapper.instance;
  }

  /**
   * Maps a batch of telemetry logs into a relativistic MassMap.
   * High payload sizes become massive "black holes".
   * High threat scores reduce the orbital radius (bringing the signal closer to the event horizon).
   */
  public mapToSpacetime(logs: TelemetryLog[]): { massMap: MassMap, dataStream: any[] } {
    const massMap: MassMap = {};
    const dataStream: any[] = [];

    for (const log of logs) {
      // Mass calculation: Logarithmic scale of payload size, boosted by baseline mass.
      // E.g., a 10MB payload is exponentially more massive than a 10KB payload.
      const virtualMass = Math.max(1.0, Math.log10(log.payloadSizeBytes + 1));
      
      massMap[log.id] = virtualMass;

      // Orbital Radius calculation: High threat score = tight orbit (fast, high-pitch).
      // Low threat score = distant orbit (slow, low-pitch).
      // Radius ranges from 0.1 (extremely close) to 10.0 (distant).
      const orbitalRadius = Math.max(0.1, 10.0 - (log.threatScore * 10));

      dataStream.push({
        id: log.id,
        distance: orbitalRadius,
        originalLog: log // Keep original data for reference if needed by Layer 4
      });
    }

    return { massMap, dataStream };
  }
}
