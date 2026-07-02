import {
  PluginManifest,
  PluginDependency,
  PluginCapability,
} from "../../types";

export class PluginManager {
  private static instance: PluginManager;
  private plugins: Map<string, PluginManifest> = new Map();

  private constructor() {}

  public static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  public registerPlugin(manifest: PluginManifest): boolean {
    console.log(
      `[PluginManager] Attempting to register plugin: ${manifest.name} v${manifest.version}`,
    );

    // 1. Signature Check (Simulated)
    if (!this.verifySignature(manifest)) {
      console.error(
        `[PluginManager] SECURITY ALERT: Invalid signature for plugin ${manifest.name}. Registration rejected.`,
      );
      return false;
    }

    // 2. Dependency Check
    if (!this.checkDependencies(manifest.dependencies)) {
      console.error(
        `[PluginManager] Dependency check failed for plugin ${manifest.name}. Missing or incompatible dependencies.`,
      );
      return false;
    }

    // 3. Register Capabilities
    this.registerCapabilities(manifest.capabilities);

    this.plugins.set(manifest.id, manifest);
    console.log(
      `[PluginManager] Successfully registered plugin: ${manifest.name}`,
    );
    return true;
  }

  private verifySignature(manifest: PluginManifest): boolean {
    // In a real implementation, verify cryptographic signature
    if (!manifest.signature) return false;
    return manifest.signature.startsWith("sig_");
  }

  private checkDependencies(dependencies: PluginDependency[]): boolean {
    for (const dep of dependencies) {
      const installedPlugin = this.plugins.get(dep.pluginId);
      if (!installedPlugin) return false;
      // In a real implementation, parse version strings like semver
      if (
        installedPlugin.version !== dep.versionRange &&
        dep.versionRange !== "*"
      ) {
        return false;
      }
    }
    return true;
  }

  private registerCapabilities(capabilities: PluginCapability[]): void {
    capabilities.forEach((cap) => {
      console.log(`[PluginManager] Registered new capability: ${cap.name}`);
    });
  }

  public getInstalledPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values());
  }

  public isCapabilityAvailable(capabilityName: string): boolean {
    for (const plugin of this.plugins.values()) {
      if (plugin.capabilities.some((cap) => cap.name === capabilityName)) {
        return true;
      }
    }
    return false;
  }
}
