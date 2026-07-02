/**
 * Database Singleton — Production Connection Pool & Graph Schema
 *
 * Replaces per-request new Database() calls with a pooled singleton.
 * Replaces Neo4j with SQLite graph tables (nodes + edges) using
 * recursive CTEs for traversal.
 *
 * @license SPDX-License-Identifier: Apache-2.0
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import os from "os";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DB_DIR = process.env.LUCY_DB_DIR ||
  (process.platform === "win32" ? "C:\\ProgramData\\LucyCore\\Db" : path.join(os.homedir(), ".lucycore", "db"));

function ensureDbDir(): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  } catch (e) {
    console.error(`[DatabasePool] Failed to create database directory ${DB_DIR}:`, e);
  }
}

// ---------------------------------------------------------------------------
// Connection Pool (Singleton per database file)
// ---------------------------------------------------------------------------

const pool: Map<string, Database.Database> = new Map();

/**
 * Get or create a SQLite connection for the given database name.
 * All connections use WAL mode for concurrent read/write safety.
 */
export function getDb(dbName: string): Database.Database {
  const existing = pool.get(dbName);
  if (existing) {
    // Verify the connection is still open
    try {
      existing.pragma("journal_mode");
      return existing;
    } catch {
      // Connection was closed or corrupted, recreate
      pool.delete(dbName);
    }
  }

  ensureDbDir();
  const dbPath = path.join(DB_DIR, dbName);
  const db = new Database(dbPath, { fileMustExist: false });

  // Production hardening
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  db.pragma("foreign_keys = ON");

  pool.set(dbName, db);
  console.log(`[DatabasePool] Connection opened: ${dbName} (WAL mode)`);
  return db;
}

/**
 * Close a specific database connection.
 */
export function closeDb(dbName: string): void {
  const db = pool.get(dbName);
  if (db) {
    try {
      db.close();
    } catch (e) {
      console.warn(`[DatabasePool] Error closing ${dbName}:`, e);
    }
    pool.delete(dbName);
  }
}

/**
 * Close all database connections (for graceful shutdown).
 */
export function closeAll(): void {
  for (const [name, db] of pool.entries()) {
    try {
      db.close();
      console.log(`[DatabasePool] Closed: ${name}`);
    } catch (e) {
      console.warn(`[DatabasePool] Error closing ${name}:`, e);
    }
  }
  pool.clear();
}

// ---------------------------------------------------------------------------
// Backup & Recovery
// ---------------------------------------------------------------------------

/**
 * Perform integrity check and backup for a database.
 * Restores from backup if the primary file is corrupt.
 */
export function backupAndRecover(dbName: string): void {
  const dbPath = path.join(DB_DIR, dbName);
  const backupPath = path.join(DB_DIR, `${dbName}.bak`);

  // Check if main database file is corrupt, recover if needed
  if (fs.existsSync(dbPath)) {
    try {
      const stats = fs.statSync(dbPath);
      if (stats.size === 0 && fs.existsSync(backupPath)) {
        console.warn(`[DatabaseRecovery] ${dbName} is empty, restoring from backup...`);
        fs.copyFileSync(backupPath, dbPath);
      } else if (stats.size > 0) {
        const testDb = new Database(dbPath);
        testDb.pragma("integrity_check");
        testDb.close();
      }
    } catch (e) {
      console.error(`[DatabaseRecovery] ${dbName} integrity check failed:`, e);
      if (fs.existsSync(backupPath)) {
        console.warn(`[DatabaseRecovery] Restoring ${dbName} from backup...`);
        try {
          fs.copyFileSync(backupPath, dbPath);
        } catch (recoverErr) {
          console.error(`[DatabaseRecovery] Restoration failed for ${dbName}:`, recoverErr);
        }
      }
    }
  }

  // Create backup of healthy database
  try {
    const db = getDb(dbName);
    db.prepare("CREATE TABLE IF NOT EXISTS system_init (id INTEGER PRIMARY KEY, timestamp TEXT)").run();
    // Use SQLite backup API via file copy (better-sqlite3 backup is async and complex)
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath);
      console.log(`[DatabaseBackup] ${dbName} backed up successfully`);
    }
  } catch (e) {
    console.warn(`[DatabaseBackup] Failed to backup ${dbName}:`, e);
  }
}

