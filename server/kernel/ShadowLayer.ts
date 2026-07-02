/**
 * @file ShadowLayer.ts
 * @description The Immutable Shadow Layer. 
 * Provides Git-backed snapshot and rollback capabilities. This is the ultimate safety net
 * allowing the AZR loop to safely edit OS source code, knowing that catastrophic syntax errors
 * can be instantly reverted using `git checkout`.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { EventBus } from './EventBus';

const execAsync = promisify(exec);

export class ShadowLayer {
  private static instance: ShadowLayer;
  
  // The directory of the OS workspace
  private workspacePath: string;

  private constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  public static getInstance(workspacePath: string = process.cwd()): ShadowLayer {
    if (!ShadowLayer.instance) {
      ShadowLayer.instance = new ShadowLayer(workspacePath);
    }
    return ShadowLayer.instance;
  }

  /**
   * Commits the current clean state to the shadow layer before allowing self-modification.
   */
  public async createSnapshot(correlationId: string): Promise<string> {
    try {
      const commitMsg = `[ShadowLayer] Auto-snapshot before modification: ${correlationId}`;
      await execAsync(`git add . && git commit -m "${commitMsg}"`, { cwd: this.workspacePath });
      
      const { stdout } = await execAsync(`git rev-parse HEAD`, { cwd: this.workspacePath });
      const commitHash = stdout.trim();
      
      EventBus.getInstance().emit('ShadowLayer', 'SNAPSHOT_CREATED', { commitHash }, 'normal', correlationId);
      return commitHash;
    } catch (error: any) {
      // If there's nothing to commit, it's fine, we are clean.
      if (error.message.includes('nothing to commit')) {
        return 'clean';
      }
      throw error;
    }
  }

  /**
   * Immediately rolls back all uncommitted changes, restoring the OS to the last clean snapshot.
   */
  public async rollbackToCleanState(correlationId: string): Promise<void> {
    try {
      EventBus.getInstance().emit('ShadowLayer', 'ROLLBACK_INITIATED', {}, 'high', correlationId);
      
      // Hard reset to wipe staged and unstaged changes, and clean untracked files
      await execAsync(`git reset --hard HEAD && git clean -fd`, { cwd: this.workspacePath });
      
      EventBus.getInstance().emit('ShadowLayer', 'ROLLBACK_COMPLETED', {}, 'high', correlationId);
    } catch (error: any) {
      EventBus.getInstance().emit('ShadowLayer', 'ROLLBACK_FAILED', { error: error.message }, 'critical', correlationId);
      throw error;
    }
  }
}
