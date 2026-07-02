import { ExecutionResult } from "../../types";

export interface Pathogen {
  id: string;
  chainKey: string;
  successRate: number;
  occurrences: number;
  avgImpact: number;
  quarantined: boolean;
  discoveredAt: number;
}

export class CognitiveImmuneSystem {
  private static instance: CognitiveImmuneSystem;

  private constructor() {}

  public static getInstance(): CognitiveImmuneSystem {
    if (!CognitiveImmuneSystem.instance) {
      CognitiveImmuneSystem.instance = new CognitiveImmuneSystem();
    }
    return CognitiveImmuneSystem.instance;
  }

  public scanMemory(): Pathogen[] {
    try {
      const storedStr = localStorage.getItem("lucy_ltm") || "{}";
      const stored = JSON.parse(storedStr);

      const pathogens: Pathogen[] = [];

      Object.keys(stored).forEach((key) => {
        const data = stored[key];

        // Biological analogy: weak connections (successRate < 0.4) or high occurrences with low impact
        if (
          (data.successRate < 0.5 && data.occurrences > 2) ||
          (data.avgImpact < 20 && data.occurrences > 5)
        ) {
          pathogens.push({
            id: `pathogen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            chainKey: key,
            successRate: data.successRate,
            occurrences: data.occurrences,
            avgImpact: data.avgImpact,
            quarantined: data.quarantined || false,
            discoveredAt: Date.now(),
          });
        }
      });

      return pathogens;
    } catch (err) {
      console.warn("[CognitiveImmune] Failed to scan LTM:", err);
      return [];
    }
  }

  public quarantine(chainKey: string) {
    try {
      const storedStr = localStorage.getItem("lucy_ltm") || "{}";
      const stored = JSON.parse(storedStr);

      if (stored[chainKey]) {
        stored[chainKey].quarantined = true;
        localStorage.setItem("lucy_ltm", JSON.stringify(stored));
      }
    } catch (err) {
      console.warn("[CognitiveImmune] Failed to quarantine pathogen:", err);
    }
  }

  public purge(chainKey: string) {
    try {
      const storedStr = localStorage.getItem("lucy_ltm") || "{}";
      const stored = JSON.parse(storedStr);

      if (stored[chainKey]) {
        delete stored[chainKey];
        localStorage.setItem("lucy_ltm", JSON.stringify(stored));
      }
    } catch (err) {
      console.warn("[CognitiveImmune] Failed to purge pathogen:", err);
    }
  }

  public simulatePhagocytosis(pathogens: Pathogen[]): Promise<void> {
    return new Promise((resolve) => {
      // Simulate time for antibodies to dissolve logic faults
      setTimeout(() => {
        pathogens.forEach((p) => this.purge(p.chainKey));
        resolve();
      }, 2000);
    });
  }
}
