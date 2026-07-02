import { Proposal, ExecutionResult } from '../../../types';

export const LTM = {
  async recordPattern(proposal: Proposal, result: ExecutionResult) {
    try {
      const chain = proposal.actionChain || [proposal.action];
      const chainKey = chain.join('->');
      
      const storedStr = localStorage.getItem('lucy_ltm') || '{}';
      const stored = JSON.parse(storedStr);

      const isSuccess = result.outcome === 'success' ? 1 : 0;
      
      if (!stored[chainKey]) {
        stored[chainKey] = {
          actionChain: chain,
          successRate: isSuccess,
          avgImpact: result.impact,
          avgLatency: result.latencyMs || 0,
          occurrences: 1,
          lastUsed: Date.now()
        };
      } else {
        const data = stored[chainKey];
        const occurrences = data.occurrences + 1;
        const successRate = ((data.successRate * data.occurrences) + isSuccess) / occurrences;
        const avgImpact = ((data.avgImpact * data.occurrences) + result.impact) / occurrences;
        const avgLatency = ((data.avgLatency * data.occurrences) + (result.latencyMs || 0)) / occurrences;

        stored[chainKey] = {
          ...data,
          successRate,
          avgImpact,
          avgLatency,
          occurrences,
          lastUsed: Date.now()
        };
      }
      
      const keys = Object.keys(stored);
      if (keys.length > 200) {
        const sortedKeys = keys.sort((a, b) => stored[a].lastUsed - stored[b].lastUsed);
        while (sortedKeys.length > 200) {
          const keyToRemove = sortedKeys.shift();
          if (keyToRemove) delete stored[keyToRemove];
        }
      }

      try {
        localStorage.setItem('lucy_ltm', JSON.stringify(stored));
      } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
          const remainingKeys = Object.keys(stored).sort((a, b) => stored[a].lastUsed - stored[b].lastUsed);
          const half = Math.floor(remainingKeys.length / 2);
          for (let i = 0; i < half; i++) {
             delete stored[remainingKeys[i]];
          }
          localStorage.setItem('lucy_ltm', JSON.stringify(stored));
        } else {
          throw e;
        }
      }
    } catch (e: any) {
      console.error('[LTM] Failed to record pattern to LocalStorage:', e);
    }
  },

  async queryPatterns(intent: string) {
    try {
      const storedStr = localStorage.getItem('lucy_ltm') || '{}';
      const stored = JSON.parse(storedStr);
      
      return Object.values(stored).filter((data: any) => {
        return data.actionChain && data.actionChain.includes(intent);
      });
    } catch (e: any) {
      console.error('[LTM] Failed to query patterns from LocalStorage:', e);
      return [];
    }
  }
};
