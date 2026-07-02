export type Permission = 'network:dns' | 'network:tcp' | 'fs:read' | 'fs:write' | 'env:read';

export interface Manifest {
  role: string;
  maxMemoryBytes: number;
  maxCpuFuel: number;
  permissions: Permission[];
  allowedHosts: string[];
}

export const GUEST_MANIFEST: Manifest = {
  role: 'untrusted_agent',
  maxMemoryBytes: 64 * 1024 * 1024, // 64MB hard limit
  maxCpuFuel: 100000,               // Opcode limit
  permissions: [],                  // Default Deny
  allowedHosts: []
};

export class CapabilityEnforcer {
  static validate(requested: Permission[], manifest: Manifest): boolean {
    // Fail closed. If requested is not a strict subset of manifest, deny.
    return requested.every(p => manifest.permissions.includes(p));
  }
}
