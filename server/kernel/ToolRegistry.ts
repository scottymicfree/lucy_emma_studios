/**
 * @file ToolRegistry.ts
 * @description Registers available tools and plugin capabilities for Lucy to execute.
 * Prevents hardcoding of tools in the execution engine.
 */

import { EventBus } from './EventBus';
import { CapabilityName } from './CapabilityManager';

export interface OSTool {
  id: string;
  name: string;
  description: string;
  version: string;
  requiredCapabilities: CapabilityName[];
  execute: (payload: any, correlationId: string) => Promise<any>;
}

export interface PluginManifest {
  pluginId: string;
  author: string;
  version: string;
  tools: OSTool[];
  // Potential future expansion: event handlers, custom workers
}

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, OSTool> = new Map();
  private plugins: Map<string, PluginManifest> = new Map();

  private constructor() {
    // Built-in tools would be registered here natively
  }

  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  /**
   * Register an individual tool into the OS.
   */
  public registerTool(tool: OSTool): boolean {
    if (this.tools.has(tool.id)) {
      console.warn(`[ToolRegistry] Tool ${tool.id} is already registered. Overwriting.`);
    }
    this.tools.set(tool.id, tool);
    EventBus.getInstance().emit('ToolRegistry', 'TOOL_REGISTERED', { id: tool.id, name: tool.name });
    return true;
  }

  /**
   * Load an entire plugin bundle.
   */
  public loadPlugin(manifest: PluginManifest): boolean {
    if (this.plugins.has(manifest.pluginId)) {
      console.error(`[ToolRegistry] Plugin ${manifest.pluginId} is already loaded.`);
      return false;
    }

    this.plugins.set(manifest.pluginId, manifest);
    let registeredCount = 0;

    for (const tool of manifest.tools) {
      this.registerTool(tool);
      registeredCount++;
    }

    EventBus.getInstance().emit('ToolRegistry', 'PLUGIN_LOADED', { 
      pluginId: manifest.pluginId, 
      toolsLoaded: registeredCount 
    });

    return true;
  }

  /**
   * Retrieve a tool definition by ID for execution.
   */
  public getTool(id: string): OSTool | undefined {
    return this.tools.get(id);
  }

  /**
   * List all currently registered tools.
   */
  public listTools(): OSTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Remove a tool from the registry.
   */
  public unregisterTool(id: string) {
    if (this.tools.delete(id)) {
      EventBus.getInstance().emit('ToolRegistry', 'TOOL_UNREGISTERED', { id });
    }
  }
}
