import { Proposal } from "../../types";

export interface EmmaNode {
  id: string;
  name: string;
  category: "Emotional Buffer" | "Meaning Reconstruction" | "Decompression";
  pressure: number;
  threshold: number;
  status: "normal" | "warning" | "critical";
}

export class EmmaEvaluationEngine {
  private static instance: EmmaEvaluationEngine;
  private nodes: Record<string, EmmaNode> = {};
  private isServer = typeof window === "undefined";
  private db: any = null;

  public static getInstance(): EmmaEvaluationEngine {
    if (!EmmaEvaluationEngine.instance) {
      EmmaEvaluationEngine.instance = new EmmaEvaluationEngine();
    }
    return EmmaEvaluationEngine.instance;
  }

  private constructor() {
    this.nodes = this.getBaselineNodes();
    if (this.isServer) {
      this.initDatabase();
    }
  }

  public setDatabase(db: any) {
    this.db = db;
    try {
      this.db.prepare(`
        CREATE TABLE IF NOT EXISTS emma_nodes (
          node_id TEXT PRIMARY KEY,
          name TEXT,
          category TEXT,
          pressure REAL,
          threshold REAL,
          status TEXT
        )
      `).run();

      this.loadNodesFromDb();
    } catch (e) {
      console.warn("[EmmaEvaluationEngine] External Database setup failed:", e);
    }
  }

  private initDatabase() {
    if (typeof require === "undefined") {
      return;
    }
    try {
      // Lazy load better-sqlite3 so it doesn't break client-side bundling
      const Database = require("better-sqlite3");
      const path = require("path");
      const dbPath = path.join(process.env.LUCY_DB_DIR || "/tmp", "emma_vr_telemetry.db");
      
      this.db = new Database(dbPath, { fileMustExist: false });
      this.db.prepare(`
        CREATE TABLE IF NOT EXISTS emma_nodes (
          node_id TEXT PRIMARY KEY,
          name TEXT,
          category TEXT,
          pressure REAL,
          threshold REAL,
          status TEXT
        )
      `).run();

      this.loadNodesFromDb();
    } catch (e) {
      console.warn("[EmmaEvaluationEngine] Server-side SQLite init failed, falling back to memory:", e);
    }
  }

  private loadNodesFromDb() {
    if (!this.db) return;
    try {
      const rows = this.db.prepare("SELECT node_id, name, category, pressure, threshold, status FROM emma_nodes").all() as any[];
      if (rows && rows.length === 24) {
        rows.forEach((row) => {
          this.nodes[row.node_id] = {
            id: row.node_id,
            name: row.name,
            category: row.category,
            pressure: row.pressure,
            threshold: row.threshold,
            status: row.status,
          };
        });
      } else {
        this.saveNodesToDb();
      }
    } catch (e) {
      console.error("[EmmaEvaluationEngine] Failed to load nodes from database:", e);
    }
  }

