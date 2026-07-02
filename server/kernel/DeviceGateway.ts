/**
 * @file DeviceGateway.ts
 * @description The Hardware VM Boundary. 
 * STRICT RULE: No Node.js process except this gateway can import OS APIs.
 * Enforces the Hardware Execution Contract:
 * - Mic = stream only
 * - Bluetooth = lease-based connection only
 * - Speaker = output sink only
 */

import { EventBus } from './EventBus';
import { CapabilityLease } from './CapabilityManager';

export class DeviceGateway {
  private static instance: DeviceGateway;

  // Track active hardware leases to prevent device hijacking
  private activeLeases: Map<string, CapabilityLease> = new Map();

  private constructor() {}

  public static getInstance(): DeviceGateway {
    if (!DeviceGateway.instance) {
      DeviceGateway.instance = new DeviceGateway();
    }
    return DeviceGateway.instance;
  }

  /**
   * Registers a hardware lease. The device cannot be accessed without an active lease.
   */
  public registerLease(lease: CapabilityLease) {
    this.activeLeases.set(lease.capability, lease);
  }

  /**
   * Hardware Execution Contract: Microphone
   * Only returns a read-only stream identifier. Never raw OS access.
   */
  public getMicrophoneStream(correlationId: string): string {
    const lease = this.activeLeases.get('microphone');
    if (!lease || lease.correlationId !== correlationId) {
      throw new Error(`[DeviceGateway] Microphone access denied. Invalid or missing lease.`);
    }

    EventBus.getInstance().emit('DeviceGateway', 'MIC_STREAM_OPENED', {}, 'normal', correlationId);
    return 'stream://localhost/audio/mic/0'; // Simulated secure stream URL
  }

  /**
   * Hardware Execution Contract: Bluetooth
   * Lease-based connection only.
   */
  public connectBluetoothDevice(deviceId: string, correlationId: string): boolean {
    const lease = this.activeLeases.get('bluetooth');
    if (!lease || lease.correlationId !== correlationId) {
      throw new Error(`[DeviceGateway] Bluetooth access denied. Invalid or missing lease.`);
    }

    EventBus.getInstance().emit('DeviceGateway', 'BT_DEVICE_CONNECTED', { deviceId }, 'normal', correlationId);
    return true; // Simulated successful connection
  }
}
