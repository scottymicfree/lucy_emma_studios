/**
 * @file MissionManager.ts
 * @description Maintains long-term objectives, active projects, and constraints.
 * Both Emma and Lucy read this state to align their governance and execution.
 */

import fs from 'fs';
import path from 'path';
import { EventBus } from './EventBus';
import { AuditLedger } from './AuditLedger';

export interface MissionState {
  currentObjectives: string[];
  activeProjects: Record<string, any>;
  longTermGoals: string[];
  priorities: string[];
  constraints: string[];
  successMetrics: string[];
}

export class MissionManager {
  private static instance: MissionManager;
  private missionFile: string;
  private state: MissionState;

  private constructor() {
    this.missionFile = path.join(process.cwd(), 'config', 'mission.json');
    this.state = this.loadState();
  }

  public static getInstance(): MissionManager {
    if (!MissionManager.instance) {
      MissionManager.instance = new MissionManager();
    }
    return MissionManager.instance;
  }

  private loadState(): MissionState {
    if (fs.existsSync(this.missionFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.missionFile, 'utf-8'));
      } catch (err) {
        console.error('[MissionManager] Failed to load mission file. Initializing default state.');
      }
    }
    
    return {
      currentObjectives: ['Establish Cognitive OS Foundation'],
      activeProjects: {},
      longTermGoals: ['Autonomous execution', 'Self-healing resiliency'],
      priorities: ['Stability', 'Security'],
      constraints: ['No unverified code execution'],
      successMetrics: ['100% uptime', 'Zero random data generated']
    };
  }

  private saveState() {
    const dir = path.dirname(this.missionFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    fs.writeFileSync(this.missionFile, JSON.stringify(this.state, null, 2), 'utf-8');
  }

  public getState(): MissionState {
    return { ...this.state };
  }

  public updateMission(updates: Partial<MissionState>, actor: string) {
    this.state = { ...this.state, ...updates };
    this.saveState();

    AuditLedger.getInstance().record(actor, 'MISSION_UPDATED', updates);
    EventBus.getInstance().emit('MissionManager', 'MISSION_STATE_CHANGED', this.state);
  }
}