  private saveNodesToDb() {
    if (!this.db) return;
    try {
      const insert = this.db.prepare(`
        INSERT OR REPLACE INTO emma_nodes (node_id, name, category, pressure, threshold, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const transaction = this.db.transaction((nodesList: EmmaNode[]) => {
        for (const node of nodesList) {
          insert.run(node.id, node.name, node.category, node.pressure, node.threshold, node.status);
        }
      });

      transaction(Object.values(this.nodes));
    } catch (e) {
      console.error("[EmmaEvaluationEngine] Failed to save nodes to database:", e);
    }
  }

  private getBaselineNodes(): Record<string, EmmaNode> {
    const definitions: { id: string; name: string; category: EmmaNode["category"]; baseline: number; threshold: number }[] = [
      // E01 - E08: Emotional Buffer & Sensitivity
      { id: "E01", name: "Empathy Matrix Stabilization", category: "Emotional Buffer", baseline: 0.15, threshold: 0.80 },
      { id: "E02", name: "Emotional Feedback Bleed-Through", category: "Emotional Buffer", baseline: 0.20, threshold: 0.70 },
      { id: "E03", name: "Stress Isolation Containment", category: "Emotional Buffer", baseline: 0.30, threshold: 0.75 },
      { id: "E04", name: "Resilience Transference Core", category: "Emotional Buffer", baseline: 0.10, threshold: 0.85 },
      { id: "E05", name: "Adaptive Response Resonance", category: "Emotional Buffer", baseline: 0.25, threshold: 0.80 },
      { id: "E06", name: "Mood Coherence Regulator", category: "Emotional Buffer", baseline: 0.15, threshold: 0.75 },
      { id: "E07", name: "Signal Emotional Translation", category: "Emotional Buffer", baseline: 0.30, threshold: 0.80 },
      { id: "E08", name: "Ingress Affective Buffer", category: "Emotional Buffer", baseline: 0.22, threshold: 0.70 },

      // E09 - E16: Meaning Reconstruction & Purpose
      { id: "E09", name: "Context Existential Anchoring", category: "Meaning Reconstruction", baseline: 0.12, threshold: 0.90 },
      { id: "E10", name: "Narrative Validity Verifier", category: "Meaning Reconstruction", baseline: 0.18, threshold: 0.85 },
      { id: "E11", name: "Relational Alignment Consistency", category: "Meaning Reconstruction", baseline: 0.14, threshold: 0.80 },
      { id: "E12", name: "Cognitive Safety Validation", category: "Meaning Reconstruction", baseline: 0.25, threshold: 0.90 },
      { id: "E13", name: "Goal Meaning Cohesion", category: "Meaning Reconstruction", baseline: 0.15, threshold: 0.85 },
      { id: "E14", name: "Semantic Grounding Core", category: "Meaning Reconstruction", baseline: 0.10, threshold: 0.95 },
      { id: "E15", name: "Bond-Reinforcement Engine", category: "Meaning Reconstruction", baseline: 0.08, threshold: 0.90 },
      { id: "E16", name: "Sovereign Value Preservation", category: "Meaning Reconstruction", baseline: 0.05, threshold: 0.95 },

      // E17 - E24: Decompression & Recalibration
      { id: "E17", name: "Entropy Normalization Loop", category: "Decompression", baseline: 0.28, threshold: 0.75 },
      { id: "E18", name: "Tension Deflection Release", category: "Decompression", baseline: 0.35, threshold: 0.70 },
      { id: "E19", name: "System Self-Healing Stabilizer", category: "Decompression", baseline: 0.15, threshold: 0.85 },
      { id: "E20", name: "Escape Velocity Buffer", category: "Decompression", baseline: 0.10, threshold: 0.80 },
      { id: "E21", name: "Trust Boundary Containment", category: "Decompression", baseline: 0.20, threshold: 0.85 },
      { id: "E22", name: "Dynamic Limits Regulator", category: "Decompression", baseline: 0.22, threshold: 0.80 },
      { id: "E23", name: "Simulation Drift Compensator", category: "Decompression", baseline: 0.30, threshold: 0.75 },
      { id: "E24", name: "Cognitive Load Load-Shedder", category: "Decompression", baseline: 0.25, threshold: 0.70 },
    ];

    const nodesMap: Record<string, EmmaNode> = {};
    definitions.forEach((def) => {
      nodesMap[def.id] = {
        id: def.id,
        name: def.name,
        category: def.category,
        pressure: def.baseline,
        threshold: def.threshold,
        status: "normal",
      };
    });
    return nodesMap;
  }

  public getNodes(): EmmaNode[] {
    if (this.isServer) {
      this.loadNodesFromDb();
    }
    return Object.values(this.nodes);
  }

  public updateNodesFromClient(nodesList: EmmaNode[]) {
    nodesList.forEach((n) => {
      this.nodes[n.id] = n;
    });
    if (this.isServer) {
      this.saveNodesToDb();
    }
  }

  /**
   * Evaluates a proposal based on current 24-node pressure states.
   * Modifies pressure values in-place and saves them.
   */
  public evaluateProposal(p: Proposal, globalIntent: string): {
    score: number;
    reasoning: string;
    trustTier: "kernel" | "core" | "user" | "external";
    impact: Record<string, number>;
  } {
    if (this.isServer) {
      this.loadNodesFromDb();
    }

    const novelty = p.novelty ?? 0.5;
    const confidence = p.confidence;
    const cost = p.cost;
    const alignment = p.intentAlignment;

    // Apply pressure adjustments based on proposal parameters
    // 1. Novelty influences E02 (Bleed-Through), E03 (Stress Containment), and E17 (Entropy Loop)
    this.nodes["E02"].pressure = Math.min(1.0, Math.max(0.0, this.nodes["E02"].pressure + novelty * 0.15 - 0.03));
    this.nodes["E03"].pressure = Math.min(1.0, Math.max(0.0, this.nodes["E03"].pressure + (novelty * (1 - confidence)) * 0.20 - 0.02));
    this.nodes["E17"].pressure = Math.min(1.0, Math.max(0.0, this.nodes["E17"].pressure + novelty * 0.25 - 0.05));

    // 2. High cost increases Cognitive Load (E24) and tension (E18)
    this.nodes["E24"].pressure = Math.min(1.0, Math.max(0.0, this.nodes["E24"].pressure + cost * 0.30 - 0.04));
    this.nodes["E18"].pressure = Math.min(1.0, Math.max(0.0, this.nodes["E18"].pressure + cost * 0.15 - 0.03));

    // 3. Poor intent alignment strains Relational Alignment (E11) and Existential Anchor (E09)
    const alignmentStrain = 1.0 - alignment;
    this.nodes["E09"].pressure = Math.min(1.0, Math.max(0.0, this.nodes["E09"].pressure + alignmentStrain * 0.20 - 0.03));
    this.nodes["E11"].pressure = Math.min(1.0, Math.max(0.0, this.nodes["E11"].pressure + alignmentStrain * 0.25 - 0.04));

    // 4. High confidence bolsters Bond (E15), Resilience Transference (E04) and reduces Cognitive Safety (E12) strain
    this.nodes["E15"].pressure = Math.min(1.0, Math.max(0.0, this.nodes["E15"].pressure - confidence * 0.10 + 0.02));
    this.nodes["E04"].pressure = Math.min(1.0, Math.max(0.0, this.nodes["E04"].pressure - confidence * 0.15 + 0.03));
    this.nodes["E12"].pressure = Math.min(1.0, Math.max(0.0, this.nodes["E12"].pressure + (1.0 - confidence) * 0.20 - 0.04));

    // Propagation step: adjacent nodes diffuse pressure
    this.propagatePressure();

    // Update node status labels
    Object.values(this.nodes).forEach((node) => {
      if (node.pressure >= node.threshold) {
        node.status = "critical";
      } else if (node.pressure >= node.threshold * 0.75) {
        node.status = "warning";
      } else {
        node.status = "normal";
      }
    });

    if (this.isServer) {
      this.saveNodesToDb();
    }

    // Calculate aggregate network resilience modifier
    const totalPressure = Object.values(this.nodes).reduce((acc, n) => acc + n.pressure, 0) / 24.0;
    const resilienceModifier = 1.0 - totalPressure;

    // Calculate final evaluated score
    const baseScore = (confidence * 0.3) + (alignment * 0.4) + ((1.0 - cost) * 0.2) + (novelty * 0.1);
    const finalScore = Math.min(1.0, Math.max(0.0, baseScore * (0.7 + 0.3 * resilienceModifier)));

    // Generate custom reasoning based on high-pressure nodes
    const highPressureNodes = Object.values(this.nodes)
      .filter((n) => n.pressure > 0.6)
      .map((n) => n.name);

    let reasoning = "";
    if (highPressureNodes.length > 0) {
      reasoning = `Emma (Resilience Engine): Proposal evaluated with resilience modifiers. Critical pressure observed in: ${highPressureNodes.slice(0, 2).join(", ")}. Emotional containment active.`;
    } else {
      reasoning = `Emma (Resilience Engine): System emotional stability is optimal (${(resilienceModifier * 100).toFixed(1)}%). Proposal authorized under maximum alignment protocols.`;
    }

    const trustTier: "kernel" | "core" | "user" | "external" =
      finalScore > 0.8 ? "kernel" : finalScore > 0.55 ? "core" : finalScore > 0.35 ? "user" : "external";

    const impact: Record<string, number> = {};
    Object.entries(this.nodes).forEach(([id, n]) => {
      impact[id] = Number(n.pressure.toFixed(3));
    });

    return {
      score: Number(finalScore.toFixed(4)),
      reasoning,
      trustTier,
      impact,
    };
  }

  private propagatePressure() {
    const keys = Object.keys(this.nodes);
    const pressures = keys.map((k) => this.nodes[k].pressure);
    const newPressures = [...pressures];

    for (let i = 0; i < 24; i++) {
      const left = (i - 1 + 24) % 24;
      const right = (i + 1) % 24;
      const avg = (pressures[left] + pressures[right]) / 2.0;
      // Diffuse 10% of pressure to neighbors
      newPressures[i] = pressures[i] * 0.9 + avg * 0.1;
    }

    keys.forEach((k, idx) => {
      this.nodes[k].pressure = Math.min(1.0, Math.max(0.05, newPressures[idx]));
    });
  }
}
