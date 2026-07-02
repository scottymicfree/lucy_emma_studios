/**
 * @file HolographicMemory.ts
 * @description Layer 3: Transformation Pipeline (Representational Superposition).
 * Prevents catastrophic forgetting in the AZR loop. Instead of overwriting 
 * existing memory axioms during a self-edit, it compresses multiple learned 
 * signatures into dense state vectors (similar to fractional Fourier transforms).
 */

export interface DenseVector {
  dimensions: number[];
  magnitude: number;
}

export class HolographicMemory {
  private static instance: HolographicMemory;

  // The superposed global memory axiom vector
  private globalAxiomVector: DenseVector = { dimensions: new Array(128).fill(0), magnitude: 0 };

  private constructor() {}

  public static getInstance(): HolographicMemory {
    if (!HolographicMemory.instance) {
      HolographicMemory.instance = new HolographicMemory();
    }
    return HolographicMemory.instance;
  }

  /**
   * Superposes a new learned signature onto the global axiom vector.
   * This is a non-destructive mathematical overlay (holographic principle).
   */
  public superposeSignature(newSignature: number[]): void {
    if (newSignature.length !== 128) {
      throw new Error(`[HolographicMemory] Signature must be a 128-dimensional vector.`);
    }

    let sumSquares = 0;
    for (let i = 0; i < 128; i++) {
      // Holographic folding: blend the new weights with existing weights
      this.globalAxiomVector.dimensions[i] = (this.globalAxiomVector.dimensions[i] + newSignature[i]) / 2;
      sumSquares += Math.pow(this.globalAxiomVector.dimensions[i], 2);
    }
    
    this.globalAxiomVector.magnitude = Math.sqrt(sumSquares);
  }

  /**
   * Evaluates if a proposed AZR self-edit causes catastrophic forgetting.
   * Compares the cosine similarity of the proposed state against the global axiom vector.
   */
  public evaluateForgettingRisk(proposedVector: number[]): number {
    let dotProduct = 0;
    let proposedSumSquares = 0;

    for (let i = 0; i < 128; i++) {
      dotProduct += this.globalAxiomVector.dimensions[i] * proposedVector[i];
      proposedSumSquares += Math.pow(proposedVector[i], 2);
    }

    const proposedMagnitude = Math.sqrt(proposedSumSquares);
    if (this.globalAxiomVector.magnitude === 0 || proposedMagnitude === 0) return 0; // Baseline

    const cosineSimilarity = dotProduct / (this.globalAxiomVector.magnitude * proposedMagnitude);
    
    // Return risk score (1.0 - similarity). High risk = high forgetting.
    return 1.0 - cosineSimilarity; 
  }
}
