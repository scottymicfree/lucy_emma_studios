export interface CapabilitiesManifest {
  allowedHosts: string[];
  maxMemoryBytes: number;
  maxCpuTimeMs: number;
  allowedSyscalls: string[];
  canAccessNetwork: boolean;
  canAccessFilesystem: boolean;
  maxLogSizeBytes: number;
}

export const DEFAULT_SANDBOX_CAPABILITIES: CapabilitiesManifest = {
  allowedHosts: [],
  maxMemoryBytes: 64 * 1024 * 1024, // 64MB
  maxCpuTimeMs: 1000, // 1s
  allowedSyscalls: ["random_get", "clock_time_get"],
  canAccessNetwork: false,
  canAccessFilesystem: false,
  maxLogSizeBytes: 1024 * 1024, // 1MB
};

export function validateCapabilities(
  manifest: CapabilitiesManifest,
  requestedCap: Partial<CapabilitiesManifest>,
): boolean {
  if (
    requestedCap.maxMemoryBytes &&
    requestedCap.maxMemoryBytes > manifest.maxMemoryBytes
  )
    return false;
  if (
    requestedCap.maxCpuTimeMs &&
    requestedCap.maxCpuTimeMs > manifest.maxCpuTimeMs
  )
    return false;
  if (requestedCap.canAccessNetwork && !manifest.canAccessNetwork) return false;
  if (requestedCap.canAccessFilesystem && !manifest.canAccessFilesystem)
    return false;

  if (requestedCap.allowedHosts) {
    for (const host of requestedCap.allowedHosts) {
      if (
        !manifest.allowedHosts.includes(host) &&
        !manifest.allowedHosts.includes("*")
      ) {
        return false;
      }
    }
  }

  return true;
}
