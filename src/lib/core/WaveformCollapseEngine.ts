export interface QuantumState {
  id: string;
  name: string;
  philosophy: string;
  projectedOutcome: string;
  probability: number;
  entropy: number;
  collapsed: boolean;
}

export interface Superposition {
  id: string;
  problemSpace: string;
  states: QuantumState[];
  status: "superposed" | "collapsed";
  collapsedInto?: string;
  createdAt: number;
}

import { generateIntelligence } from "../llama";

export class WaveformCollapseEngine {
  private static instance: WaveformCollapseEngine;

  private constructor() {}

  public static getInstance(): WaveformCollapseEngine {
    if (!WaveformCollapseEngine.instance) {
      WaveformCollapseEngine.instance = new WaveformCollapseEngine();
    }
    return WaveformCollapseEngine.instance;
  }

  public async entangle(problemSpace: string): Promise<Superposition> {
    let parsedStates: QuantumState[] = [];
    try {
      const res = await generateIntelligence(
        `Generate exactly 3 distinct philosophical approaches to solve the problem: "${problemSpace}". 
        Approach 1: Conservative. Approach 2: Lateral/Novel. Approach 3: Radical/High Risk.
        Output STRICTLY as a JSON array of objects with keys: name, philosophy, projectedOutcome, probability (number between 0 and 1), entropy (number between 0 and 1).`,
        { thinking: false }
      );

      const match = res.text.match(/```json\n([\s\S]*?)\n```/) || res.text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) {
        const raw = JSON.parse(match[0].replace(/```json|```/g, ""));
        parsedStates = raw.map((r: any, idx: number) => ({
          id: `q_branch_${idx}_${Date.now()}`,
          name: r.name || `Branch ${idx}`,
          philosophy: r.philosophy || "Unknown philosophy",
          projectedOutcome: r.projectedOutcome || "Unknown outcome",
          probability: Number(r.probability) || 0.33,
          entropy: Number(r.entropy) || 0.5,
          collapsed: false
        }));
      }
    } catch(e) {
      console.error("[WaveformCollapseEngine] LLM generation failed, fallback applied", e);
    }

    if (parsedStates.length === 0) {
      // Fallback if LLM fails
      parsedStates = [
        {
          id: `q_alpha_${Date.now()}`,
          name: "Conservative Alignment",
          philosophy: "Minimize risk, follow established patterns.",
          projectedOutcome: "System maintains stability.",
          probability: 0.65,
          entropy: 0.2,
          collapsed: false,
        }
      ];
    }

    return {
      id: `sp_${Date.now()}`,
      problemSpace,
      states: parsedStates,
      status: "superposed",
      createdAt: Date.now(),
    };
  }

  public collapse(
    superposition: Superposition,
    chosenStateId: string,
  ): Superposition {
    superposition.status = "collapsed";
    superposition.collapsedInto = chosenStateId;

    superposition.states.forEach((state) => {
      state.collapsed = state.id === chosenStateId;
    });

    this.recordToReality(superposition);
    return { ...superposition };
  }

  private recordToReality(superposition: Superposition) {
    try {
      const storedStr = localStorage.getItem("lucy_multiverse") || "[]";
      const stored = JSON.parse(storedStr);
      stored.push(superposition);
      localStorage.setItem("lucy_multiverse", JSON.stringify(stored));
    } catch (err) {
      console.warn("[WaveformEngine] Failed to record collapsed reality.", err);
    }
  }
}
