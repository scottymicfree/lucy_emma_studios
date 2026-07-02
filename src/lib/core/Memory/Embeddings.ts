import { Proposal } from '../../../types';
import { generateEmbedding } from '../Llama/EmbeddingAPI';

export const Embeddings = {
  async store(proposal: Proposal, intent: string, success: boolean) {
    try {
      const chain = proposal.actionChain || [proposal.action];
      const vector = await generateEmbedding(chain.join(' '));
      
      const storedStr = localStorage.getItem('lucy_embeddings') || '{}';
      let stored = JSON.parse(storedStr);

      stored[proposal.id] = {
        proposalId: proposal.id,
        vector,
        intent,
        success,
        timestamp: Date.now()
      };

      const keys = Object.keys(stored);
      if (keys.length > 50) {
        const sortedKeys = keys.sort((a, b) => (stored[a].timestamp || 0) - (stored[b].timestamp || 0));
        while (sortedKeys.length > 50) {
          const keyToRemove = sortedKeys.shift();
          if (keyToRemove) delete stored[keyToRemove];
        }
      }

      try {
        localStorage.setItem('lucy_embeddings', JSON.stringify(stored));
      } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
           // Fallback: clear half
           const remainingKeys = Object.keys(stored).sort((a, b) => (stored[a].timestamp || 0) - (stored[b].timestamp || 0));
           const half = Math.floor(remainingKeys.length / 2);
           for (let i = 0; i < half; i++) {
             delete stored[remainingKeys[i]];
           }
           localStorage.setItem('lucy_embeddings', JSON.stringify(stored));
        } else {
           throw e;
        }
      }
    } catch (e: any) {
      console.error('[Embeddings] Failed to store embedding to LocalStorage:', e);
    }
  },

  async querySimilar(vector: number[], threshold: number = 0.85) {
    try {
      const storedStr = localStorage.getItem('lucy_embeddings') || '{}';
      const stored = JSON.parse(storedStr);
      const results: any[] = [];
      
      Object.values(stored).forEach((data: any) => {
        if (data.vector && data.vector.length === vector.length) {
          const similarity = cosineSimilarity(vector, data.vector);
          if (similarity >= threshold) {
            results.push({ ...data, similarity });
          }
        }
      });
      
      return results.sort((a, b) => b.similarity - a.similarity);
    } catch (e: any) {
      console.error('[Embeddings] Failed to query similar embeddings from LocalStorage:', e);
      return [];
    }
  }
};

// cosine similarity function
function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
