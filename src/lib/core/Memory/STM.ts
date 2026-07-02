import { Proposal, ExecutionResult } from '../../../types';

const STM_LIMIT = 50; // last 50 proposals

export const STM = {
  async add(proposal: Proposal, result: ExecutionResult) {
    try {
      const storedStr = localStorage.getItem('lucy_stm') || '[]';
      let stored: any[] = JSON.parse(storedStr);

      stored.unshift({
        nodeId: proposal.nodeId,
        proposalId: proposal.id,
        actionChain: proposal.actionChain || [proposal.action],
        outcome: result.outcome,
        impact: result.impact,
        latencyMs: result.latencyMs || 0,
        timestamp: Date.now()
      });

      if (stored.length > STM_LIMIT) {
        stored = stored.slice(0, STM_LIMIT);
      }

      localStorage.setItem('lucy_stm', JSON.stringify(stored));
    } catch (e: any) {
      console.error('[STM] Failed to add memory to LocalStorage:', e);
    }
  },

  async getRecent(n: number) {
    try {
      const storedStr = localStorage.getItem('lucy_stm') || '[]';
      const stored: any[] = JSON.parse(storedStr);
      return stored.slice(0, n);
    } catch (e: any) {
      console.error('[STM] Failed to get recent memory from LocalStorage:', e);
      return [];
    }
  }
};
