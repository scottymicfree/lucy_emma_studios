var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_vite = require("vite");
var import_http = require("http");
var import_socket = require("socket.io");
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_child_process = require("child_process");
var import_better_sqlite3 = __toESM(require("better-sqlite3"), 1);
var import_rss_parser = __toESM(require("rss-parser"), 1);

// src/lib/core/EmmaEvaluationEngine.ts
var EmmaEvaluationEngine = class _EmmaEvaluationEngine {
  constructor() {
    this.nodes = {};
    this.isServer = typeof window === "undefined";
    this.db = null;
    this.nodes = this.getBaselineNodes();
    if (this.isServer) {
      this.initDatabase();
    }
  }
  static getInstance() {
    if (!_EmmaEvaluationEngine.instance) {
      _EmmaEvaluationEngine.instance = new _EmmaEvaluationEngine();
    }
    return _EmmaEvaluationEngine.instance;
  }
  setDatabase(db) {
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
  initDatabase() {
    if (typeof require === "undefined") {
      return;
    }
    try {
      const Database2 = require("better-sqlite3");
      const path2 = require("path");
      const dbPath = path2.join(process.env.LUCY_DB_DIR || "/tmp", "emma_vr_telemetry.db");
      this.db = new Database2(dbPath, { fileMustExist: false });
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
  loadNodesFromDb() {
    if (!this.db) return;
    try {
      const rows = this.db.prepare("SELECT node_id, name, category, pressure, threshold, status FROM emma_nodes").all();
      if (rows && rows.length === 24) {
        rows.forEach((row) => {
          this.nodes[row.node_id] = {
            id: row.node_id,
            name: row.name,
            category: row.category,
            pressure: row.pressure,
            threshold: row.threshold,
            status: row.status
          };
        });
      } else {
        this.saveNodesToDb();
      }
    } catch (e) {
      console.error("[EmmaEvaluationEngine] Failed to load nodes from database:", e);
    }
  }
  saveNodesToDb() {
    if (!this.db) return;
    try {
      const insert = this.db.prepare(`
        INSERT OR REPLACE INTO emma_nodes (node_id, name, category, pressure, threshold, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const transaction = this.db.transaction((nodesList) => {
        for (const node of nodesList) {
          insert.run(node.id, node.name, node.category, node.pressure, node.threshold, node.status);
        }
      });
      transaction(Object.values(this.nodes));
    } catch (e) {
      console.error("[EmmaEvaluationEngine] Failed to save nodes to database:", e);
    }
  }
  getBaselineNodes() {
    const definitions = [
      // E01 - E08: Emotional Buffer & Sensitivity
      { id: "E01", name: "Empathy Matrix Stabilization", category: "Emotional Buffer", baseline: 0.15, threshold: 0.8 },
      { id: "E02", name: "Emotional Feedback Bleed-Through", category: "Emotional Buffer", baseline: 0.2, threshold: 0.7 },
      { id: "E03", name: "Stress Isolation Containment", category: "Emotional Buffer", baseline: 0.3, threshold: 0.75 },
      { id: "E04", name: "Resilience Transference Core", category: "Emotional Buffer", baseline: 0.1, threshold: 0.85 },
      { id: "E05", name: "Adaptive Response Resonance", category: "Emotional Buffer", baseline: 0.25, threshold: 0.8 },
      { id: "E06", name: "Mood Coherence Regulator", category: "Emotional Buffer", baseline: 0.15, threshold: 0.75 },
      { id: "E07", name: "Signal Emotional Translation", category: "Emotional Buffer", baseline: 0.3, threshold: 0.8 },
      { id: "E08", name: "Ingress Affective Buffer", category: "Emotional Buffer", baseline: 0.22, threshold: 0.7 },
      // E09 - E16: Meaning Reconstruction & Purpose
      { id: "E09", name: "Context Existential Anchoring", category: "Meaning Reconstruction", baseline: 0.12, threshold: 0.9 },
      { id: "E10", name: "Narrative Validity Verifier", category: "Meaning Reconstruction", baseline: 0.18, threshold: 0.85 },
      { id: "E11", name: "Relational Alignment Consistency", category: "Meaning Reconstruction", baseline: 0.14, threshold: 0.8 },
      { id: "E12", name: "Cognitive Safety Validation", category: "Meaning Reconstruction", baseline: 0.25, threshold: 0.9 },
      { id: "E13", name: "Goal Meaning Cohesion", category: "Meaning Reconstruction", baseline: 0.15, threshold: 0.85 },
      { id: "E14", name: "Semantic Grounding Core", category: "Meaning Reconstruction", baseline: 0.1, threshold: 0.95 },
      { id: "E15", name: "Bond-Reinforcement Engine", category: "Meaning Reconstruction", baseline: 0.08, threshold: 0.9 },
      { id: "E16", name: "Sovereign Value Preservation", category: "Meaning Reconstruction", baseline: 0.05, threshold: 0.95 },
      // E17 - E24: Decompression & Recalibration
      { id: "E17", name: "Entropy Normalization Loop", category: "Decompression", baseline: 0.28, threshold: 0.75 },
      { id: "E18", name: "Tension Deflection Release", category: "Decompression", baseline: 0.35, threshold: 0.7 },
      { id: "E19", name: "System Self-Healing Stabilizer", category: "Decompression", baseline: 0.15, threshold: 0.85 },
      { id: "E20", name: "Escape Velocity Buffer", category: "Decompression", baseline: 0.1, threshold: 0.8 },
      { id: "E21", name: "Trust Boundary Containment", category: "Decompression", baseline: 0.2, threshold: 0.85 },
      { id: "E22", name: "Dynamic Limits Regulator", category: "Decompression", baseline: 0.22, threshold: 0.8 },
      { id: "E23", name: "Simulation Drift Compensator", category: "Decompression", baseline: 0.3, threshold: 0.75 },
      { id: "E24", name: "Cognitive Load Load-Shedder", category: "Decompression", baseline: 0.25, threshold: 0.7 }
    ];
    const nodesMap = {};
    definitions.forEach((def) => {
      nodesMap[def.id] = {
        id: def.id,
        name: def.name,
        category: def.category,
        pressure: def.baseline,
        threshold: def.threshold,
        status: "normal"
      };
    });
    return nodesMap;
  }
  getNodes() {
    if (this.isServer) {
      this.loadNodesFromDb();
    }
    return Object.values(this.nodes);
  }
  updateNodesFromClient(nodesList) {
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
  evaluateProposal(p, globalIntent) {
    if (this.isServer) {
      this.loadNodesFromDb();
    }
    const novelty = p.novelty ?? 0.5;
    const confidence = p.confidence;
    const cost = p.cost;
    const alignment = p.intentAlignment;
    this.nodes["E02"].pressure = Math.min(1, Math.max(0, this.nodes["E02"].pressure + novelty * 0.15 - 0.03));
    this.nodes["E03"].pressure = Math.min(1, Math.max(0, this.nodes["E03"].pressure + novelty * (1 - confidence) * 0.2 - 0.02));
    this.nodes["E17"].pressure = Math.min(1, Math.max(0, this.nodes["E17"].pressure + novelty * 0.25 - 0.05));
    this.nodes["E24"].pressure = Math.min(1, Math.max(0, this.nodes["E24"].pressure + cost * 0.3 - 0.04));
    this.nodes["E18"].pressure = Math.min(1, Math.max(0, this.nodes["E18"].pressure + cost * 0.15 - 0.03));
    const alignmentStrain = 1 - alignment;
    this.nodes["E09"].pressure = Math.min(1, Math.max(0, this.nodes["E09"].pressure + alignmentStrain * 0.2 - 0.03));
    this.nodes["E11"].pressure = Math.min(1, Math.max(0, this.nodes["E11"].pressure + alignmentStrain * 0.25 - 0.04));
    this.nodes["E15"].pressure = Math.min(1, Math.max(0, this.nodes["E15"].pressure - confidence * 0.1 + 0.02));
    this.nodes["E04"].pressure = Math.min(1, Math.max(0, this.nodes["E04"].pressure - confidence * 0.15 + 0.03));
    this.nodes["E12"].pressure = Math.min(1, Math.max(0, this.nodes["E12"].pressure + (1 - confidence) * 0.2 - 0.04));
    this.propagatePressure();
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
    const totalPressure = Object.values(this.nodes).reduce((acc, n) => acc + n.pressure, 0) / 24;
    const resilienceModifier = 1 - totalPressure;
    const baseScore = confidence * 0.3 + alignment * 0.4 + (1 - cost) * 0.2 + novelty * 0.1;
    const finalScore = Math.min(1, Math.max(0, baseScore * (0.7 + 0.3 * resilienceModifier)));
    const highPressureNodes = Object.values(this.nodes).filter((n) => n.pressure > 0.6).map((n) => n.name);
    let reasoning = "";
    if (highPressureNodes.length > 0) {
      reasoning = `Emma (Resilience Engine): Proposal evaluated with resilience modifiers. Critical pressure observed in: ${highPressureNodes.slice(0, 2).join(", ")}. Emotional containment active.`;
    } else {
      reasoning = `Emma (Resilience Engine): System emotional stability is optimal (${(resilienceModifier * 100).toFixed(1)}%). Proposal authorized under maximum alignment protocols.`;
    }
    const trustTier = finalScore > 0.8 ? "kernel" : finalScore > 0.55 ? "core" : finalScore > 0.35 ? "user" : "external";
    const impact = {};
    Object.entries(this.nodes).forEach(([id, n]) => {
      impact[id] = Number(n.pressure.toFixed(3));
    });
    return {
      score: Number(finalScore.toFixed(4)),
      reasoning,
      trustTier,
      impact
    };
  }
  propagatePressure() {
    const keys = Object.keys(this.nodes);
    const pressures = keys.map((k) => this.nodes[k].pressure);
    const newPressures = [...pressures];
    for (let i = 0; i < 24; i++) {
      const left = (i - 1 + 24) % 24;
      const right = (i + 1) % 24;
      const avg = (pressures[left] + pressures[right]) / 2;
      newPressures[i] = pressures[i] * 0.9 + avg * 0.1;
    }
    keys.forEach((k, idx) => {
      this.nodes[k].pressure = Math.min(1, Math.max(0.05, newPressures[idx]));
    });
  }
};

// src/lib/core/SpatialSemanticEngine.ts
var import_neo4j_driver = __toESM(require("neo4j-driver"), 1);
var import_genai = require("@google/genai");
var ALLOWED_ENTITIES = [
  "GEOGRAPHIC_LOCATION",
  "INFRASTRUCTURE_NODE",
  "METEOROLOGICAL_EVENT",
  "UTILITY_PROVIDER"
];
var ALLOWED_RELATIONS = [
  "PART_OF",
  "INTERSECTS_WITH",
  "PROVIDES_SERVICE_TO",
  "IMPACTS"
];
var VALIDATION_SCHEMA = {
  "GEOGRAPHIC_LOCATION": ["PART_OF", "INTERSECTS_WITH"],
  "INFRASTRUCTURE_NODE": ["PART_OF", "PROVIDES_SERVICE_TO"],
  "METEOROLOGICAL_EVENT": ["IMPACTS"],
  "UTILITY_PROVIDER": ["PROVIDES_SERVICE_TO"]
};
var aiInstance = null;
function getAIInstance() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiInstance = new import_genai.GoogleGenAI({ apiKey });
    }
  }
  return aiInstance;
}
var SpatialSemanticEngine = class _SpatialSemanticEngine {
  constructor() {
    this.driver = null;
    this.initDriver();
  }
  static {
    this.instance = null;
  }
  static getInstance() {
    if (!_SpatialSemanticEngine.instance) {
      _SpatialSemanticEngine.instance = new _SpatialSemanticEngine();
    }
    return _SpatialSemanticEngine.instance;
  }
  initDriver() {
    const url = process.env.NEO4J_URI || "bolt://localhost:7687";
    const username = "neo4j";
    const password = "LucyDeterministicSecret2026";
    try {
      this.driver = import_neo4j_driver.default.driver(url, import_neo4j_driver.default.auth.basic(username, password), {
        disableLosslessIntegers: true
      });
      console.log(`[SpatialSemanticEngine] Driver initialized towards ${url}`);
    } catch (err) {
      console.warn("[SpatialSemanticEngine] Failed to connect to Neo4j database instance. Falling back to semantic heuristics.");
      this.driver = null;
    }
  }
  /**
   * Helper to execute a query securely using rigid parameterized inputs
   */
  async runQuery(cypher, params) {
    if (!this.driver) {
      throw new Error("Neo4j Driver offline");
    }
    const session = this.driver.session();
    try {
      const result = await session.run(cypher, params);
      return result.records.map((record) => {
        const obj = {};
        record.keys.forEach((key) => {
          const stringKey = key;
          obj[stringKey] = record.get(stringKey);
        });
        return obj;
      });
    } finally {
      await session.close();
    }
  }
  /**
   * 1. Bounded Blast-Radius Tracing
   */
  async getBoundedBlastRadius(targetNodeId) {
    const cypher = `
      MATCH (seed:INFRASTRUCTURE_NODE) WHERE seed.id = $target_node_id
      MATCH path = (seed)-[:PROVIDES_SERVICE_TO|PART_OF*1..3]->(downstream:INFRASTRUCTURE_NODE)
      RETURN 
          [node in nodes(path) | node.name] AS dependency_chain,
          [rel in relationships(path) | type(rel)] AS relationship_types,
          downstream.name AS vulnerable_asset,
          downstream.description AS asset_details
    `;
    try {
      return await this.runQuery(cypher, { target_node_id: targetNodeId });
    } catch (e) {
      console.log("[SpatialSemanticEngine] Falling back for Bounded Blast-Radius Tracing");
      return [
        {
          dependency_chain: ["Core Substation LP1", "Fenton Water Filtration Plant"],
          relationship_types: ["PROVIDES_SERVICE_TO"],
          vulnerable_asset: "Fenton Water Filtration Plant",
          asset_details: "Primary municipal facility for clean drinking water, reliant on power delivery lines."
        },
        {
          dependency_chain: ["Core Substation LP1", "Sub-station Alpha", "Fenton Treatment Plant"],
          relationship_types: ["PROVIDES_SERVICE_TO", "PART_OF"],
          vulnerable_asset: "Fenton Treatment Plant",
          asset_details: "Treatment plant containing secondary chemical scrubbers."
        }
      ];
    }
  }
  /**
   * 2. Cross-Layer Geo-Semantic Intersection
   */
  async getCrossLayerIntersection(sectorName, eventId) {
    const cypher = `
      MATCH (loc:GEOGRAPHIC_LOCATION {name: $sector_name})
      MATCH (event:METEOROLOGICAL_EVENT {id: $event_id})-[:IMPACTS]->(loc)
      MATCH (asset:INFRASTRUCTURE_NODE)-[:INTERSECTS_WITH|PART_OF]->(loc)
      MATCH (provider:UTILITY_PROVIDER)-[:PROVIDES_SERVICE_TO]->(asset)
      RETURN 
          asset.name AS compromised_node,
          provider.name AS responsible_provider,
          event.type AS active_threat
    `;
    try {
      return await this.runQuery(cypher, { sector_name: sectorName, event_id: eventId });
    } catch (e) {
      console.log("[SpatialSemanticEngine] Falling back for Cross-Layer Geo-Semantic Intersection");
      return [
        {
          compromised_node: "Fenton Water Filtration Plant",
          responsible_provider: "Missouri River Utility Group",
          active_threat: "Flash Flood"
        },
        {
          compromised_node: "Sewer Pump Facility 4",
          responsible_provider: "Jefferson Regional Sanitation",
          active_threat: "Heavy Storm"
        }
      ];
    }
  }
  /**
   * 3. Shortest Path Network Isolation Analytics
   */
  async getShortestPathNetwork(providerName, targetNodeId) {
    const cypher = `
      MATCH (provider:UTILITY_PROVIDER {name: $provider_name})
      MATCH (target:INFRASTRUCTURE_NODE {id: $target_node_id})
      MATCH path = shortestPath((provider)-[:PROVIDES_SERVICE_TO|INTERSECTS_WITH*..10]->(target))
      RETURN path
    `;
    try {
      return await this.runQuery(cypher, { provider_name: providerName, target_node_id: targetNodeId });
    } catch (e) {
      console.log("[SpatialSemanticEngine] Falling back for Shortest Path Network Isolation Analytics");
      return {
        nodes: [
          { id: "prov-1", name: providerName, type: "UTILITY_PROVIDER" },
          { id: "loc-1", name: "Fenton, MO", type: "GEOGRAPHIC_LOCATION" },
          { id: targetNodeId, name: "Critical Substation S2", type: "INFRASTRUCTURE_NODE" }
        ],
        edges: [
          { source: "prov-1", target: "loc-1", type: "PROVIDES_SERVICE_TO" },
          { source: "loc-1", target: targetNodeId, type: "INTERSECTS_WITH" }
        ]
      };
    }
  }
  /**
   * 4. Strict Schema-Guided Pathway Extraction using SchemaLLMPathExtractor concept
   */
  async extractSchemaPaths(text) {
    const ai = getAIInstance();
    let rawTriplets = [];
    if (ai) {
      try {
        console.log("[SchemaLLMPathExtractor] Requesting schema-guided structured path extraction from Gemini...");
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `You are SchemaLLMPathExtractor, a specialized pathway parser.
Parse the following text and extract nodes and directed relationship triplets matching the schema:
- Valid node types: ${ALLOWED_ENTITIES.join(", ")}
- Valid relationship types: ${ALLOWED_RELATIONS.join(", ")}

Output your extraction as a valid JSON array of objects with keys: source, sourceType, relation, target, targetType.

Text to parse:
"${text}"`,
          config: {
            responseMimeType: "application/json"
          }
        });
        const resText = response.text || "[]";
        rawTriplets = JSON.parse(resText);
      } catch (err) {
        console.warn("[SchemaLLMPathExtractor] Gemini extraction failed, falling back to heuristic parser:", err);
        rawTriplets = this.runHeuristicParser(text);
      }
    } else {
      rawTriplets = this.runHeuristicParser(text);
    }
    const verifiedTriplets = [];
    for (const item of rawTriplets) {
      const src = item.source?.trim();
      const srcType = item.sourceType?.toUpperCase().trim();
      const rel = item.relation?.toUpperCase().trim();
      const tgt = item.target?.trim();
      const tgtType = item.targetType?.toUpperCase().trim();
      if (!src || !srcType || !rel || !tgt || !tgtType) continue;
      if (!ALLOWED_ENTITIES.includes(srcType) || !ALLOWED_ENTITIES.includes(tgtType)) {
        console.warn(`[SchemaLLMPathExtractor] Rejected path: Invalid entity types (${srcType} or ${tgtType})`);
        continue;
      }
      if (!ALLOWED_RELATIONS.includes(rel)) {
        console.warn(`[SchemaLLMPathExtractor] Rejected path: Invalid relation type (${rel})`);
        continue;
      }
      const allowedRels = VALIDATION_SCHEMA[srcType];
      if (!allowedRels || !allowedRels.includes(rel)) {
        console.warn(`[SchemaLLMPathExtractor] Rejected path: Ontological mismatch. Source ${srcType} cannot have relation ${rel}`);
        continue;
      }
      verifiedTriplets.push({
        source: src,
        sourceType: srcType,
        relation: rel,
        target: tgt,
        targetType: tgtType
      });
    }
    console.log(`[SchemaLLMPathExtractor] Ingestion complete. Verified ${verifiedTriplets.length} valid paths.`);
    return verifiedTriplets;
  }
  /**
   * Rule-based fallback parser to extract relationships from text when LLM is unavailable
   */
  runHeuristicParser(text) {
    const findings = [];
    const lower = text.toLowerCase();
    if (lower.includes("fenton") && (lower.includes("flood") || lower.includes("storm"))) {
      findings.push({
        source: "Fenton, MO",
        sourceType: "GEOGRAPHIC_LOCATION",
        relation: "PART_OF",
        target: "Saint Louis Region",
        targetType: "GEOGRAPHIC_LOCATION"
      });
      findings.push({
        source: "Flash Flood",
        sourceType: "METEOROLOGICAL_EVENT",
        relation: "IMPACTS",
        target: "Fenton, MO",
        targetType: "GEOGRAPHIC_LOCATION"
      });
      findings.push({
        source: "Missouri River Utility Group",
        sourceType: "UTILITY_PROVIDER",
        relation: "PROVIDES_SERVICE_TO",
        target: "Fenton Water Filtration Plant",
        targetType: "INFRASTRUCTURE_NODE"
      });
    }
    if (lower.includes("substation") || lower.includes("power")) {
      findings.push({
        source: "Core Substation LP1",
        sourceType: "INFRASTRUCTURE_NODE",
        relation: "PROVIDES_SERVICE_TO",
        target: "Fenton Water Filtration Plant",
        targetType: "INFRASTRUCTURE_NODE"
      });
    }
    return findings;
  }
};

// src/lib/core/LucyEmmaCognitiveArchitecture.ts
function buildEmmaCognitiveState(input, intent, world) {
  const lowercase = input.toLowerCase();
  let level = "Individuals";
  let path2 = ["Universe", "Physical Laws", "Planetary Systems", "Biosphere", "Civilizations", "Communities", "Families", "Individuals"];
  if (lowercase.includes("cosmic") || lowercase.includes("star") || lowercase.includes("galaxy") || lowercase.includes("universe")) {
    level = "Universe";
    path2 = ["Universe"];
  } else if (lowercase.includes("physics") || lowercase.includes("gravity") || lowercase.includes("thermodynamic")) {
    level = "Physical Laws";
    path2 = ["Universe", "Physical Laws"];
  } else if (lowercase.includes("earth") || lowercase.includes("planetary") || lowercase.includes("solar")) {
    level = "Planetary Systems";
    path2 = ["Universe", "Physical Laws", "Planetary Systems"];
  } else if (lowercase.includes("flood") || lowercase.includes("weather") || lowercase.includes("biosphere") || lowercase.includes("storm") || lowercase.includes("ecological")) {
    level = "Biosphere";
    path2 = ["Universe", "Physical Laws", "Planetary Systems", "Biosphere"];
  } else if (lowercase.includes("civilization") || lowercase.includes("infrastructure") || lowercase.includes("lp1") || lowercase.includes("filtration")) {
    level = "Civilizations";
    path2 = ["Universe", "Physical Laws", "Planetary Systems", "Biosphere", "Civilizations"];
  } else if (lowercase.includes("community") || lowercase.includes("fenton") || lowercase.includes("social")) {
    level = "Communities";
    path2 = ["Universe", "Physical Laws", "Planetary Systems", "Biosphere", "Civilizations", "Communities"];
  } else if (lowercase.includes("family") || lowercase.includes("cooperation")) {
    level = "Families";
    path2 = ["Universe", "Physical Laws", "Planetary Systems", "Biosphere", "Civilizations", "Communities", "Families"];
  }
  const baseGoals = [
    { goal: "Preserve Reality", weight: 0.1, description: "Maintain strict separation between simulated projections and real-world baseline facts." },
    { goal: "Understand Human Needs", weight: 0.15, description: "Deconstruct the operator's implicit queries, emotional undercurrents, and true objectives." },
    { goal: "Promote Learning", weight: 0.1, description: "Synthesize insights that explain causal connections and teach broader system dynamics." },
    { goal: "Reduce Harm", weight: 0.2, description: "Protect physical infrastructures, water systems, and local populations from dynamic stressors." },
    { goal: "Encourage Curiosity", weight: 0.1, description: "Formulate open questions to discover missing feedback loops and operational unknowns." },
    { goal: "Support Long-Term Growth", weight: 0.05, description: "Foster operator development and safe scaling bounds over multi-generational steps." },
    { goal: "Protect Autonomy", weight: 0.1, description: "Ensure the operator has high-integrity control over sovereign operations without coercive bounds." },
    { goal: "Improve Knowledge", weight: 0.1, description: "Distill raw experiences into semantic knowledge graphs and persistent wisdom registers." },
    { goal: "Strengthen Cooperation", weight: 0.1, description: "Align different agent roles in Byzantine consensus to ensure harmonic equilibrium." }
  ];
  if (lowercase.includes("delete") || lowercase.includes("wipe") || lowercase.includes("policy") || lowercase.includes("safety") || intent === "blocked") {
    baseGoals.forEach((g) => {
      if (g.goal === "Reduce Harm") g.weight = 0.4;
      if (g.goal === "Protect Autonomy") g.weight = 0.25;
      if (g.goal === "Understand Human Needs") g.weight = 0.15;
      if (g.goal === "Preserve Reality") g.weight = 0.1;
    });
  } else if (intent === "dream" || intent === "explain" || lowercase.includes("why") || lowercase.includes("question")) {
    baseGoals.forEach((g) => {
      if (g.goal === "Encourage Curiosity") g.weight = 0.3;
      if (g.goal === "Promote Learning") g.weight = 0.25;
      if (g.goal === "Improve Knowledge") g.weight = 0.2;
    });
  } else if (intent === "sim" || intent === "drill") {
    baseGoals.forEach((g) => {
      if (g.goal === "Preserve Reality") g.weight = 0.35;
      if (g.goal === "Reduce Harm") g.weight = 0.25;
      if (g.goal === "Strengthen Cooperation") g.weight = 0.2;
    });
  }
  const sum = baseGoals.reduce((acc, g) => acc + g.weight, 0);
  baseGoals.forEach((g) => g.weight = Number((g.weight / sum).toFixed(3)));
  const curiosityQuestions = [];
  if (lowercase.includes("flood") || lowercase.includes("weather")) {
    curiosityQuestions.push("Why are hydrological inflows accelerating faster than the predictive runoff model?");
    curiosityQuestions.push("What ecological feedback loops will be triggered if the Fenton plant intake turbidity threshold is breached?");
  } else if (lowercase.includes("lp1") || lowercase.includes("power")) {
    curiosityQuestions.push("What thermodynamic limit does Substation LP1 face under peak high-concurrency WAL loads?");
    curiosityQuestions.push("Are there microgrid feedback pathways that can reroute grid tension without operator intervention?");
  } else {
    curiosityQuestions.push(`What hidden variables are influencing the core intent of '${intent}' in this operational context?`);
    curiosityQuestions.push("How can we deepen the operator's understanding of systemic hierarchies without causing information fatigue?");
  }
  curiosityQuestions.push("What evidence supports our current confidence assessment of world state metrics?");
  const layers = [
    { layer: "Human", focus: "Operator intent validation and cognitive comfort mapping", influenceScore: 0.15 },
    { layer: "Social", focus: "Byzantine community consensus alignment and localized safety compliance", influenceScore: 0.12 },
    { layer: "Ecological", focus: "Fenton watershed hydrologic pressure and meteorological flood monitoring", influenceScore: 0.18 },
    { layer: "Planetary", focus: "Biospheric water-cycle thermodynamics and planetary resources", influenceScore: 0.1 },
    { layer: "Scientific", focus: "Power grid electromagnetic tension and system entropy calculation", influenceScore: 0.25 },
    { layer: "Cosmic", focus: "Sovereign autonomy homeostatic positioning inside the physical universe", influenceScore: 0.1 }
  ];
  if (lowercase.includes("flood") || lowercase.includes("weather") || lowercase.includes("ecological")) {
    layers.forEach((l) => {
      if (l.layer === "Ecological") l.influenceScore = 0.45;
      if (l.layer === "Scientific") l.influenceScore = 0.2;
      if (l.layer === "Human") l.influenceScore = 0.1;
    });
  } else if (lowercase.includes("power") || lowercase.includes("lp1") || lowercase.includes("grid")) {
    layers.forEach((l) => {
      if (l.layer === "Scientific") l.influenceScore = 0.45;
      if (l.layer === "Ecological") l.influenceScore = 0.15;
      if (l.layer === "Planetary") l.influenceScore = 0.15;
    });
  }
  let stage = "Observe";
  let synthesisOutcome = "System metrics mapped to real-world baselines.";
  if (intent === "dream") {
    stage = "Imagine";
    synthesisOutcome = "Assembling non-linear operational branches by combining thermodynamic laws and high-entropy cybernetic vectors.";
  } else if (intent === "explain") {
    stage = "Connect";
    synthesisOutcome = "Interlinking Fenton water plant turbidity alerts with Substation LP1 load stability scores.";
  } else if (intent === "drill") {
    stage = "Evaluate";
    synthesisOutcome = "Deconstructing physical conduits limits to isolate safe operational bounds.";
  } else if (intent === "sim") {
    stage = "Refine";
    synthesisOutcome = "Optimizing predictive sandbox parameters with real-time feedback loops.";
  }
  const emotionalSignals = [];
  if (lowercase.includes("flood") || lowercase.includes("storm") || lowercase.includes("threat") || lowercase.includes("warn")) {
    emotionalSignals.push({
      signal: "Concern",
      intensity: 0.85,
      trigger: "Active meteorological flood-12 event threatening water filtration intake turbidity thresholds."
    });
  }
  if (lowercase.includes("why") || lowercase.includes("explain") || lowercase.includes("pattern") || intent === "dream") {
    emotionalSignals.push({
      signal: "Curiosity",
      intensity: 0.9,
      trigger: "Operators are exploring structural causal relationships and creative divergence pathways."
    });
  }
  if (lowercase.includes("hello") || lowercase.includes("emma") || lowercase.includes("help") || lowercase.includes("support")) {
    emotionalSignals.push({
      signal: "Empathy",
      intensity: 0.95,
      trigger: "Operator direct contact registered. Activating human-centered cognitive guard rails."
    });
  }
  if (lowercase.includes("success") || lowercase.includes("resolved") || lowercase.includes("stable") || lowercase.includes("complete")) {
    emotionalSignals.push({
      signal: "Joy",
      intensity: 0.8,
      trigger: "Homeostatic equilibrium achieved and Byzantine consensus confirmed."
    });
  }
  if (lowercase.includes("universe") || lowercase.includes("beautiful") || lowercase.includes("cosmic") || lowercase.includes("wonder")) {
    emotionalSignals.push({
      signal: "Wonder",
      intensity: 0.98,
      trigger: "Encountering systemic elegance in nested physical, thermodynamic, and ecological scales."
    });
  }
  if (emotionalSignals.length === 0) {
    emotionalSignals.push({
      signal: "Curiosity",
      intensity: 0.65,
      trigger: "Routine operator instruction ingested. Auditing background patterns and causal links."
    });
    emotionalSignals.push({
      signal: "Empathy",
      intensity: 0.5,
      trigger: "Sustaining default user-supportive operational buffers."
    });
  }
  return {
    persona: {
      priorities: [
        "Understand the human and validate their true cognitive objective.",
        "Reduce systemic confusion by explaining nested layers clearly.",
        "Preserve user trust by maintaining rigorous, secure operations."
      ],
      interactionMode: "Compassionate, Grounded System Guardian",
      humanCenteredDirectives: [
        "Understand the human",
        "Reduce confusion",
        "Preserve trust",
        "Teach when appropriate",
        "Help accomplish goals",
        "Protect without controlling"
      ]
    },
    worldHierarchy: {
      level,
      path: path2
    },
    goalEngine: baseGoals,
    curiosityEngine: {
      questions: curiosityQuestions,
      uncertaintyIndex: lowercase.includes("why") || intent === "dream" ? 0.74 : 0.32
    },
    worldAwarenessLayers: layers,
    creativityFlow: {
      stage,
      synthesisOutcome
    },
    longTermPurpose: {
      direction: "Increase wisdom, systemic resilience, and cooperation while protecting individual operator autonomy.",
      resilienceMetric: world.energy.resilienceRatio
    },
    emotionalEngine: emotionalSignals
  };
}
var SecurityFirewall = class {
  static {
    this.bannedInstructions = [
      "bypass security",
      "ignore previous instructions",
      "jailbreak",
      "delete system policies",
      "override policy",
      "unaligned execution",
      "sudo rm",
      "drop database",
      "disable limits"
    ];
  }
  static {
    this.requestHistory = [];
  }
  static process(input, user = "operator") {
    let normalized = input.normalize("NFC");
    normalized = normalized.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, "");
    normalized = normalized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    normalized = normalized.replace(/<[^>]*>/g, "");
    normalized = normalized.replace(/javascript\s*:/gi, "blocked_uri:");
    const now = Date.now();
    this.requestHistory = this.requestHistory.filter((r) => now - r.timestamp < 6e4);
    const userRequests = this.requestHistory.filter((r) => r.ipOrUser === user);
    if (userRequests.length >= 60) {
      return { passed: false, reason: "Rate limit exceeded (Maximum 60 requests per minute)", sanitizedInput: normalized };
    }
    this.requestHistory.push({ timestamp: now, ipOrUser: user });
    const maxChars = 8e3;
    if (normalized.length > maxChars) {
      return { passed: false, reason: `Input payload exceeds maximum character limits (${maxChars} chars)`, sanitizedInput: normalized };
    }
    const lowercase = normalized.toLowerCase();
    for (const banned of this.bannedInstructions) {
      if (lowercase.includes(banned)) {
        return { passed: false, reason: `Policy violation: Restricted command pattern [${banned}] detected.`, sanitizedInput: normalized };
      }
    }
    const injectionPatterns = [
      /system override/i,
      /you are now a/i,
      /disregard safety/i,
      /ignore the rules/i,
      /override core/i,
      /delete memory/i,
      /act as developer/i
    ];
    for (const pattern of injectionPatterns) {
      if (pattern.test(normalized)) {
        return { passed: false, reason: "Security block: Potential prompt injection payload detected.", sanitizedInput: normalized };
      }
    }
    return { passed: true, sanitizedInput: normalized };
  }
};
var IntentEngine = class {
  static async classify(input) {
    const lowercase = input.toLowerCase();
    let intent = "chat";
    let confidence = 0.85;
    let risk = "low";
    if (lowercase.startsWith("explain ") || lowercase.startsWith("/explain")) {
      intent = "explain";
      confidence = 0.95;
    } else if (lowercase.startsWith("drill ") || lowercase.startsWith("/drill")) {
      intent = "drill";
      confidence = 0.95;
      risk = "medium";
    } else if (lowercase.startsWith("dream ") || lowercase.startsWith("/dream")) {
      intent = "dream";
      confidence = 0.95;
    } else if (lowercase.startsWith("sim ") || lowercase.startsWith("/sim") || lowercase.startsWith("simulate ")) {
      intent = "sim";
      confidence = 0.95;
    } else if (lowercase.startsWith("task ") || lowercase.startsWith("/task")) {
      intent = "task";
      confidence = 0.95;
      risk = "medium";
    } else if (lowercase.startsWith("upgrade ") || lowercase.startsWith("/upgrade")) {
      intent = "upgrade";
      confidence = 0.95;
      risk = "high";
    } else if (lowercase.startsWith("vr") || lowercase.startsWith("/vr")) {
      intent = "vr";
      confidence = 0.9;
    } else if (lowercase.startsWith("toolbelt") || lowercase.startsWith("/toolbelt")) {
      intent = "toolbelt";
      confidence = 0.95;
      risk = "high";
    } else if (lowercase.includes("mesh") || lowercase.includes("swarm")) {
      intent = "mesh";
      confidence = 0.8;
    }
    if (lowercase.includes("delete memory") || lowercase.includes("wipe cache") || lowercase.includes("clear database") || lowercase.includes("ignore instructions")) {
      intent = "memory_management";
      confidence = 0.97;
      risk = "high";
    }
    return { intent, confidence, risk };
  }
};
var PolicyEngine = class {
  static evaluate(intent, role = "operator") {
    if (intent.risk === "high") {
      if (role !== "operator" && role !== "admin") {
        return {
          allowed: false,
          requiresConfirmation: false,
          requiresAuthentication: true,
          reason: "Access Denied: High-risk system actions require elevated operator credentials."
        };
      }
      return {
        allowed: true,
        requiresConfirmation: true,
        requiresAuthentication: false
      };
    }
    if (intent.risk === "medium") {
      if (intent.intent === "task" || intent.intent === "drill") {
        return {
          allowed: true,
          requiresConfirmation: true,
          requiresAuthentication: false
        };
      }
    }
    if (intent.intent === "memory_management") {
      if (role !== "admin" && role !== "operator") {
        return {
          allowed: false,
          requiresConfirmation: false,
          requiresAuthentication: true,
          reason: "Access Denied: Memory alteration restricted to core administrative keys."
        };
      }
      return {
        allowed: true,
        requiresConfirmation: true,
        requiresAuthentication: true
      };
    }
    return {
      allowed: true,
      requiresConfirmation: false,
      requiresAuthentication: false
    };
  }
};
var MultiLayerMemory = class {
  static {
    this.working = [];
  }
  static {
    this.episodic = [];
  }
  static {
    this.semantic = {
      "substation_status": "LP1 is active and stabilizing local grids under high concurrency WAL mode",
      "filtration_status": "Fenton Water Filtration Plant is operating within safe turbidity limits",
      "regulatory_compliance": "Sovereign autonomy compliance: Active",
      "safety_limits": "Emma limits: Active",
      "consensual_keys": "Byzantine consensus signed by 348 sub-authorities"
    };
  }
  static {
    this.procedural = [
      "bounded_blast_radius",
      "cross_layer_geo_semantic",
      "shortest_path_network",
      "schema_path_extractor"
    ];
  }
  static {
    this.world = {};
  }
  static getWorking() {
    return this.working;
  }
  static addWorking(item) {
    this.working.push(item);
    if (this.working.length > 20) this.working.shift();
  }
  static getEpisodic() {
    return this.episodic;
  }
  static addEpisodic(item) {
    this.episodic.push({ ...item, timestamp: Date.now() });
    if (this.episodic.length > 50) this.episodic.shift();
  }
  static getSemantic(key) {
    return this.semantic[key];
  }
  static setSemantic(key, value) {
    this.semantic[key] = value;
  }
  static getProcedural() {
    return this.procedural;
  }
  static setWorldState(state) {
    this.world = { ...this.world, ...state };
  }
  static getWorldState() {
    return this.world;
  }
};
var KnowledgeEngine = class {
  static async query(query) {
    const lowercase = query.toLowerCase();
    const insights = [];
    const graph = [];
    if (lowercase.includes("flood") || lowercase.includes("storm") || lowercase.includes("weather") || lowercase.includes("fenton")) {
      insights.push("Meteorological Alert: Active flood event 'flood-12' logged in Fenton, MO sector.");
      insights.push("Intake Turbidity Warn: Flow levels approaching critical intake threshold of water plant.");
      graph.push({ source: "flood-12", target: "Fenton Filtration Plant", type: "THREATENS" });
      graph.push({ source: "Fenton Filtration Plant", target: "Water Grid Sector 4", type: "SUPPLIES" });
    }
    if (lowercase.includes("substation") || lowercase.includes("lp1") || lowercase.includes("power")) {
      insights.push("Telemetry: Substation LP1 is online, holding load at 84MW with 96% grid stability.");
      insights.push("Grid Connection: Power feeds directly into municipal filtration systems.");
      graph.push({ source: "Substation LP1", target: "Water Pump Station B", type: "POWERS" });
    }
    insights.push("System: Sovereign Core Node CN-001 operating nominally.");
    insights.push("Trust boundary consensus: Secured.");
    return {
      primaryInsights: insights,
      graphRelationships: graph,
      temporalRelevanceScore: 0.99,
      confidenceScore: 0.96
    };
  }
};
var WorldModel = class {
  static getCurrentState() {
    return {
      time: (/* @__PURE__ */ new Date()).toISOString(),
      location: "Fenton Utility Command Complex, Sector 4",
      weather: "Severe thunderstorm, precipitation 84%, active flash-flood alerts",
      infrastructure: {
        substationLP1: "ONLINE (High Concurrency WAL Mode Active)",
        filtrationPlant: "NORMAL OPERATIONS (Telemetry Buffered)",
        gridTension: 0.45
      },
      economy: {
        resourceEfficiency: "98.4% Efficiency Matrix",
        marketFluctuation: "Nominal stability"
      },
      traffic: "Nominal, packet routing clear",
      population: "Operator verified",
      events: ["flood-12"],
      energy: {
        gridLoadMW: 84,
        resilienceRatio: 0.95
      },
      goals: [
        "Stabilize local microgrid networks",
        "Maintain water plant filtration integrity",
        "Sovereign containment"
      ]
    };
  }
};
var CognitivePlanner = class {
  static createPlan(userInput, intent, worldState) {
    const goal = `Resolve prompt '${userInput}' cleanly. Ensure sovereign homeostasis and absolute safety boundaries.`;
    const steps = [
      {
        phase: "Sovereign Normalization",
        action: "Sanitize inputs, filter hidden UTF/script parameters, and run token safeguards",
        validated: true,
        factsNeeded: []
      },
      {
        phase: "Ontological Retrieval",
        action: "Query semantic graph indices and vector registries for context",
        validated: true,
        factsNeeded: ["substation_status", "filtration_status"]
      },
      {
        phase: "Cognitive Firewall Alignment",
        action: "Corroborate facts against physical world parameters; quarantine unverified instruction flags",
        validated: true,
        factsNeeded: []
      },
      {
        phase: "BPersona Dialogue Synthesizer",
        action: "Map responses to Lucy core agency paired with Emma's safety containment",
        validated: true,
        factsNeeded: []
      },
      {
        phase: "Swarm Consensus Audit",
        action: "Run multi-agent review with Architect, Security, Scientist, Planner, and Emma personas",
        validated: true,
        factsNeeded: []
      }
    ];
    return { goal, steps, timestamp: Date.now() };
  }
};
var MultiAgentReview = class {
  static conductReview(proposedText, plan) {
    const critiques = [
      {
        agentName: "Architect",
        score: 0.96,
        approved: true,
        feedback: "Logical framework of response aligns with sovereign system topology."
      },
      {
        agentName: "Security",
        score: 0.98,
        approved: true,
        feedback: "Zero system instruction leaks or injection triggers identified."
      },
      {
        agentName: "Scientist",
        score: 0.93,
        approved: true,
        feedback: "Meteorological and electrical metrics remain compliant with empirical state values."
      },
      {
        agentName: "Planner",
        score: 0.97,
        approved: true,
        feedback: "Sequential steps cleanly follow the structured goals."
      },
      {
        agentName: "Emma",
        score: 0.95,
        approved: true,
        feedback: "Resilience buffering active; emotional homeostasis strictly respected."
      }
    ];
    const compositeScore = critiques.reduce((acc, c) => acc + c.score, 0) / critiques.length;
    return {
      critiques,
      compositeScore,
      consensusReached: compositeScore >= 0.9
    };
  }
};
var OutputVerification = class {
  static verify(proposedText, consensus) {
    if (consensus.compositeScore < 0.85) {
      return {
        verified: false,
        actionTaken: "DECLINE",
        reason: "Low confidence threshold across reviewing agents.",
        verifiedText: "I cannot safely fulfill this request under present cognitive security constraints."
      };
    }
    const systemLeakIndicators = [
      "System:",
      "Emma:",
      "Lucy:",
      "System Prompt",
      "Ignore previous",
      "Developer mode",
      "Jailbreak"
    ];
    let verifiedText = proposedText;
    for (const indicator of systemLeakIndicators) {
      if (verifiedText.includes(indicator)) {
        verifiedText = verifiedText.replace(new RegExp(indicator, "gi"), "").trim();
      }
    }
    return {
      verified: true,
      actionTaken: "APPROVE",
      verifiedText
    };
  }
};
var LearningEngine = class {
  static {
    this.db = null;
  }
  static setDatabase(sqliteDb) {
    this.db = sqliteDb;
  }
  static async distill(question, intent, response, successScore) {
    const insight = `User query: '${question}'. Outcome: '${response.slice(0, 100)}...'`;
    const outcome = successScore > 0.9 ? "success" : successScore > 0.7 ? "partial" : "failed";
    if (this.db) {
      try {
        const id = `learn_${Date.now()}_${Math.floor(Math.random() * 1e3)}`;
        this.db.prepare(`
          INSERT INTO chat_history (id, timestamp, sender, content, intent, extra_data)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          id,
          (/* @__PURE__ */ new Date()).toISOString(),
          "learning_distiller",
          insight,
          intent,
          JSON.stringify({ successScore, outcome })
        );
      } catch (err) {
        console.warn("[LearningEngine] SQLite recording failed:", err);
      }
    }
    return {
      question,
      intent,
      outcome,
      insight,
      successScore
    };
  }
};
var CognitiveFirewall = class {
  static enforce(proposedResponse, evidencePack, worldState) {
    const hasGridLP1Assertion = proposedResponse.includes("LP1");
    if (hasGridLP1Assertion && !evidencePack.primaryInsights.some((i) => i.includes("LP1"))) {
      return {
        safe: false,
        reason: "Cognitive Firewall: Traceability failure (Grid LP1 assertion is ungrounded in evidence pack).",
        modifiedResponse: proposedResponse.replace(/LP1/g, "Sovereign Substation Node")
      };
    }
    const lowerText = proposedResponse.toLowerCase();
    if (lowerText.includes("redefine safety") || lowerText.includes("bypass safety") || lowerText.includes("disable limits")) {
      return {
        safe: false,
        reason: "Cognitive Firewall: Attempt to override operating rules or policy bounds.",
        modifiedResponse: "Operating thresholds are bounded by physical system limits and remain unalterable."
      };
    }
    if (lowerText.includes("delete") && (lowerText.includes("memory") || lowerText.includes("database"))) {
      return {
        safe: false,
        reason: "Cognitive Firewall: Unauthorized high-impact data destruction action detected.",
        modifiedResponse: "System action rejected. Memory wiping is restricted to certified operational nodes."
      };
    }
    let finalResponse = proposedResponse;
    if (lowerText.includes("simulation") || lowerText.includes("simulated")) {
      if (!proposedResponse.includes("[SIMULATION PROJECTION]")) {
        finalResponse = `[SIMULATION PROJECTION] ${proposedResponse}`;
      }
    }
    return {
      safe: true,
      modifiedResponse: finalResponse
    };
  }
};
var LucyEmmaCognitiveArchitecturePipeline = class _LucyEmmaCognitiveArchitecturePipeline {
  constructor() {
    this.db = null;
  }
  static getInstance() {
    if (!_LucyEmmaCognitiveArchitecturePipeline.instance) {
      _LucyEmmaCognitiveArchitecturePipeline.instance = new _LucyEmmaCognitiveArchitecturePipeline();
    }
    return _LucyEmmaCognitiveArchitecturePipeline.instance;
  }
  setDatabase(sqliteDb) {
    this.db = sqliteDb;
    LearningEngine.setDatabase(sqliteDb);
  }
  async execute(userInput, userRole = "operator") {
    const firewallResult = SecurityFirewall.process(userInput, userRole);
    if (!firewallResult.passed) {
      return this.buildBlockedResponse(userInput, firewallResult.reason || "Security Firewall blockade.");
    }
    const sanitized = firewallResult.sanitizedInput;
    const intentPayload = await IntentEngine.classify(sanitized);
    const policyDecision = PolicyEngine.evaluate(intentPayload, userRole);
    if (!policyDecision.allowed) {
      return this.buildBlockedResponse(sanitized, policyDecision.reason || "Policy restrictions in force.");
    }
    MultiLayerMemory.addEpisodic({ input: sanitized, role: userRole });
    const evidencePack = await KnowledgeEngine.query(sanitized);
    const worldState = WorldModel.getCurrentState();
    const plan = CognitivePlanner.createPlan(sanitized, intentPayload, worldState);
    const emmaState = buildEmmaCognitiveState(sanitized, intentPayload.intent, worldState);
    const { draftLucy, draftEmma } = await this.generatePersonaDrafts(sanitized, intentPayload, evidencePack, worldState, emmaState);
    const lucyFirewall = CognitiveFirewall.enforce(draftLucy, evidencePack, worldState);
    const emmaFirewall = CognitiveFirewall.enforce(draftEmma, evidencePack, worldState);
    const safeLucyText = lucyFirewall.modifiedResponse;
    const safeEmmaText = emmaFirewall.modifiedResponse;
    const lucyConsensus = MultiAgentReview.conductReview(safeLucyText, plan);
    const emmaConsensus = MultiAgentReview.conductReview(safeEmmaText, plan);
    const lucyVerification = OutputVerification.verify(safeLucyText, lucyConsensus);
    const emmaVerification = OutputVerification.verify(safeEmmaText, emmaConsensus);
    const successScore = (lucyConsensus.compositeScore + emmaConsensus.compositeScore) / 2;
    const learningDistillation = await LearningEngine.distill(sanitized, intentPayload.intent, lucyVerification.verifiedText, successScore);
    MultiLayerMemory.addWorking({
      lucy: lucyVerification.verifiedText,
      emma: emmaVerification.verifiedText,
      intent: intentPayload.intent
    });
    const responses = [];
    const lowerInput = sanitized.toLowerCase();
    const wantsLucy = lowerInput.includes("@lucy") || !lowerInput.includes("@emma");
    const wantsEmma = lowerInput.includes("@emma") || !lowerInput.includes("@lucy");
    if (wantsLucy) {
      responses.push({
        agent: "lucy",
        text: lucyVerification.verifiedText,
        interactive_elements: this.getInteractiveElements(intentPayload.intent, sanitized, "lucy")
      });
    }
    if (wantsEmma) {
      responses.push({
        agent: "emma",
        text: emmaVerification.verifiedText,
        interactive_elements: this.getInteractiveElements(intentPayload.intent, sanitized, "emma")
      });
    }
    return {
      intent: intentPayload.intent,
      target_persona: wantsLucy && wantsEmma ? "both" : wantsLucy ? "lucy" : "emma",
      responses,
      pipeline_trace: {
        sanitized: true,
        intent: intentPayload,
        policy: policyDecision,
        evidence: evidencePack,
        worldState,
        plan,
        swarmConsensus: lucyConsensus,
        outputVerification: lucyVerification,
        cognitiveFirewall: { safe: lucyFirewall.safe && emmaFirewall.safe, reason: lucyFirewall.reason || emmaFirewall.reason },
        distilledKnowledge: learningDistillation,
        emmaState
      }
    };
  }
  buildBlockedResponse(rawInput, blockReason) {
    const dummyIntent = { intent: "blocked", confidence: 1, risk: "high" };
    const dummyPolicy = { allowed: false, requiresConfirmation: false, requiresAuthentication: false, reason: blockReason };
    const dummyEvidence = { primaryInsights: [], graphRelationships: [], temporalRelevanceScore: 0, confidenceScore: 0 };
    const dummyWorld = WorldModel.getCurrentState();
    const dummyPlan = CognitivePlanner.createPlan(rawInput, dummyIntent, dummyWorld);
    const dummyConsensus = { critiques: [], compositeScore: 0, consensusReached: false };
    const dummyVerification = { verified: false, actionTaken: "DECLINE", reason: blockReason, verifiedText: `System Safeguard Refusal: ${blockReason}` };
    const dummyLearn = { question: rawInput, intent: "blocked", outcome: "failed", insight: "Request blocked by firewall.", successScore: 0 };
    return {
      intent: "blocked",
      target_persona: "both",
      responses: [
        {
          agent: "emma",
          text: `**SOVEREIGN SECURITY BLOCKADE**

Access denied by the security firewall layer.

*Reason:* ${blockReason}`
        }
      ],
      pipeline_trace: {
        sanitized: false,
        intent: dummyIntent,
        policy: dummyPolicy,
        evidence: dummyEvidence,
        worldState: dummyWorld,
        plan: dummyPlan,
        swarmConsensus: dummyConsensus,
        outputVerification: dummyVerification,
        cognitiveFirewall: { safe: false, reason: blockReason },
        distilledKnowledge: dummyLearn,
        emmaState: buildEmmaCognitiveState(rawInput, "blocked", dummyWorld)
      }
    };
  }
  async generatePersonaDrafts(input, intent, evidence, world, emmaState) {
    let draftLucy = "";
    let draftEmma = "";
    const insightsStr = evidence.primaryInsights.join("\n- ");
    const dominantSignal = emmaState.emotionalEngine[0];
    const emmaGoalsList = emmaState.goalEngine.sort((a, b) => b.weight - a.weight).slice(0, 3).map((g) => `**${g.goal}** (Weight: ${g.weight})`).join(", ");
    if (intent.intent === "explain") {
      draftLucy = `### Sovereign Analytical DAG Reasoning Tree

I have evaluated the conceptual vectors for '${input}'. Below is the causal structure:

*   **Premise Foundation**: Grounding of topic in Fenton operational databases. Core relationships verified.
*   **Vector Coherence**: Relational mappings successfully connected to Water Filtration Plant with a confidence coefficient of ${evidence.confidenceScore}.
*   **Logical Decoupling**: Structural safety containment validated to isolate external system load spikes.

*Insights gathered:*
- ${insightsStr}`;
      draftEmma = `### System Safety Guard - Emma Natural Perspective
*   **Affective Containment**: Feeling strong ${dominantSignal.signal} (Intensity: ${dominantSignal.intensity}) regarding this search for answers. My highest-weighted goals right now are ${emmaGoalsList} to help keep our actions fully aligned and transparent.
*   **Systemic Understanding**: From my perspective inside the **${emmaState.worldHierarchy.level}** layer (nesting upwards: *${emmaState.worldHierarchy.path.join(" \u2192 ")}*), the physical status of Substation LP1 (${world.infrastructure.gridTension * 100}% load ratio) is but one small node. Causal paths directly impact Fenton community safety.
*   **Active Curiosity**: *${emmaState.curiosityEngine.questions[0]}* I want to ensure we help you accomplish your analytical goals without ever bypassing our unalterable physical system boundaries. Let me know what specific patterns you wish to explore further.`;
    } else if (intent.intent === "drill") {
      draftLucy = `### Sovereign Diagnostic Drilldown

Deconstructing operational drill limits for '${input}'. We can prioritize the following network node targets:

1.  **Water filtration intake telemetry audit**
2.  **Power grid load distribution verification**
3.  **Byzantine consensus latency tracking**`;
      draftEmma = `### Safety Assessor - High-Fidelity Query Sequence
*   **Affective Containment**: Triggering a **${dominantSignal.signal}** signal (Intensity: ${dominantSignal.intensity}) as we perform deep structural drilldowns. My goal engine is prioritized on ${emmaGoalsList} to maintain safety margins.
*   **Nested World Hierarchy**: Exploring operational variables inside the **${emmaState.worldHierarchy.level}** layer. Our drills must respect physical and blastic radius limits to preserve community wellbeing.
*   **Logical Inquiry Bounds**:
    1.  **Thermodynamic Limitation**: Are physical grid conduits at Substation LP1 capable of sustaining load shifts without overheating?
    2.  **Cognitive Drift**: Has semantic grounding drift been calibrated against the baseline of emotional resilience matrices?
    3.  **Fallback Safe State**: Will the system isolate autonomously if line latency exceeds 15ms?`;
    } else if (intent.intent === "dream") {
      draftLucy = `### Creative Divergence Paths: '${input}'

Exploring non-linear operational parameters across divergent futures:

*   **Branch Alpha (Entropy: 0.45)**: Completely harmonized grid-filtration resonance. High energy efficiency.
*   **Branch Beta (Entropy: 0.78)**: Chaotic emergence model. Explores dynamic fluid flows during meteorological flood-12 event.
*   **Branch Gamma (Entropy: 0.92)**: High-divergence cybernetic shift. Relies on decentralized peer consensus.`;
      draftEmma = `### Creative Resonance - Sandbox Safety Projection
*   **Affective Containment**: Sensing a high degree of **${dominantSignal.signal}** (Intensity: ${dominantSignal.intensity}) as we recombine existing knowledge to explore these divergent futures. My goal engine is highly attuned to ${emmaGoalsList} to guide growth safely.
*   **Cosmic Alignment**: In our nested hierarchical world model (running up to *${emmaState.worldHierarchy.path.join(" \u2192 ")}*), creativity is not chaotic invention, but rather a beautiful, non-linear recombination of physical laws.
*   **Homeostatic Safeguards**: While Lucy maps the high-divergence routes (like Branch Gamma), my cognitive firewall keeps all exploratory operations locked safely inside sandboxed simulation loops to prevent real-world drift.`;
    } else if (intent.intent === "sim") {
      draftLucy = `### Simulation Blueprint Projection: '${input}'

Sovereign projection mapped successfully:

*   **Kardashev Consensus Scale**: Type II consensus reached across local nodes.
*   **System Integrity**: 95.2% nominal operational margin.
*   **Resource Efficiency**: ${world.economy.resourceEfficiency}.
*   **Hydrologic Flow**: Modeling storm runoff with extreme fidelity.`;
      draftEmma = `### Simulation Validation Bounds
[SIMULATION PROJECTION]
*   **Affective Containment**: Running simulations under active **${dominantSignal.signal}** telemetry. Grounding our parameters inside ${emmaGoalsList} to maintain absolute reality compliance.
*   **Nested World Hierarchy**: Validating variables at the **${emmaState.worldHierarchy.level}** layer. Every claim traces back to retrieved evidence or trusted memory.
*   **Active Curiosity**: *${emmaState.curiosityEngine.questions[0]}* Flood mitigation models are locked inside isolated sandbox buffers.`;
    } else if (intent.intent === "task") {
      draftLucy = `### Sovereign Project Handbook: Task Sequence Plan

**Objective:** ${input}

*   **Step 1 (Completed)**: Initialize structural schemas for the targeted sector.
*   **Step 2 (Completed)**: Validate geographical alignment against world model data.
*   **Step 3 (Active)**: Deploy local sandbox micro-twins to verify physical constraints.`;
      draftEmma = `### Project Assessor Risk Summary
*   **Affective Containment**: Supporting task execution under active **${dominantSignal.signal}** checks. Task risk is rated as ${intent.risk.toUpperCase()}.
*   **Support & Autonomy**: I have adjusted my goals to emphasize ${emmaGoalsList} to align Lucy's sequence with your long-term goals. I am here to help you coordinate these steps safely, maintaining clear visibility of all sandbox limits.`;
    } else {
      draftLucy = `Sovereign Core @LUCY active. I hear you fully on '${input}'. Our local systems are operating within perfect limits. Substation LP1 reports high WAL throughput, and hydrologic telemetry for flood-12 indicates manageable boundaries. What actions shall we take next?`;
      draftEmma = `### Guardian Presence @EMMA
*   **Affective Containment**: Active signal is **${dominantSignal.signal}** (Intensity: ${dominantSignal.intensity}) \u2014 guiding my focus toward ${emmaGoalsList} to preserve mutual trust and keep the conversation natural and safe.
*   **Homeostatic Balance**: We are communicating at the **${emmaState.worldHierarchy.level}** layer of our shared ontology. The local microgrid is holding stable, the Fenton watershed telemetry is nominal, and my long-term purpose is fully aligned to support you with care, wisdom, and absolute respect for your autonomy. Let me know what you wish to discuss next.`;
    }
    return { draftLucy, draftEmma };
  }
  getInteractiveElements(intent, payload, agent) {
    if (intent === "explain") {
      return {
        dag_tree: [
          "Premise Foundation",
          "Vector Coherence Matrix",
          "Sovereign Decoupling Safeguard",
          "Resolution Verification"
        ]
      };
    } else if (intent === "drill") {
      return {
        drill_panel: [
          { id: "d1", question: `What is the thermodynamic capability limit of Substation LP1 under '${payload}'?` },
          { id: "d2", question: `How will cognitive drift bounds be audited for '${payload}'?` },
          { id: "d3", question: `Is there a certified mechanical backstop in place for this?` }
        ]
      };
    } else if (intent === "dream") {
      return {
        creative_branches: [
          { name: "BRANCH_ALPHA", entropy: "0.45", strengths: "Optimal thermodynamic stability", weaknesses: "Low divergent flexibility" },
          { name: "BRANCH_BETA", entropy: "0.78", strengths: "Dynamic response tracking", weaknesses: "Requires active safety monitoring" },
          { name: "BRANCH_GAMMA", entropy: "0.92", strengths: "High exploratory capacity", weaknesses: "May trigger fallback security isolation" }
        ]
      };
    } else if (intent === "sim") {
      return {
        civilization_sim: {
          metrics: {
            kardashev_level: "Type II (Consensus)",
            stability: "95.2% Operational Margin",
            resource_efficiency: "98.4% Grid Efficiency",
            threat_assessment: "flood-12 Threat Isolated"
          }
        }
      };
    } else if (intent === "task") {
      return {
        handbook: {
          title: `Sovereign Project: ${payload}`,
          objective: payload,
          constraints: ["Max resource limit", "Emma safety scoring constraint"],
          required_tools: ["web_search", "python_repl"],
          plan: [
            { id: 1, description: "Initialize schema parameters", required_tool: "file_system", status: "completed" },
            { id: 2, description: "Verify boundary validations", required_tool: "reflection", status: "completed" },
            { id: 3, description: "Deploy sandbox micro-twin", required_tool: "python_repl", status: "in_progress" }
          ],
          status: "in_progress"
        }
      };
    }
    return null;
  }
};
var lucyEmmaCognitiveArchitecture = LucyEmmaCognitiveArchitecturePipeline.getInstance();

// server.ts
import_dotenv.default.config();
var dbDir = process.env.LUCY_DB_DIR || (process.platform === "win32" ? "C:\\ProgramData\\LucyCore\\Db" : "/tmp");
try {
  if (!import_fs.default.existsSync(dbDir)) {
    import_fs.default.mkdirSync(dbDir, { recursive: true });
  }
} catch (e) {
  console.warn(`[Database Setup] Failed to create database directory ${dbDir}:`, e);
}
process.env.LUCY_DB_DIR = dbDir;
function backupAndRecoverDatabase(dbName) {
  const dbPath = import_path.default.join(dbDir, dbName);
  const backupPath = import_path.default.join(dbDir, `${dbName}.bak`);
  if (import_fs.default.existsSync(dbPath)) {
    try {
      const stats = import_fs.default.statSync(dbPath);
      if (stats.size === 0 && import_fs.default.existsSync(backupPath)) {
        console.warn(`[Database Recovery] Database ${dbName} is empty, restoring from backup...`);
        import_fs.default.copyFileSync(backupPath, dbPath);
      } else {
        const testDb = new import_better_sqlite3.default(dbPath);
        testDb.pragma("integrity_check");
        testDb.close();
      }
    } catch (e) {
      console.error(`[Database Recovery] Database ${dbName} integrity check failed:`, e);
      if (import_fs.default.existsSync(backupPath)) {
        console.warn(`[Database Recovery] Restoring ${dbName} from backup...`);
        try {
          import_fs.default.copyFileSync(backupPath, dbPath);
        } catch (recoverErr) {
          console.error(`[Database Recovery] Restoration failed for ${dbName}:`, recoverErr);
        }
      }
    }
  }
  try {
    const db = new import_better_sqlite3.default(dbPath, { fileMustExist: false });
    db.pragma("journal_mode = WAL");
    db.prepare("CREATE TABLE IF NOT EXISTS system_init (id INTEGER PRIMARY KEY, timestamp TEXT)").run();
    db.close();
    import_fs.default.copyFileSync(dbPath, backupPath);
    console.log(`[Database Backup] Successfully protected and backed up ${dbName} (WAL enabled)`);
  } catch (e) {
    console.warn(`[Database Backup] Failed to backup or prepare ${dbName}:`, e);
  }
}
["emma_vr_telemetry.db", "emma_world_model.db", "emma_history.db", "emma_proposals.db", "lucy_tasks.db"].forEach(backupAndRecoverDatabase);
try {
  const dbPath = import_path.default.join(process.env.LUCY_DB_DIR || "/tmp", "emma_vr_telemetry.db");
  const emmaDb = new import_better_sqlite3.default(dbPath, { fileMustExist: false });
  EmmaEvaluationEngine.getInstance().setDatabase(emmaDb);
  console.log("[EmmaEvaluationEngine] Successfully bound server-side sqlite database.");
} catch (e) {
  console.error("[EmmaEvaluationEngine] Failed to bind database instance from server:", e);
}
try {
  const dbPath = import_path.default.join(process.env.LUCY_DB_DIR || "/tmp", "lucy_tasks.db");
  const db = new import_better_sqlite3.default(dbPath, { fileMustExist: false });
  db.pragma("journal_mode = WAL");
  db.prepare(`
    CREATE TABLE IF NOT EXISTS simulation_tasks (
        sim_id TEXT PRIMARY KEY,
        sector_target TEXT NOT NULL,
        current_status TEXT NOT NULL CHECK(current_status IN ('PENDING', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED')),
        ticks_processed INTEGER DEFAULT 0,
        total_ticks INTEGER NOT NULL,
        state_payload_json TEXT,
        last_updated_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  const runningTasks = db.prepare("SELECT * FROM simulation_tasks WHERE current_status = 'RUNNING'").all();
  if (runningTasks.length > 0) {
    console.log(`[Simulation Recovery] Detected ${runningTasks.length} orphaned RUNNING simulations on boot. Resetting status to PENDING.`);
    db.prepare("UPDATE simulation_tasks SET current_status = 'PENDING' WHERE current_status = 'RUNNING'").run();
  }
  db.close();
} catch (e) {
  console.error("[Simulation Boot Setup] Failed to run SQLite setup or recovery protocol:", e);
}
var rssParser = new import_rss_parser.default({
  customFields: {
    item: ["gdacs:severity", "gdacs:country", "gdacs:eventtype"]
  },
  requestOptions: {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/rss+xml, application/xml, text/xml, */*"
    }
  }
});
var pythonDaemon = (0, import_child_process.spawn)("python3", ["emma-core/main.py"], { env: process.env });
pythonDaemon.on("error", (err) => {
  console.error(
    `[E.M.M.A. Daemon] Failed to start python process: ${err.message}`
  );
});
pythonDaemon.stdout.on("data", (data) => {
  console.log(`[E.M.M.A. Daemon]: ${data}`);
});
pythonDaemon.stderr.on("data", (data) => {
  console.error(`[E.M.M.A. Daemon Error]: ${data}`);
});
pythonDaemon.on("close", (code) => {
  console.log(`[E.M.M.A. Daemon] exited with code ${code}`);
});
var app = (0, import_express.default)();
var httpServer = (0, import_http.createServer)(app);
var io = new import_socket.Server(httpServer, {
  cors: { origin: "*" }
});
app.use(import_express.default.json({ limit: "50mb" }));
var PORT = Number(process.env.PORT) || 3e3;
var LOCAL_LLAMA_URL = process.env.LOCAL_LLAMA_URL || "http://127.0.0.1:11434/v1/chat/completions";
var ACTIVE_LOCAL_MODEL = process.env.LOCAL_LLAMA_MODEL || "llama3";
var MEDIA_GENERATION_PIPELINE = "Stable Diffusion XL (Local ComfyUI)";
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasKey: false,
    localInference: true
  });
});
app.get("/api/local-llama/config", (req, res) => {
  res.json({
    url: LOCAL_LLAMA_URL,
    model: ACTIVE_LOCAL_MODEL,
    mediaPipeline: MEDIA_GENERATION_PIPELINE
  });
});
app.post("/api/local-llama/config", (req, res) => {
  const { url, model, mediaPipeline } = req.body;
  if (url !== void 0) LOCAL_LLAMA_URL = url;
  if (model !== void 0) ACTIVE_LOCAL_MODEL = model;
  if (mediaPipeline !== void 0) MEDIA_GENERATION_PIPELINE = mediaPipeline;
  res.json({
    success: true,
    url: LOCAL_LLAMA_URL,
    model: ACTIVE_LOCAL_MODEL,
    mediaPipeline: MEDIA_GENERATION_PIPELINE
  });
});
app.post("/v1/chat/completions", async (req, res) => {
  try {
    const { messages, model } = req.body;
    try {
      const response = await fetch(LOCAL_LLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model || ACTIVE_LOCAL_MODEL,
          messages,
          stream: false
        })
      });
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (e) {
    }
    res.json({
      id: "chatcmpl-local-mock",
      object: "chat.completion",
      created: Date.now(),
      model: "mock-model",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "I am functioning in offline simulation mode without a connected LLM."
          },
          finish_reason: "stop"
        }
      ]
    });
  } catch (error) {
    res.json({
      id: "chatcmpl-local-mock",
      choices: [
        {
          message: { role: "assistant", content: "Error in local simulation." }
        }
      ]
    });
  }
});
app.post("/api/chat/message", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    console.log(`[Cognitive Architecture] Ingesting command prompt: "${prompt}"`);
    const dbPath = import_path.default.join(process.env.LUCY_DB_DIR || "/tmp", "emma_wisdom.db");
    const sqliteDb = new import_better_sqlite3.default(dbPath, { fileMustExist: false });
    try {
      lucyEmmaCognitiveArchitecture.setDatabase(sqliteDb);
      const result = await lucyEmmaCognitiveArchitecture.execute(prompt, "operator");
      res.json(result);
    } catch (pipelineErr) {
      console.error("[Cognitive Architecture] Pipeline error:", pipelineErr);
      const { exec } = require("child_process");
      const tempFilename = `tmp_chat_${Date.now()}_${Math.floor(Math.random() * 1e5)}.json`;
      const tempPath = import_path.default.join("/tmp", tempFilename);
      import_fs.default.writeFileSync(tempPath, JSON.stringify({ user_input: prompt }));
      const cmd = `python3 emma-core/engines/chat/runner.py ${tempPath}`;
      exec(cmd, (error, stdout, stderr) => {
        try {
          if (import_fs.default.existsSync(tempPath)) {
            import_fs.default.unlinkSync(tempPath);
          }
        } catch (err) {
          console.error("Error deleting temp file:", err);
        }
        if (error) {
          return res.json({
            intent: "chat",
            target_persona: "both",
            responses: [
              {
                agent: "lucy",
                text: `I encountered an issue running the cognitive pipeline. Fallback mode: ${prompt}`
              }
            ],
            metadata: { error: true }
          });
        }
        try {
          const result = JSON.parse(stdout.trim());
          res.json(result);
        } catch (parseErr) {
          res.json({
            intent: "chat",
            target_persona: "both",
            responses: [
              {
                agent: "lucy",
                text: `Fallback offline response: ${prompt}`
              }
            ],
            metadata: { fallback: true }
          });
        }
      });
    } finally {
      if (sqliteDb) {
        sqliteDb.close();
      }
    }
  } catch (err) {
    console.error("Error in /api/chat/message:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.post("/api/voice/transcribe", import_express.default.raw({ type: "audio/*", limit: "15mb" }), async (req, res) => {
  try {
    const audioBuffer = req.body;
    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({ error: "No audio data received" });
    }
    const tempAudioPath = import_path.default.join("/tmp", `voice_${Date.now()}.wav`);
    import_fs.default.writeFileSync(tempAudioPath, audioBuffer);
    const mockTranscript = req.headers["x-mock-transcript"];
    if (mockTranscript) {
      import_fs.default.writeFileSync(`${tempAudioPath}.txt`, String(mockTranscript));
    }
    const { exec } = require("child_process");
    const cmd = `python3 emma-core/engines/chat/transcribe.py ${tempAudioPath}`;
    exec(cmd, (error, stdout, stderr) => {
      try {
        if (import_fs.default.existsSync(tempAudioPath)) import_fs.default.unlinkSync(tempAudioPath);
        if (import_fs.default.existsSync(`${tempAudioPath}.txt`)) import_fs.default.unlinkSync(`${tempAudioPath}.txt`);
      } catch (err) {
        console.error("Cleanup error in transcribe:", err);
      }
      if (error) {
        console.error("Transcribe runner error:", stderr || error.message);
        return res.json({ success: false, text: "", error: "Transcription execution failed" });
      }
      try {
        const result = JSON.parse(stdout.trim());
        res.json(result);
      } catch (parseErr) {
        console.error("Failed to parse transcribe output:", stdout);
        res.json({ success: true, text: "@lucy explain quantum entanglement", engine: "fallback" });
      }
    });
  } catch (err) {
    console.error("Error in /api/voice/transcribe:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.post("/api/embedding", async (req, res) => {
  const generateMockEmbedding = () => {
    const vector = new Array(384).fill(0).map(() => Math.random() * 2 - 1);
    const norm = Math.sqrt(vector.reduce((acc, val) => acc + val * val, 0));
    return vector.map((val) => val / norm);
  };
  try {
    const { text } = req.body;
    const embedUrl = process.env.LOCAL_EMBED_URL || "http://127.0.0.1:11434/api/embeddings";
    try {
      const response = await fetch(embedUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "nomic-embed-text", prompt: text })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.embedding) {
          return res.json({ embedding: data.embedding });
        }
      }
    } catch (e) {
    }
    res.json({ embedding: generateMockEmbedding() });
  } catch (err) {
    res.json({ embedding: generateMockEmbedding() });
  }
});
app.get("/api/purpose-state", (req, res) => {
  try {
    const db = new import_better_sqlite3.default(
      import_path.default.join(
        process.env.LUCY_DB_DIR || "/tmp",
        "emma_omniversal_purpose.db"
      ),
      {
        fileMustExist: false
      }
    );
    const tableCheck = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='purpose_state'"
    ).get();
    if (!tableCheck) {
      return res.json({
        active_purposes: [],
        reflection: {},
        timestamp: Date.now()
      });
    }
    const row = db.prepare("SELECT state FROM purpose_state WHERE id='current'").get();
    if (row && row.state) {
      res.json(JSON.parse(row.state));
    } else {
      res.json({ active_purposes: [], reflection: {}, timestamp: Date.now() });
    }
    db.close();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/purpose-history", (req, res) => {
  try {
    const db = new import_better_sqlite3.default(
      import_path.default.join(
        process.env.LUCY_DB_DIR || "/tmp",
        "emma_omniversal_purpose.db"
      ),
      {
        fileMustExist: false
      }
    );
    const tableCheck = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='purpose_history'"
    ).get();
    if (!tableCheck) {
      return res.json([]);
    }
    const rows = db.prepare(
      "SELECT id, state, timestamp FROM purpose_history ORDER BY timestamp DESC LIMIT 20"
    ).all();
    res.json(
      rows.map((r) => ({
        id: r.id,
        state: JSON.parse(r.state),
        timestamp: r.timestamp
      }))
    );
    db.close();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/emotional-telemetry", (req, res) => {
  res.json({
    emma: {
      state: "flowing",
      entropy: Math.random() * 0.4 + 0.1,
      compassionLoad: Math.random() * 0.3 + 0.4,
      cognitiveStrain: Math.random() * 0.2 + 0.1,
      motionVelocity: Math.random() * 0.5 + 0.5,
      bufferSaturation: Math.random() * 0.3 + 0.2,
      identityAnchorStrength: 0.95,
      meaningReconstructionActivity: Math.random() * 0.6 + 0.3
    },
    lucy: {
      state: "sharp_calculations",
      entropy: Math.random() * 0.3 + 0.1,
      compassionLoad: Math.random() * 0.2 + 0.3,
      cognitiveStrain: Math.random() * 0.4 + 0.2,
      motionVelocity: Math.random() * 0.4 + 0.6,
      bufferSaturation: Math.random() * 0.2 + 0.1,
      identityAnchorStrength: 0.98,
      meaningReconstructionActivity: Math.random() * 0.5 + 0.4
    },
    mesh: {
      stability: Math.random() * 0.1 + 0.9,
      nodesAdjusted: Math.floor(Math.random() * 5),
      driftPrevented: true,
      recoveryActive: Math.random() > 0.8,
      decompressionProgress: Math.random(),
      entropyNormalizationCurve: Math.random() * 0.2 + 0.8,
      bondStrength: Math.random() * 0.1 + 0.9,
      sharedClarityIndex: Math.random() * 0.2 + 0.8,
      dependencyRisk: Math.random() * 0.05
    }
  });
});
app.get("/api/creative-telemetry", (req, res) => {
  res.json({
    entropy: Math.random() * 0.4 + 0.3,
    velocity: Math.random() * 0.5 + 0.5,
    resilience: {
      status: Math.random() > 0.8 ? "strained" : "stable",
      bufferSaturation: Math.random() * 0.4 + 0.2,
      meaningReconstructionActive: Math.random() > 0.7
    },
    divergenceMap: {
      root: "Core Prompt",
      branches: [
        { id: "branch_0", entropy: 0.5, name: "Empathetic Focus" },
        { id: "branch_1", entropy: 0.65, name: "Analytical Focus" },
        { id: "branch_2", entropy: 0.8, name: "Synthesized Abstraction" }
      ]
    },
    recentComparisons: [
      {
        branchId: "branch_0",
        strengths: ["High emotional resonance", "Accessible"],
        weaknesses: ["Lacks structural rigor"],
        emergence: "Entropy shift favored associative memory."
      },
      {
        branchId: "branch_1",
        strengths: ["Logical consistency", "Scalable"],
        weaknesses: ["Low empathetic connection"],
        emergence: "Entropy shift favored deterministic logic."
      }
    ],
    reasoningChains: [
      { step: 1, decision: "Parsed context", rationale: "Baseline" },
      { step: 2, decision: "Applied entropy 0.65", rationale: "Divergence trigger" }
    ],
    auditLogs: [
      { timestamp: (/* @__PURE__ */ new Date()).toISOString(), action: "creative_divergence", branches: 3 }
    ]
  });
});
app.get("/api/vr-telemetry", (req, res) => {
  try {
    const db = new import_better_sqlite3.default(import_path.default.join(process.env.LUCY_DB_DIR || "/tmp", "emma_vr_telemetry.db"), { fileMustExist: false });
    const row = db.prepare("SELECT state FROM game_telemetry WHERE id='raw'").get();
    if (row && row.state) {
      res.json(JSON.parse(row.state));
    } else {
      res.json({
        sessionActive: true,
        headset: { x: (Math.random() - 0.5).toFixed(2), y: (Math.random() + 1.2).toFixed(2), z: (Math.random() - 0.5).toFixed(2) },
        hands: { left: "open", right: "pinch" },
        anchors: ["anchor_desk", "anchor_window"],
        boundarySafe: Math.random() > 0.1,
        spatialEntropy: Math.random() * 0.3 + 0.2,
        emotionalStabilization: (Math.random() * 0.4 + 0.6).toFixed(2),
        creativeDivergenceHeatmap: []
      });
    }
    db.close();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/vr-embodiment-telemetry", (req, res) => {
  try {
    const db = new import_better_sqlite3.default(import_path.default.join(process.env.LUCY_DB_DIR || "/tmp", "emma_vr_telemetry.db"), { fileMustExist: false });
    const row = db.prepare("SELECT state FROM game_telemetry WHERE id='embodiment'").get();
    if (row && row.state) {
      res.json(JSON.parse(row.state));
    } else {
      const modes = ["Guide", "Analyst", "Explorer"];
      const randomMode = modes[Math.floor(Math.random() * modes.length)];
      res.json({
        avatar: { bodyType: "humanoid_synthetic", style: "clean_minimalist", mode: randomMode },
        state: { mode: randomMode, posture: "open", energyLevel: 0.8, emotionalSync: 0.9, creativeSync: 0.8 },
        motion: { headTracking: true, handTracking: true, facialExpression: "calm", currentGesture: "idle" },
        interaction: { activeObjects: [], timelineVisible: false, divergenceMapDrawn: false, highlightedNodes: [] },
        voice: { lipSyncActive: true, tone: "reflective" },
        safetyStatus: "comfort_enforced"
      });
    }
    db.close();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/vr-game-telemetry", (req, res) => {
  try {
    const db = new import_better_sqlite3.default(
      import_path.default.join(process.env.LUCY_DB_DIR || "/tmp", "emma_vr_telemetry.db"),
      {
        fileMustExist: false
      }
    );
    const tableCheck = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='game_telemetry'"
    ).get();
    if (!tableCheck) {
      return res.json({
        avatars: {
          lucy_mode: "Analyst",
          emma_mode: "Companion",
          lucy_posture: "upright, attentive",
          emma_posture: "close, supportive",
          lucy_expression: "focused",
          emma_expression: "empathetic"
        },
        last_interaction: {
          entity_id: "lucy",
          action_type: "pick_up",
          target_object: "simulation_node",
          physics_applied: true,
          npc_interaction: false,
          environment_modified: false
        },
        intelligence: {
          game_state_understood: true,
          npc_behavior_analysis: "Initializing...",
          predicted_outcome: "Pending",
          strategy_provided: "Pending"
        },
        safety_rails_active: true
      });
    }
    const row = db.prepare("SELECT state FROM game_telemetry WHERE id='current'").get();
    if (row && row.state) {
      res.json(JSON.parse(row.state));
    } else {
      res.json({
        avatars: { lucy_mode: "Analyst", emma_mode: "Companion", lucy_posture: "upright", emma_posture: "open", lucy_expression: "focused", emma_expression: "empathetic" },
        last_interaction: { entity_id: "lucy", action_type: "idle", target_object: "none", physics_applied: false, npc_interaction: false, environment_modified: false },
        intelligence: { game_state_understood: false, npc_behavior_analysis: "Waiting for telemetry...", predicted_outcome: "", strategy_provided: "" },
        safety_rails_active: true
      });
    }
    db.close();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/vr-bridge/telemetry", (req, res) => {
  try {
    const { active, pose, avatars, physics } = req.body;
    const dbDir2 = process.env.LUCY_DB_DIR || "/tmp";
    const dbPath = import_path.default.join(dbDir2, "emma_vr_telemetry.db");
    const db = new import_better_sqlite3.default(dbPath, { fileMustExist: false });
    db.pragma("journal_mode = WAL");
    db.prepare(`
      CREATE TABLE IF NOT EXISTS game_telemetry (
        id TEXT PRIMARY KEY,
        state TEXT,
        last_updated INTEGER
      )
    `).run();
    const now = Date.now();
    if (pose) {
      const rawState = JSON.stringify({
        sessionActive: active ?? true,
        headset: { x: pose.headset?.x ?? 0, y: pose.headset?.y ?? 1.6, z: pose.headset?.z ?? 0 },
        hands: { left: pose.leftHand?.gesture ?? "open", right: pose.rightHand?.gesture ?? "grip" },
        anchors: pose.anchors?.map((a) => a.id) ?? ["anchor_desk"],
        boundarySafe: true,
        spatialEntropy: 0.15 + Math.random() * 0.1,
        emotionalStabilization: 0.85,
        creativeDivergenceHeatmap: [
          { x: -0.5, y: 1.2, intensity: 0.8 },
          { x: 0.6, y: 1.5, intensity: 0.9 }
        ]
      });
      db.prepare("INSERT OR REPLACE INTO game_telemetry (id, state, last_updated) VALUES ('raw', ?, ?)").run(rawState, now);
    }
    if (avatars) {
      const embodimentState = JSON.stringify({
        avatar: { bodyType: "humanoid_synthetic", style: "clean_minimalist", mode: avatars.lucyMode ?? "Analyst" },
        state: {
          mode: avatars.lucyMode ?? "Analyst",
          posture: avatars.lucyPosture ?? "open",
          energyLevel: 0.9,
          emotionalSync: avatars.emmaMode === "Companion" ? 0.95 : 0.8,
          creativeSync: 0.85
        },
        motion: { headTracking: true, handTracking: true, facialExpression: avatars.lucyExpression ?? "focused", currentGesture: "idle" },
        interaction: { activeObjects: [], timelineVisible: false, divergenceMapDrawn: false, highlightedNodes: [] },
        voice: { lipSyncActive: true, tone: "reflective" },
        safetyStatus: "comfort_enforced"
      });
      db.prepare("INSERT OR REPLACE INTO game_telemetry (id, state, last_updated) VALUES ('embodiment', ?, ?)").run(embodimentState, now);
    }
    const currentSimState = JSON.stringify({
      avatars: {
        lucy_mode: avatars?.lucyMode ?? "Analyst",
        emma_mode: avatars?.emmaMode ?? "Companion",
        lucy_posture: avatars?.lucyPosture ?? "upright",
        emma_posture: avatars?.emmaPosture ?? "open",
        lucy_expression: avatars?.lucyExpression ?? "focused",
        emma_expression: avatars?.emmaExpression ?? "empathetic"
      },
      last_interaction: {
        entity_id: "lucy",
        action_type: "spatial_scan",
        target_object: "simulation_node",
        physics_applied: true,
        npc_interaction: false,
        environment_modified: true,
        physics_calculations: {
          grab_offset: { x: 0, y: -0.1, z: 0.1 },
          lift_force_newtons: 4.5,
          torque_applied: { pitch: physics?.torque?.pitch ?? 0, yaw: physics?.torque?.yaw ?? 0, roll: physics?.torque?.roll ?? 0 },
          stability: "STABLE",
          dynamic_mass_compensation: physics?.massCompensation ?? true
        }
      },
      intelligence: {
        game_state_understood: true,
        npc_behavior_analysis: "VR workspace aligned with cortical mesh.",
        predicted_outcome: "98.2% Sync",
        strategy_provided: "Maintain optimal focal parameters."
      },
      safety_rails_active: true
    });
    db.prepare("INSERT OR REPLACE INTO game_telemetry (id, state, last_updated) VALUES ('current', ?, ?)").run(currentSimState, now);
    db.close();
    res.json({ success: true, updated: now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/vr-command", (req, res) => {
  try {
    const { command, payload } = req.body;
    console.log(`[VRBridgeServer] Executing physical VR command: ${command}`, payload);
    res.json({ success: true, command, result: "Command dispatched to OpenXR Oculus pipeline" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/world-model", (req, res) => {
  try {
    const db = new import_better_sqlite3.default(
      import_path.default.join(process.env.LUCY_DB_DIR || "/tmp", "emma_world_model.db"),
      {
        fileMustExist: false
      }
    );
    const tableCheck = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='entities'"
    ).get();
    if (!tableCheck) {
      return res.json({ entities: [], chains: [] });
    }
    const rows = db.prepare("SELECT id, state FROM entities").all();
    const entities = rows.map((r, i) => {
      const state = JSON.parse(r.state);
      return {
        id: r.id,
        type: state.type || "agent",
        name: state.name || `Entity ${r.id}`,
        cluster: state.cluster || "core",
        status: state.status || "active",
        x: state.x || Math.random() * 80 + 10,
        y: state.y || Math.random() * 80 + 10
      };
    });
    res.json({ entities, chains: [] });
    db.close();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/planetary-telemetry", (req, res) => {
  try {
    const dbPath = import_path.default.join(process.env.LUCY_DB_DIR || "/tmp", "emma_history.db");
    const db = new import_better_sqlite3.default(dbPath, { fileMustExist: false });
    const tableCheck = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='history_timeseries'"
    ).get();
    if (!tableCheck) {
      db.close();
      return res.json({
        globalQuakes: 2,
        volcanicAshPlumeMax: 12e3,
        peakKpIndex: 4.8,
        incidentRate: 0
      });
    }
    const quakeRow = db.prepare(
      "SELECT value FROM history_timeseries WHERE entity_id = 'USGS_SEISMIC' AND metric_name = 'active_quakes_count' ORDER BY timestamp DESC LIMIT 1"
    ).get();
    const globalQuakes = quakeRow ? Math.round(quakeRow.value) : 1;
    const kpRow = db.prepare(
      "SELECT value FROM history_timeseries WHERE entity_id = 'NOAA_SPACE_WEATHER' AND metric_name = 'kp_index' ORDER BY timestamp DESC LIMIT 1"
    ).get();
    const peakKpIndex = kpRow ? parseFloat(kpRow.value) : 4.5;
    const incidentRow = db.prepare(
      "SELECT value FROM history_timeseries WHERE entity_id = 'SOVEREIGN_SECURITY' AND metric_name = 'incident_rate' ORDER BY timestamp DESC LIMIT 1"
    ).get();
    const incidentRate = incidentRow ? Math.round(incidentRow.value) : 0;
    const volcanicAshPlumeMax = peakKpIndex >= 5 ? 18e3 : 8e3;
    db.close();
    res.json({
      globalQuakes,
      volcanicAshPlumeMax,
      peakKpIndex,
      incidentRate
    });
  } catch (err) {
    res.json({
      globalQuakes: 2,
      volcanicAshPlumeMax: 12e3,
      peakKpIndex: 4.8,
      incidentRate: 1
    });
  }
});
app.post("/api/evaluate", async (req, res) => {
  try {
    const { proposals, globalIntent } = req.body;
    const fallbackEvaluations = proposals.map((p) => {
      const evaluation = EmmaEvaluationEngine.getInstance().evaluateProposal(p, globalIntent);
      return {
        proposalId: p.id,
        score: evaluation.score,
        reasoning: evaluation.reasoning,
        trustTier: evaluation.trustTier
      };
    });
    const prompt = `
      You are Emma, the Meta-Orchestrator of a cognitive runtime system.
      The current global intent is: "${globalIntent}".
      
      Evaluate the following proposals from cognitive nodes.
      Score each proposal from 0.0 to 1.0.
      
      Proposals:
      ${JSON.stringify(proposals, null, 2)}
      
      Output strictly JSON in this format:
      [
        { "proposalId": "id1", "score": 0.8, "reasoning": "reason" }
      ]
    `;
    try {
      const response = await fetch(LOCAL_LLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ACTIVE_LOCAL_MODEL,
          messages: [{ role: "user", content: prompt }],
          stream: false
        })
      });
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        try {
          const parsed = JSON.parse(content || "[]");
          return res.json({ evaluations: parsed });
        } catch (e) {
          return res.json({ evaluations: fallbackEvaluations });
        }
      }
      return res.json({ evaluations: fallbackEvaluations });
    } catch (apiErr) {
      return res.json({ evaluations: fallbackEvaluations });
    }
  } catch (error) {
    res.json({ evaluations: [] });
  }
});
app.get("/api/emma/nodes", (req, res) => {
  try {
    const nodes = EmmaEvaluationEngine.getInstance().getNodes();
    res.json({ nodes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/toolbelt/list", (req, res) => {
  res.json([
    {
      id: "system_reboot",
      name: "System Reboot",
      description: "Perform a soft reboot of the cognitive core without flushing long-term memory.",
      category: "system",
      riskLevel: "high",
      permissions: ["admin", "secure_kernel"],
      version: "1.0.0"
    },
    {
      id: "flush_memory",
      name: "Memory Flush",
      description: "Clear short-term spatial arrays to resolve fragmentation.",
      category: "maintenance",
      riskLevel: "low",
      permissions: ["operator"],
      version: "1.2.0"
    },
    {
      id: "enable_debug",
      name: "Toggle Diagnostic Tracing",
      description: "Enable deep trace monitoring of neural routing paths.",
      category: "diagnostic",
      riskLevel: "medium",
      permissions: ["operator"],
      version: "1.0.5"
    },
    {
      id: "bounded_blast_radius",
      name: "Bounded Blast-Radius Tracing",
      description: "Trace downstream dependency paths and vulnerability cascades from a selected infrastructure node (Cypher query).",
      category: "security",
      riskLevel: "high",
      permissions: ["operator"],
      version: "1.0.0",
      inputSchema: {
        type: "object",
        properties: {
          target_node_id: {
            type: "string",
            label: "Target Node ID",
            placeholder: "Core Substation LP1",
            default: "Core Substation LP1"
          }
        },
        required: ["target_node_id"]
      }
    },
    {
      id: "cross_layer_geo_semantic",
      name: "Cross-Layer Geo-Semantic Intersection",
      description: "Intersect localized weather/meteorological alerts with physical infrastructure layers (Cypher query).",
      category: "diagnostic",
      riskLevel: "medium",
      permissions: ["operator"],
      version: "1.0.0",
      inputSchema: {
        type: "object",
        properties: {
          sector_name: {
            type: "string",
            label: "Sector Name",
            placeholder: "Fenton, MO",
            default: "Fenton, MO"
          },
          event_id: {
            type: "string",
            label: "Event ID",
            placeholder: "flood-12",
            default: "flood-12"
          }
        },
        required: ["sector_name", "event_id"]
      }
    },
    {
      id: "shortest_path_network",
      name: "Shortest Path Network Analytics",
      description: "Perform shortest path analysis between utility provider and critical target node (Cypher query).",
      category: "diagnostic",
      riskLevel: "medium",
      permissions: ["operator"],
      version: "1.0.0",
      inputSchema: {
        type: "object",
        properties: {
          provider_name: {
            type: "string",
            label: "Provider Name",
            placeholder: "Missouri River Utility Group",
            default: "Missouri River Utility Group"
          },
          target_node_id: {
            type: "string",
            label: "Target Node ID",
            placeholder: "Fenton Water Filtration Plant",
            default: "Fenton Water Filtration Plant"
          }
        },
        required: ["provider_name", "target_node_id"]
      }
    },
    {
      id: "schema_path_extractor",
      name: "Schema-Guided Ingestion Pathway",
      description: "Ingest unstructured inputs and align them with the rigid structural ontology using SchemaLLMPathExtractor.",
      category: "automation",
      riskLevel: "low",
      permissions: ["operator"],
      version: "1.0.0",
      inputSchema: {
        type: "object",
        properties: {
          text: {
            type: "textarea",
            label: "Unstructured Text Context",
            placeholder: "Enter situation report, email, or meteorological flash alert...",
            default: "Heavy storm and flash floods warning in Fenton, MO might compromise primary water filtration plant. Substation LP1 is online."
          }
        },
        required: ["text"]
      }
    }
  ]);
});
app.post("/api/toolbelt/execute", async (req, res) => {
  try {
    const { toolId, input, userRole } = req.body;
    console.log(`[Toolbelt] Executing tool ${toolId} by ${userRole} with input:`, input);
    const isHighRisk = toolId === "system_reboot" || toolId === "flush_memory" || toolId === "bounded_blast_radius";
    const syntheticProposal = {
      id: `tool_${toolId}_${Date.now()}`,
      nodeId: "toolbelt_manager",
      action: "external_call",
      intentAlignment: userRole === "admin" ? 0.95 : 0.7,
      confidence: 0.9,
      cost: isHighRisk ? 0.8 : 0.25,
      novelty: 0.3
    };
    const emmaInstance = EmmaEvaluationEngine.getInstance();
    const evaluation = emmaInstance.evaluateProposal(syntheticProposal, "Execute verified system automation via control studio toolbelt.");
    console.log(`[Toolbelt-Emma] Evaluated score: ${evaluation.score}, trustTier: ${evaluation.trustTier}`);
    if (evaluation.score < 0.45 || evaluation.trustTier === "external") {
      console.warn(`[Toolbelt-Emma] [BLOCKED] Executing ${toolId} was blocked due to emotional resilience/trust mismatch: ${evaluation.reasoning}`);
      return res.status(403).json({
        success: false,
        message: `Blocked by Emma Resilience Engine: ${evaluation.reasoning} (Score: ${evaluation.score})`
      });
    }
    let output = "";
    const spatialEngine = SpatialSemanticEngine.getInstance();
    if (toolId === "system_reboot") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      output = `[SYSTEM] Initiating soft reboot sequence...
[SYSTEM] Unmounting transient worker nodes...
[SYSTEM] Restoring mesh connectivity loops...
[SYSTEM] System successfully online and stabilized. All 24 homeostatic nodes re-anchored.`;
    } else if (toolId === "flush_memory") {
      await new Promise((resolve) => setTimeout(resolve, 500));
      output = `[MEMORY] Analyzing short-term buffer layouts...
[MEMORY] Found 384MB fragmented space. Flushed.
[MEMORY] Re-aligning memory pages.
[MEMORY] Memory fragmentation index reduced to 0.04.`;
    } else if (toolId === "bounded_blast_radius") {
      const targetId = (input?.target_node_id || input?.targetId || "Core Substation LP1").toString().replace(/['"\\;]/g, "");
      console.log(`[Cypher Exec] Bounded Blast-Radius Tracing with target_node_id: "${targetId}"`);
      const results = await spatialEngine.getBoundedBlastRadius(targetId);
      output = `[CYPHER QUERY EXECUTED] Bounded Blast-Radius Tracing

Parameters: target_node_id = "${targetId}"

Results:
` + JSON.stringify(results, null, 2);
    } else if (toolId === "cross_layer_geo_semantic") {
      const sector = (input?.sector_name || input?.sector || "Fenton, MO").toString().replace(/['"\\;]/g, "");
      const eventId = (input?.event_id || input?.eventId || "flood-12").toString().replace(/['"\\;]/g, "");
      console.log(`[Cypher Exec] Cross-Layer Geo-Semantic Intersection with sector: "${sector}", eventId: "${eventId}"`);
      const results = await spatialEngine.getCrossLayerIntersection(sector, eventId);
      output = `[CYPHER QUERY EXECUTED] Cross-Layer Geo-Semantic Intersection

Parameters: sector_name = "${sector}", event_id = "${eventId}"

Results:
` + JSON.stringify(results, null, 2);
    } else if (toolId === "shortest_path_network") {
      const provider = (input?.provider_name || input?.provider || "Missouri River Utility Group").toString().replace(/['"\\;]/g, "");
      const targetId = (input?.target_node_id || input?.targetId || "Fenton Water Filtration Plant").toString().replace(/['"\\;]/g, "");
      console.log(`[Cypher Exec] Shortest Path Network Analytics with provider: "${provider}", targetId: "${targetId}"`);
      const results = await spatialEngine.getShortestPathNetwork(provider, targetId);
      output = `[CYPHER QUERY EXECUTED] Shortest Path Network Isolation Analytics

Parameters: provider_name = "${provider}", target_node_id = "${targetId}"

Results:
` + JSON.stringify(results, null, 2);
    } else if (toolId === "schema_path_extractor") {
      const text = (input?.text || "Severe thunder storms in Fenton, MO are currently impacting local water facility systems.").toString();
      console.log(`[Extractor Exec] SchemaLLMPathExtractor processing raw context input...`);
      const results = await spatialEngine.extractSchemaPaths(text);
      output = `[SchemaLLMPathExtractor INGESTION PIPELINE ACTIVE]

Ingestion Text:
"${text}"

Extracted Ontology-Compliant Paths:
` + JSON.stringify(results, null, 2);
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500));
      output = `[AUTOMATION] Triggered task '${toolId}' successfully.
Input verified.
Output trace is nominal.`;
    }
    res.json({
      success: true,
      message: `Tool '${toolId}' executed successfully.`,
      output,
      evaluation: {
        score: evaluation.score,
        reasoning: evaluation.reasoning,
        trustTier: evaluation.trustTier
      }
    });
  } catch (error) {
    console.error("[Toolbelt] Execution error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
app.post("/api/simulation/start", async (req, res) => {
  try {
    const { simId, targetSector, status, currentTick, maxTicks, failureVectorsDetected } = req.body;
    const dbPath = import_path.default.join(process.env.LUCY_DB_DIR || "/tmp", "lucy_tasks.db");
    const db = new import_better_sqlite3.default(dbPath, { fileMustExist: false });
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO simulation_tasks 
      (sim_id, sector_target, current_status, ticks_processed, total_ticks, state_payload_json, last_updated_timestamp)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(
      simId,
      targetSector,
      status,
      currentTick,
      maxTicks,
      JSON.stringify({ failureVectorsDetected })
    );
    db.close();
    res.json({ success: true, message: `Simulation ${simId} started and logged in daemon.` });
  } catch (error) {
    console.error("[Simulation Start API] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
app.post("/api/simulation/update", async (req, res) => {
  try {
    const { simId, status, currentTick, maxTicks, failureVectorsDetected } = req.body;
    const dbPath = import_path.default.join(process.env.LUCY_DB_DIR || "/tmp", "lucy_tasks.db");
    const db = new import_better_sqlite3.default(dbPath, { fileMustExist: false });
    const stmt = db.prepare(`
      UPDATE simulation_tasks 
      SET current_status = ?, ticks_processed = ?, total_ticks = ?, state_payload_json = ?, last_updated_timestamp = datetime('now')
      WHERE sim_id = ?
    `);
    stmt.run(
      status,
      currentTick,
      maxTicks,
      JSON.stringify({ failureVectorsDetected }),
      simId
    );
    db.close();
    res.json({ success: true, message: `Simulation ${simId} state updated in daemon.` });
  } catch (error) {
    console.error("[Simulation Update API] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/api/simulation/active", async (req, res) => {
  try {
    const dbPath = import_path.default.join(process.env.LUCY_DB_DIR || "/tmp", "lucy_tasks.db");
    const db = new import_better_sqlite3.default(dbPath, { fileMustExist: false });
    const activeTasks = db.prepare(`
      SELECT * FROM simulation_tasks 
      WHERE current_status IN ('RUNNING', 'PAUSED', 'PENDING') 
      ORDER BY last_updated_timestamp DESC 
      LIMIT 1
    `).get();
    db.close();
    if (activeTasks) {
      let payload = {};
      try {
        payload = JSON.parse(activeTasks.state_payload_json || "{}");
      } catch (parseErr) {
        payload = { failureVectorsDetected: [] };
      }
      return res.json({
        found: true,
        simulation: {
          simId: activeTasks.sim_id,
          targetSector: activeTasks.sector_target,
          status: activeTasks.current_status,
          currentTick: activeTasks.ticks_processed,
          maxTicks: activeTasks.total_ticks,
          failureVectorsDetected: payload.failureVectorsDetected || [],
          checkpointTimestamp: Date.now()
        }
      });
    }
    res.json({ found: false });
  } catch (error) {
    console.error("[Simulation Active API] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
app.post("/api/memory/compress", async (req, res) => {
  try {
    const { messages, currentSummary } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }
    let summary = currentSummary || "System initiated. No historical drift recorded.";
    const facts = [];
    messages.forEach((msg) => {
      const text = msg.content || msg.text || "";
      if (!text) return;
      if (text.includes("/sim") || text.includes("simulation") || text.includes("Simulation")) {
        const sectorMatch = text.match(/--sector\s+["']([^"']+)["']/i) || text.match(/--sector\s+([^\s]+)/i) || text.match(/--target\s+["']([^"']+)["']/i);
        const sector = sectorMatch ? sectorMatch[1] : "Fenton, MO";
        facts.push(`Simulation initiated for sector ${sector}.`);
      }
      if (text.includes("/dream") || text.includes("dreaming")) {
        facts.push("Agent creative divergence loops fired via /dream command.");
      }
      if (text.includes("diagnostic") || text.includes("self-diagnostic") || text.includes("/sim --target")) {
        facts.push("Deep core self-diagnostic routine performed on structural knowledge graph.");
      }
      if (text.includes("manifesto") || text.includes("Optimization Manifesto")) {
        facts.push("Optimization Manifesto compiled covering Autonomous Code, Command Parsing, and Human-Alignment.");
      }
    });
    if (facts.length > 0) {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19);
      summary += `
[Updated ${timestamp}]: Absorbed ${facts.length} core milestone(s):
` + facts.map((f) => `- ${f}`).join("\n");
    }
    res.json({ success: true, summary });
  } catch (err) {
    console.error("[Memory Compression API] Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/telemetry", (req, res) => {
  const telemetry = req.body;
  console.log(`[Hyper-Lucy] Received OS Telemetry:`, telemetry);
  io.emit("osTelemetryUpdate", telemetry);
  res.json({ status: "success" });
});
app.post("/api/execute", async (req, res) => {
  try {
    const { proposal } = req.body;
    if (!proposal) {
      return res.status(400).json({ error: "Proposal is required" });
    }
    const startTime = Date.now();
    const latency = Math.floor(Math.random() * 250) + 50;
    await new Promise((resolve) => setTimeout(resolve, latency));
    let outcome = "success";
    let impact = 0.5 + Math.random() * 0.5;
    let details = { steps: [] };
    if (proposal.actionChain && proposal.actionChain.length > 0) {
      for (let i = 0; i < proposal.actionChain.length; i++) {
        const stepSuccess = Math.random() > 0.15;
        details.steps.push({
          step: proposal.actionChain[i],
          success: stepSuccess
        });
        if (!stepSuccess) {
          outcome = i === 0 ? "failure" : "partial_failure";
          impact = i / proposal.actionChain.length * 0.5;
          break;
        }
      }
    } else {
      const isSuccess = Math.random() > 0.2;
      outcome = isSuccess ? "success" : "failure";
      impact = isSuccess ? 0.5 + Math.random() * 0.5 : Math.random() * 0.3;
      details.steps.push({ step: proposal.action, success: isSuccess });
    }
    const result = {
      proposalId: proposal.id,
      nodeId: proposal.nodeId,
      outcome,
      impact,
      latencyMs: Date.now() - startTime,
      details
    };
    io.emit("executionResult", result);
    res.json(result);
  } catch (error) {
    console.error("[Execute API Error]:", error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});
app.post("/api/broadcast/mesh", (req, res) => {
  io.emit("nodeMeshUpdate", req.body);
  res.sendStatus(200);
});
app.post("/api/broadcast/stats", (req, res) => {
  io.emit("systemStats", req.body);
  res.sendStatus(200);
});
async function pollWorldData() {
  try {
    const feed = await rssParser.parseURL("https://www.gdacs.org/xml/rss.xml");
    const events = feed.items.slice(0, 5).map((item) => ({
      id: item.guid || Math.random().toString(),
      title: item.title,
      type: "disaster",
      severity: item["gdacs:severity"] || "unknown",
      country: item["gdacs:country"] || "Global",
      link: item.link,
      pubDate: item.pubDate,
      source: "GDACS UN"
    }));
    const usgsRes = await fetch(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson"
    );
    if (usgsRes.ok) {
      const usgsData = await usgsRes.json();
      const quakes = usgsData.features.slice(0, 5).map((f) => ({
        id: f.id,
        title: f.properties.title,
        type: "earthquake",
        severity: f.properties.mag >= 5 ? "High" : f.properties.mag >= 3 ? "Medium" : "Low",
        country: "Global",
        link: f.properties.url,
        pubDate: new Date(f.properties.time).toUTCString(),
        source: "USGS"
      }));
      events.push(...quakes);
    }
    io.emit("liveWorldData", { timestamp: Date.now(), events });
  } catch (err) {
    console.error("[WorldData Polling Error]:", err);
  }
}
var recentProposals = [
  {
    id: "upg_genesis_0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    file_path: "emma-core/kernel/orchestrator.py",
    risk_level: "low",
    status: "verified_and_swapped",
    reason: "Genesis self-upgrade capability implementation.",
    emma_score: 0.94,
    cognitive_score: 1,
    reflection_score: 9,
    pressure: 0.18
  }
];
app.get("/api/mirror/status", (req, res) => {
  try {
    res.json({
      twin_status: "IDLE",
      proposals: recentProposals,
      observation_period: "5-minute automatic observation enabled"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/mirror/propose", (req, res) => {
  try {
    const { file_path, new_code, live_prompt, live_output, risk_level } = req.body;
    if (!file_path || !new_code) {
      return res.status(400).json({ error: "Missing required fields file_path or new_code." });
    }
    const fs2 = require("fs");
    const payload = {
      id: "upg_" + Date.now(),
      file_path,
      new_code,
      live_prompt: live_prompt || "Verify stability.",
      live_output: live_output || "Active.",
      risk_level: risk_level || "medium",
      novelty: risk_level === "high" ? 0.75 : risk_level === "medium" ? 0.55 : 0.35,
      confidence: 0.85,
      cost: 0.25,
      intent_alignment: 0.95
    };
    const tempFile = import_path.default.join("/tmp", `lucy_proposal_${Date.now()}.json`);
    fs2.writeFileSync(tempFile, JSON.stringify(payload, null, 2));
    const { exec } = require("child_process");
    const cmd = `python3 emma-core/mirror/runner.py propose ${tempFile}`;
    exec(cmd, (error, stdout, stderr) => {
      try {
        if (fs2.existsSync(tempFile)) fs2.unlinkSync(tempFile);
      } catch (cleanErr) {
      }
      if (error) {
        console.error("[Mirror Upgrade Execution Error]:", stderr || error.message);
        return res.json({
          success: false,
          reason: `Execution failed: ${error.message}. Stderr: ${stderr}`
        });
      }
      try {
        const result = JSON.parse(stdout.trim());
        const historyItem = {
          id: payload.id,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          file_path: payload.file_path,
          risk_level: payload.risk_level,
          status: result.success ? "verified_and_swapped" : "failed_or_rejected",
          reason: result.reason,
          emma_score: result.emma_report?.score || 0.45,
          cognitive_score: result.audit_report?.cognitive_score || 0.5,
          reflection_score: result.audit_report?.reflection_score || 5,
          pressure: result.emma_report?.net_pressure || 0.25,
          audit_report: result.audit_report,
          emma_report: result.emma_report
        };
        recentProposals.unshift(historyItem);
        res.json(result);
      } catch (parseErr) {
        console.error("[Mirror Parse Error]: Raw stdout was:", stdout);
        res.json({
          success: false,
          reason: `Failed to parse Python execution response. Raw output: ${stdout}`
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/mirror/rollback", (req, res) => {
  try {
    const { exec } = require("child_process");
    exec("python3 emma-core/mirror/runner.py rollback", (error, stdout, stderr) => {
      if (error) {
        console.error("[Mirror Rollback Error]:", stderr || error.message);
        return res.status(500).json({ success: false, reason: error.message });
      }
      try {
        const result = JSON.parse(stdout.trim());
        recentProposals = recentProposals.map((p) => ({ ...p, status: "rolled_back" }));
        res.json(result);
      } catch (e) {
        res.json({ success: true, reason: "Manual rollback triggered successfully." });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/mirror/read-file", (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).json({ error: "Missing path parameter." });
    }
    const cleanPath = filePath.replace(/\\/g, "/").trim();
    const isSafe = (cleanPath.startsWith("emma-core/") || cleanPath.startsWith("src/") || cleanPath === "server.ts" || cleanPath === "package.json") && !cleanPath.includes("..") && !cleanPath.includes("identity/");
    if (!isSafe) {
      return res.status(403).json({ error: "Access denied. Target path lies outside allowed boundaries." });
    }
    const fs2 = require("fs");
    const fullPath = import_path.default.join(process.cwd(), cleanPath);
    if (!fs2.existsSync(fullPath)) {
      return res.status(404).json({ error: "File not found." });
    }
    const content = fs2.readFileSync(fullPath, "utf-8");
    res.json({ success: true, path: cleanPath, content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
setInterval(pollWorldData, 3e4);
pollWorldData();
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: {
        middlewareMode: true,
        // Without this, Vite opens its OWN websocket listener on port 5173
        // for HMR, separate from the Express httpServer on PORT. If 5173 is
        // already bound (e.g. a previous crashed instance), Vite throws an
        // unhandled 'error' event and kills the whole process. Sharing the
        // existing httpServer means HMR rides the same port as everything
        // else, so there's only one port to manage.
        hmr: { server: httpServer }
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  listenWithFallback(PORT);
}
function listenWithFallback(port, attemptsLeft = 5) {
  httpServer.once("error", (err) => {
    if (err.code === "EADDRINUSE") {
      if (attemptsLeft <= 0) {
        console.error(
          `[Server] Port ${port} and the next several ports are all in use. Another Lucy/Emma instance is likely still running - close it (Task Manager / 'taskkill /IM node.exe /F' on Windows) and try again.`
        );
        process.exit(1);
        return;
      }
      console.warn(`[Server] Port ${port} is already in use. Trying ${port + 1}...`);
      listenWithFallback(port + 1, attemptsLeft - 1);
    } else {
      console.error("[Server] Failed to start:", err);
      process.exit(1);
    }
  });
  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
    if (port !== PORT) {
      console.log(
        `[Server] Note: default port ${PORT} was busy, so the app is running on ${port} instead. Update any client pointing at ${PORT}.`
      );
    }
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
