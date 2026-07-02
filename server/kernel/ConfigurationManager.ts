/**
 * @file ConfigurationManager.ts
 * @description Centralized configuration loader for the OS. 
 * Supports Runtime, Recovery, Governance, Security, Creative, Tools, Models, Workers, Memory, Telemetry, Plugins, Scheduling.
 */

import fs from 'fs';
import path from 'path';
import { EventBus } from './EventBus';

export type ConfigCategory = 
  | 'Runtime' 
  | 'Recovery' 
  | 'Governance' 
  | 'Security' 
  | 'Creative' 
  | 'Tools' 
  | 'Models' 
  | 'Workers' 
  | 'Memory' 
  | 'Telemetry' 
  | 'Plugins' 
  | 'Scheduling';

export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private configPath: string;
  private configs: Map<ConfigCategory, any> = new Map();

  private constructor() {
    this.configPath = path.join(process.cwd(), 'config');
    this.ensureConfigDirectory();
    this.loadAllConfigs();
  }

  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  private ensureConfigDirectory() {
    if (!fs.existsSync(this.configPath)) {
      fs.mkdirSync(this.configPath, { recursive: true });
    }
  }

  /**
   * Default configuration fallbacks if a config file is missing.
   */
  private getDefaultConfig(category: ConfigCategory): any {
    switch(category) {
      case 'Models': return { primaryRuntime: 'Ollama', endpoint: 'http://localhost:11434' };
      case 'Creative': return { allowMatureThemes: true, contentPolicy: 'unrestricted_engineering' };
      case 'Security': return { sandboxTerminal: false };
      case 'Runtime': return { environment: 'production', debug: false };
      default: return {};
    }
  }

  /**
   * Loads all configuration files into memory.
   */
  private loadAllConfigs() {
    const categories: ConfigCategory[] = [
      'Runtime', 'Recovery', 'Governance', 'Security', 'Creative', 
      'Tools', 'Models', 'Workers', 'Memory', 'Telemetry', 'Plugins', 'Scheduling'
    ];

    for (const category of categories) {
      const file = path.join(this.configPath, `${category.toLowerCase()}.json`);
      if (fs.existsSync(file)) {
        try {
          const raw = fs.readFileSync(file, 'utf-8');
          this.configs.set(category, JSON.parse(raw));
        } catch (err) {
          console.error(`[ConfigurationManager] Failed to parse ${file}`, err);
          this.configs.set(category, this.getDefaultConfig(category));
        }
      } else {
        // Write default config if missing
        const defaultConfig = this.getDefaultConfig(category);
        this.configs.set(category, defaultConfig);
        fs.writeFileSync(file, JSON.stringify(defaultConfig, null, 2), 'utf-8');
      }
    }
    
    EventBus.getInstance().emit('ConfigurationManager', 'CONFIG_LOADED', { categories });
  }

  /**
   * Retrieves a specific configuration category.
   */
  public getConfig<T = any>(category: ConfigCategory): T {
    return this.configs.get(category) as T;
  }

  /**
   * Updates a configuration category and flushes to disk.
   */
  public updateConfig(category: ConfigCategory, newConfig: any): void {
    const current = this.configs.get(category) || {};
    const updated = { ...current, ...newConfig };
    this.configs.set(category, updated);
    
    const file = path.join(this.configPath, `${category.toLowerCase()}.json`);
    fs.writeFileSync(file, JSON.stringify(updated, null, 2), 'utf-8');
    
    EventBus.getInstance().emit('ConfigurationManager', 'CONFIG_UPDATED', { category, updated });
  }
}