// ---------------------------------------------------------------------------
// SQLite Graph Schema (Replaces Neo4j)
// ---------------------------------------------------------------------------

/**
 * Initialize the graph schema tables in the specified database.
 * This replaces the Neo4j requirement with a SQLite relational graph model.
 *
 * Graph queries use recursive CTEs for traversal:
 *   WITH RECURSIVE path_walk AS (
 *     SELECT ... FROM graph_edges WHERE source_id = ?
 *     UNION ALL
 *     SELECT ... FROM graph_edges JOIN path_walk ON ...
 *   )
 */
export function initGraphSchema(dbName: string = "emma_graph.db"): Database.Database {
  const db = getDb(dbName);

  db.exec(`
    CREATE TABLE IF NOT EXISTS graph_nodes (
      id TEXT PRIMARY KEY,
      node_type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      properties TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_graph_nodes_type ON graph_nodes(node_type);
    CREATE INDEX IF NOT EXISTS idx_graph_nodes_name ON graph_nodes(name);

    CREATE TABLE IF NOT EXISTS graph_edges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      relation_type TEXT NOT NULL,
      properties TEXT DEFAULT '{}',
      weight REAL DEFAULT 1.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (source_id) REFERENCES graph_nodes(id) ON DELETE CASCADE,
      FOREIGN KEY (target_id) REFERENCES graph_nodes(id) ON DELETE CASCADE,
      UNIQUE(source_id, target_id, relation_type)
    );

    CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON graph_edges(source_id);
    CREATE INDEX IF NOT EXISTS idx_graph_edges_target ON graph_edges(target_id);
    CREATE INDEX IF NOT EXISTS idx_graph_edges_relation ON graph_edges(relation_type);
  `);

  return db;
}

// ---------------------------------------------------------------------------
// Graph Query Helpers (Replace Neo4j Cypher queries)
// ---------------------------------------------------------------------------

export interface GraphNode {
  id: string;
  node_type: string;
  name: string;
  description: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  source_id: string;
  target_id: string;
  relation_type: string;
  properties: Record<string, any>;
  weight: number;
}

/**
 * Insert or update a graph node.
 */
export function upsertNode(
  db: Database.Database,
  id: string,
  nodeType: string,
  name: string,
  description: string = "",
  properties: Record<string, any> = {}
): void {
  db.prepare(`
    INSERT INTO graph_nodes (id, node_type, name, description, properties, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      node_type = excluded.node_type,
      name = excluded.name,
      description = excluded.description,
      properties = excluded.properties,
      updated_at = CURRENT_TIMESTAMP
  `).run(id, nodeType, name, description, JSON.stringify(properties));
}

/**
 * Insert or update a graph edge.
 */
export function upsertEdge(
  db: Database.Database,
  sourceId: string,
  targetId: string,
  relationType: string,
  properties: Record<string, any> = {},
  weight: number = 1.0
): void {
  db.prepare(`
    INSERT INTO graph_edges (source_id, target_id, relation_type, properties, weight)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(source_id, target_id, relation_type) DO UPDATE SET
      properties = excluded.properties,
      weight = excluded.weight
  `).run(sourceId, targetId, relationType, JSON.stringify(properties), weight);
}

/**
 * Bounded Blast-Radius Tracing — Recursive CTE replaces Neo4j MATCH path.
 * Finds all downstream nodes reachable from a seed node within maxDepth hops
 * via specified relationship types.
 */
export function blastRadiusTraversal(
  db: Database.Database,
  seedNodeId: string,
  relationTypes: string[] = ["PROVIDES_SERVICE_TO", "PART_OF"],
  maxDepth: number = 3
): Array<{
  dependency_chain: string[];
  relationship_types: string[];
  vulnerable_asset: string;
  asset_details: string;
}> {
  const placeholders = relationTypes.map(() => "?").join(",");

  const rows = db.prepare(`
    WITH RECURSIVE path_walk(current_id, depth, chain_ids, chain_names, chain_rels) AS (
      -- Anchor: start at the seed node
      SELECT
        gn.id,
        0,
        gn.id,
        gn.name,
        ''
      FROM graph_nodes gn
      WHERE gn.id = ?

      UNION ALL

      -- Recursive step: follow edges of allowed types
      SELECT
        ge.target_id,
        pw.depth + 1,
        pw.chain_ids || '|' || ge.target_id,
        pw.chain_names || '|' || tn.name,
        CASE WHEN pw.chain_rels = '' THEN ge.relation_type ELSE pw.chain_rels || '|' || ge.relation_type END
      FROM path_walk pw
      JOIN graph_edges ge ON ge.source_id = pw.current_id
      JOIN graph_nodes tn ON tn.id = ge.target_id
      WHERE pw.depth < ?
        AND ge.relation_type IN (${placeholders})
        AND instr(pw.chain_ids, ge.target_id) = 0  -- prevent cycles
    )
    SELECT
      chain_names,
      chain_rels,
      tn.name AS vulnerable_asset,
      tn.description AS asset_details
    FROM path_walk pw
    JOIN graph_nodes tn ON tn.id = pw.current_id
    WHERE pw.depth > 0
    ORDER BY pw.depth ASC
  `).all(seedNodeId, maxDepth, ...relationTypes) as any[];

  return rows.map(row => ({
    dependency_chain: (row.chain_names as string).split("|"),
    relationship_types: (row.chain_rels as string).split("|").filter(Boolean),
    vulnerable_asset: row.vulnerable_asset,
    asset_details: row.asset_details || "",
  }));
}

/**
 * Cross-Layer Geo-Semantic Intersection — Replaces Neo4j multi-MATCH.
 * Finds infrastructure nodes in a location impacted by a specific event,
 * along with their service providers.
 */
export function crossLayerIntersection(
  db: Database.Database,
  sectorName: string,
  eventId: string
): Array<{
  compromised_node: string;
  responsible_provider: string;
  active_threat: string;
}> {
  return db.prepare(`
    SELECT
      asset.name AS compromised_node,
      provider.name AS responsible_provider,
      event.name AS active_threat
    FROM graph_nodes event
    JOIN graph_edges impact_edge ON impact_edge.source_id = event.id
    JOIN graph_nodes loc ON loc.id = impact_edge.target_id
    JOIN graph_edges asset_edge ON (asset_edge.target_id = loc.id OR asset_edge.source_id = loc.id)
    JOIN graph_nodes asset ON asset.id = CASE
      WHEN asset_edge.target_id = loc.id THEN asset_edge.source_id
      ELSE asset_edge.target_id
    END
    JOIN graph_edges provider_edge ON provider_edge.target_id = asset.id
    JOIN graph_nodes provider ON provider.id = provider_edge.source_id
    WHERE loc.name = ?
      AND event.id = ?
      AND impact_edge.relation_type = 'IMPACTS'
      AND asset.node_type = 'INFRASTRUCTURE_NODE'
      AND provider.node_type = 'UTILITY_PROVIDER'
      AND provider_edge.relation_type = 'PROVIDES_SERVICE_TO'
  `).all(sectorName, eventId) as any[];
}

/**
 * Shortest Path — BFS via recursive CTE.
 * Returns the shortest path between a provider and target node.
 */
export function shortestPath(
  db: Database.Database,
  providerId: string,
  targetId: string,
  maxHops: number = 10
): { nodes: GraphNode[]; edges: Array<{ source: string; target: string; type: string }> } | null {
  const rows = db.prepare(`
    WITH RECURSIVE bfs(current_id, depth, path_ids) AS (
      SELECT ?, 0, ?

      UNION ALL

      SELECT
        ge.target_id,
        bfs.depth + 1,
        bfs.path_ids || '|' || ge.target_id
      FROM bfs
      JOIN graph_edges ge ON ge.source_id = bfs.current_id
      WHERE bfs.depth < ?
        AND instr(bfs.path_ids, ge.target_id) = 0
    )
    SELECT path_ids
    FROM bfs
    WHERE current_id = ?
    ORDER BY depth ASC
    LIMIT 1
  `).get(providerId, providerId, maxHops, targetId) as any;

  if (!rows) return null;

  const nodeIds = (rows.path_ids as string).split("|");
  const nodes: GraphNode[] = [];
  const edges: Array<{ source: string; target: string; type: string }> = [];

  for (const nodeId of nodeIds) {
    const node = db.prepare("SELECT * FROM graph_nodes WHERE id = ?").get(nodeId) as any;
    if (node) {
      nodes.push({
        id: node.id,
        node_type: node.node_type,
        name: node.name,
        description: node.description,
        properties: JSON.parse(node.properties || "{}"),
      });
    }
  }

  for (let i = 0; i < nodeIds.length - 1; i++) {
    const edge = db.prepare(
      "SELECT * FROM graph_edges WHERE source_id = ? AND target_id = ? LIMIT 1"
    ).get(nodeIds[i], nodeIds[i + 1]) as any;
    if (edge) {
      edges.push({
        source: edge.source_id,
        target: edge.target_id,
        type: edge.relation_type,
      });
    }
  }

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Initialization: Harden critical databases on import
// ---------------------------------------------------------------------------

export function initAllDatabases(): void {
  ensureDbDir();

  const criticalDbs = [
    "emma_vr_telemetry.db",
    "emma_world_model.db",
    "emma_history.db",
    "emma_proposals.db",
    "lucy_tasks.db",
    "emma_wisdom.db",
    "emma_graph.db",
  ];

  for (const dbName of criticalDbs) {
    backupAndRecover(dbName);
  }

  // Initialize the graph schema
  initGraphSchema("emma_graph.db");

  // Initialize simulation task schema
  const tasksDb = getDb("lucy_tasks.db");
  tasksDb.exec(`
    CREATE TABLE IF NOT EXISTS simulation_tasks (
      sim_id TEXT PRIMARY KEY,
      sector_target TEXT NOT NULL,
      current_status TEXT NOT NULL CHECK(current_status IN ('PENDING', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED')),
      ticks_processed INTEGER DEFAULT 0,
      total_ticks INTEGER NOT NULL,
      state_payload_json TEXT,
      last_updated_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Crash recovery: reset orphaned RUNNING simulations
  const runningTasks = tasksDb.prepare(
    "SELECT sim_id FROM simulation_tasks WHERE current_status = 'RUNNING'"
  ).all();
  if (runningTasks.length > 0) {
    console.log(`[DatabaseInit] Resetting ${runningTasks.length} orphaned RUNNING simulations to PENDING`);
    tasksDb.prepare("UPDATE simulation_tasks SET current_status = 'PENDING' WHERE current_status = 'RUNNING'").run();
  }

  // Initialize VR telemetry schema
  const vrDb = getDb("emma_vr_telemetry.db");
  vrDb.exec(`
    CREATE TABLE IF NOT EXISTS game_telemetry (
      id TEXT PRIMARY KEY,
      state TEXT,
      last_updated INTEGER
    )
  `);

  console.log("[DatabaseInit] All databases initialized and hardened");
}

// ---------------------------------------------------------------------------
// Export DB directory for external use
// ---------------------------------------------------------------------------

export { DB_DIR };
