Lucy's Graph-Linked Local
The architectural transition of consumer artificial intelligence from centralized cloud environments to edge-native, zero-trust configurations is prompted by critical limitations in traditional Retrieval-Augmented Generation (RAG) paradigms. Standard RAG models, which utilize flat vector search indexes hosted on external servers, struggle to resolve multi-hop relational dependencies, lack transactional guarantees, introduce network latency, and fail to secure private user information. To build a self-contained, offline-capable assistant named "Lucy" on local workstations, the underlying software must integrate the multi-hop relational capabilities of embedded graph databases with the structured, deterministic output patterns of local Large Language Models (LLMs). This document outlines the technical specifications, data schemas, and programmatic orchestration required to deploy a secure, offline, graph-linked assistant.
Comparative Evaluation of Embedded Graph Database Architectures
A sovereign AI assistant relies on a persistent database that acts as a local world model. Selecting an appropriate embedded graph database requires evaluating data storage efficiency, query execution speed, transactional properties, and ease of deployment. While legacy graph systems like Neo4j provide robust visual querying environments, their containerized architectures introduce operational overhead that conflicts with the design goals of a lightweight, zero-configuration local application.
To achieve an embedded, serverless execution profile, three main architectural paradigms are available: SurrealDB, LadybugDB (the active community-led fork of the archived Kùzu engine), and customized relational structures mapped over SQLite.
SurrealDB functions as a multi-model engine that unifies document, vector, and relational graph models into a single query environment. Following the release of its 3.x execution engine, SurrealDB demonstrated massive throughput gains in non-indexed scans, batch operations, and structured CRUD processes. This engine is exceptionally well-suited for systems where the graph coexists with large document attachments, as it minimizes database sprawl by combining diverse storage models into a single local process.
However, for deep graph-analytical tasks that prioritize traverse speeds and strict relationship enforcement, dedicated columnar graph engines are structurally superior.
LadybugDB, inheriting Kùzu’s vectorized query processor and factorized execution patterns, scales efficiently to handle deep traversals on massive local datasets. Columnar disk-based storage and Columnar Sparse Row (CSR) adjacency lists allow LadybugDB to perform join operations in microseconds, bypassing the expensive runtime computation overhead associated with traditional SQL databases.
Furthermore, LadybugDB supports native vector indexing via Hierarchical Navigable Small World (HNSW) graphs, permitting developers to execute hybrid queries that compose semantic vector similarity and graph traversals within a single Cypher block.
For applications constrained by binary distribution and deployment complexity, SQLite-graph represents a viable alternative. By utilizing recursive Common Table Expressions (CTEs), an application can implement bidirectional, depth-bounded multi-hop traversals over standard SQLite indexing.
While SQLite lacks native graph visualization and the expressive power of Cypher, its transactional durability (enabled by Write-Ahead Logging), full-text search integration (via FTS5), and single-file portability make it a robust choice for edge deployments scaling below one hundred thousand entities.
Evaluation Parameter
SurrealDB (v3.x)
LadybugDB (Kùzu Fork)
SQLite-Graph (SQL)
Storage Architecture
Multi-model (Document, Graph, Key-Value)
Columnar Property Graph (CSR-optimized)
Relational Tables with Composite Indexing
Query Dialect
SurrealQL
openCypher
Standard SQL with Recursive CTEs
Vector Search Support
Integrated Vector Fields
Native HNSW Vector Indexes
FFI Extension (sqlite-vec)
Schema Strictness
Hybrid (Schemaless / Schemafull)
Enforced Typed Declarations
Strongly Typed Table Schemas
Traversal Mechanics
Pointer-based Graph Links
Vectorized and Factorized Joins
Recursive CTEs (Breadth-First Search)
Concurrency & ACID
ACID, Multi-version Concurrency
Serializable ACID Transactions
WAL Mode (Concurrent Read, Single Write)
Deployment Footprint
Single Binary or Library
Embedded, In-Process Library
Embedded, Zero-Dependency Single File

The transition from the archived Kùzu core to LadybugDB introduced several features designed for local agent applications. Legacy Kùzu implementations forced a strict node-table-per-label mapping, limiting multi-label classification patterns. LadybugDB resolved this constraint by supporting multi-label declarations, allowing entities to be classified under hierarchical schemas such as CREATE (:Person:Employee:Manager).
Additionally, LadybugDB supports zero-copy external dataset attachments, letting the engine query Arrow, DuckDB, and Parquet files in place without requiring an ingest step.
For visualization, the Tauri-based Bugscope application offers an interactive, force-directed canvas that groups LadybugDB records into Leiden clusters using local execution algorithms. On Windows platforms, developers must specify @ladybugdb/core version 0.16.0 or higher to bypass Access Violation (0xC0000005) segmentation faults that occurred in early builds during native FTS and vector extension initialization.
Cognitive Ontology, Semantic Spacetime, and the Memory Tri-Store
Traditional RAG systems suffer from temporal drift and context dilution because they treat context injection as a static text retrieval problem. Human-like recall requires a structured memory topology that separates short-term experiences, long-term declarative facts, and operational decision trajectories.
Memory Layer
Lifespan
Underlying Storage Schema
Primary Retrieval Method
Architectural Purpose
Short-Term (Conversational)
Ephemeral / Session-Scoped
Linear message streams with session scoping
Semantic search + chronological sliding windows
Maintains immediate conversational focus and dialogue continuity
Long-Term (Declarative)
Persistent / Accruing
Labeled Property Graph (POLE+O Ontology)
Subgraph traversals + vector similarity lookup
Stores facts, entity attributes, preferences, and world concepts
Decision Trace (Procedural)
Archival / Diagnostic
Step-by-step decision trees (:DecisionTrace)
Trace similarity searches + outcomes mapping
Records how tasks were solved, tools used, and failure modes

The physical separation of these layers allows the local intelligence to balance different lifecycles and query patterns, but they must ultimately link back to a unified topological framework. The most robust foundation for this structure is Mark Burgess’s "Semantic Spacetime" ontology. Rather than relying on an arbitrary, unconstrained property bag, Semantic Spacetime categorizes all cognitive associations into four fundamental, theoretically grounded relation types :
NEAR / SIMILAR_TO: Establishes spatial, semantic, or conceptual proximity, such as mapping similar project topics or related concepts without requiring hard links.
LEADS_TO: Represents temporal sequencing, state transformations, and causal dependencies. For example, the execution of a planning step leads to a specific file modification or code output.
CONTAINS: Models containment, physical location, and conceptual hierarchy. This ensures structural grouping, such as declaring that a codebase directory contains a target source file.
EXPRESSES_PROPERTY: Connects any node in the graph to its intrinsic parameters, configuration profiles, or variable properties.
Traditional graph databases store key-value attributes inside nodes as unstructured property bags, which isolates properties from the query parser. LadybugDB resolves this by storing properties in structured STRUCT declarations.
This method ensures schema enforcement at the database level and allows the query engine to perform vectorized scans of nested properties.
Alternatively, properties can be promoted to first-class nodes connected via EXPRESSES_PROPERTY edges, allowing properties to participate in relationships. Promoting properties to first-class nodes enables the system to track metadata like temporal provenance (via learned_at and expired_at properties on the edges) and contextual attribution, helping Lucy determine when a fact was discovered or invalidated.
[Entity: Alice] --(EXPRESSES_PROPERTY {learned_at: "2026-03-15"})--> [PropertyNode: Python]
                                                                        |
                                                                  (SIMILAR_TO)
                                                                        v
                                                             


To coordinate multi-agent processes and system interactions, this ontology is integrated with Mark Burgess’s Promise Theory. Under Promise Theory, cooperative behaviors are modeled as autonomous, localized commitments (promises made and kept) rather than top-down hierarchical commands.
The resulting "Promise Graph" preserves audit trails and permissions by tracking who initiated a promise, under what conditions it was executed, and what state transformation resulted. Combined, these frameworks yield a mathematical representation of on-device context, allowing Lucy to understand temporal progression, provenance, and operational boundaries.
System Topology and Dual-Native Linkage Data Flow
The sovereign orchestration loop must manage data flows concurrently across the user application, the local database instances, and the local inference engine (orchestrated via Ollama) without leakage to external networks. The pipeline functions as an intercept-and-enrich loop:
graph TD
    User([User Prompt]) -->|Intercept| Orchestrator[Orchestration Engine]
    
    %% Retrieval Phase
    Orchestrator -->|1. Parallel Query| SearchEngine{Retrieval Engine}
    SearchEngine -->|FTS5 Keyword Query| DB_FTS
    SearchEngine -->|Vector Embed Query| DB_Vec
    SearchEngine -->|Entity Seed Traversal| DB_Graph
    
    DB_FTS -->|Ranked FTS Hits| RRF
    DB_Vec -->|Ranked Semantic Hits| RRF
    DB_Graph -->|1 to 2 Hop Neighborhood| RRF
    
    RRF -->|Fused, Low-Token Context| PromptGen
    
    %% Generation Phase
    PromptGen -->|Grounding Prompt| LocalLLM[Ollama Local LLM]
    LocalLLM -->|Streamed Output| User
    
    %% Asynchronous Ingestion & Fact Extraction
    LocalLLM -.->|Response Generated| PostProcess
    PostProcess -->|Chat Interaction Data| SchemaExtract
    SchemaExtract -->|Validate JSON Schema| ParsePipe[Parse & Validate Entities/Edges]
    ParsePipe -->|Write Transactions| DB_FTS
    ParsePipe -->|Write Transactions| DB_Vec
    ParsePipe -->|Write Transactions| DB_Graph


Context Retrieval Phase
When the user submits an execution prompt, the orchestrator initiates a multi-mode retrieval run. It performs a keyword match against the FTS5 virtual tables, a vector cosine similarity search on the query embedding, and a recursive graph traversal seeded with entities recognized in the prompt.
These independent outputs are combined using Reciprocal Rank Fusion (RRF), calculating a unified score for each retrieved memory unit. The mathematical formulation for RRF ranks a document d within a set of retrieval runs M as follows:
RRF(d) = \sum_{m[span_50](start_span)[span_50](end_span)[span_60](start_span)[span_60](end_span) \in M} \frac{1}{k + r_m(d)}
Where k is a constant (typically 60) used to reduce the impact of outliers, and r_m(d) is the ordinal rank assigned to document d by the retrieval run m.
Context Compression and Inference
The top-ranked items and their localized graph neighborhoods (one to two hops) are serialized into a highly compressed Markdown context block and injected into the LLM's system instructions. This process prioritizes relationship-heavy connections over raw text chunks, keeping token overhead to a minimum and preventing context window dilution in local execution models.
Asynchronous Ingestion and Memory Extraction
After the LLM streams its final token back to the user, the interaction is passed to an asynchronous extraction thread. The orchestrator prompts a local extraction model (such as Llama-3-8B-Instruct or Qwen-2.5-7B) with structural constraint formatting (such as Ollama's structured output format) to generate validated, typed entities and relationships.
The extracted facts are checked for conflicts against existing nodes, merged if duplicate aliases are resolved, and transactionally written back to the local database file.
Physical Database Schema Specifications
To implement this sovereign architecture, physical schema specifications for both LadybugDB and SQLite-Graph (using SQLCipher for local disk encryption) are detailed below.
LadybugDB / Kùzu Schema Definition
The LadybugDB configuration utilizes structured data types (STRUCT) and explicit node and relationship declarations to enforce the POLE+O classification and Semantic Spacetime schemas.
// Node Table Definitions
CREATE NODE TABLE User (
    id STRING,
    name STRING,
    created_at TIMESTAMP,
    preferences STRUCT(theme STRING, max_tokens INT64, language STRING),
    PRIMARY KEY (id)
);

CREATE NODE TABLE Agent (
    id STRING,
    name STRING,
    model_config STRUCT(provider STRING, model_name STRING, temperature DOUBLE),
    PRIMARY KEY (id)
);

CREATE NODE TABLE Entity (
    id STRING,
    name STRING,
    entity_type STRING, // POLE+O Class (Person, Organization, Location, Event, Object)
    summary STRING,
    embedding FLOAT, // Fixed-list vector representation
    PRIMARY KEY (id)
);

CREATE NODE TABLE Event (
    id STRING,
    title STRING,
    timestamp TIMESTAMP,
    outcome STRING,
    PRIMARY KEY (id)
);

// Semantic Spacetime Relationship Tables
CREATE REL TABLE NEAR (
    FROM Entity TO Entity,
    similarity DOUBLE,
    kind STRING
);

CREATE REL TABLE LEADS_TO (
    FROM Event TO Event,
    sequence_order INT64,
    causality_strength DOUBLE
);

CREATE REL TABLE CONTAINS (
    FROM Entity TO Entity,
    hierarchical_depth INT64
);

CREATE REL TABLE EXPRESSES_PROPERTY (
    FROM Entity TO Entity,
    learned_at TIMESTAMP,
    expired_at TIMESTAMP,
    confidence DOUBLE,
    kind STRING
);

// HNSW Vector Indexing Configuration for Semantic Matching
CREATE VECTOR INDEX entity_vector_idx ON Entity (embedding) 
USING HNSW (
    metric = 'cosine', 
    num_neighbors_to_retrieve = 10, 
    m = 16, 
    ef_construction = 64, 
    ef_search = 32
);


SQLite-Graph (SQLCipher Encrypted) Schema
For environments requiring single-file deployment, this schema uses standard SQL tables combined with recursive CTE traversals, trigger-synced FTS5 virtual tables, and SQLCipher for local database encryption.
-- SQLCipher Local Encryption Configuration (Applied immediately post-connection)
PRAGMA key = 'secure_offline_key_phrase_for_lucy_warehouse';
PRAGMA cipher_page_size = 4096;

-- Core Storage Tables
CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK(entity_type IN ('Person', 'Organization', 'Location', 'Event', 'Object')),
    summary TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT
);

CREATE TABLE IF NOT EXISTS edges (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    relation TEXT NOT NULL CHECK(relation IN ('NEAR', 'LEADS_TO', 'CONTAINS', 'EXPRESSES_PROPERTY')),
    fact TEXT,
    confidence REAL DEFAULT 1.0,
    valid_from TEXT NOT NULL,
    valid_until TEXT,
    recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(source_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY(target_id) REFERENCES entities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS episodes (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    source TEXT NOT NULL,
    recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT
);

CREATE TABLE IF NOT EXISTS episode_entities (
    episode_id TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    PRIMARY KEY(episode_id, entity_id),
    FOREIGN KEY(episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
    FOREIGN KEY(entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS aliases (
    alias_name TEXT PRIMARY KEY,
    canonical_id TEXT NOT NULL,
    FOREIGN KEY(canonical_id) REFERENCES entities(id) ON DELETE CASCADE
);

-- FTS5 Virtual Tables for Full-Text Search
CREATE VIRTUAL TABLE IF NOT EXISTS episodes_fts USING fts5(
    content,
    source,
    tokenize="unicode61"
);

CREATE VIRTUAL TABLE IF NOT EXISTS entities_fts USING fts5(
    name,
    summary,
    tokenize="unicode61"
);

-- Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_id);
CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_id);
CREATE INDEX IF NOT EXISTS idx_edges_relation ON edges(relation);
CREATE INDEX IF NOT EXISTS idx_edges_validity ON edges(valid_from, valid_until) WHERE valid_until IS NULL;
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_episode_entities_rev ON episode_entities(entity_id);

-- FTS5 Automapping Triggers (Insert, Update, Delete sync)
CREATE TRIGGER IF NOT EXISTS trigger_episodes_ai AFTER INSERT ON episodes BEGIN
    INSERT INTO episodes_fts(rowid, content, source) VALUES (new.rowid, new.content, new.source);
END;

CREATE TRIGGER IF NOT EXISTS trigger_episodes_ad AFTER DELETE ON episodes BEGIN
    INSERT INTO episodes_fts(episodes_fts, rowid, content, source) VALUES ('delete', old.rowid, old.content, old.source);
END;

CREATE TRIGGER IF NOT EXISTS trigger_episodes_au AFTER UPDATE ON episodes BEGIN
    INSERT INTO episodes_fts(episodes_fts, rowid, content, source) VALUES ('delete', old.rowid, old.content, old.source);
    INSERT INTO episodes_fts(rowid, content, source) VALUES (new.rowid, new.content, new.source);
END;

CREATE TRIGGER IF NOT EXISTS trigger_entities_ai AFTER INSERT ON entities BEGIN
    INSERT INTO entities_fts(rowid, name, summary) VALUES (new.rowid, new.name, new.summary);
END;

CREATE TRIGGER IF NOT EXISTS trigger_entities_ad AFTER DELETE ON entities BEGIN
    INSERT INTO entities_fts(entities_fts, rowid, name, summary) VALUES ('delete', old.rowid, old.name, old.summary);
END;

CREATE TRIGGER IF NOT EXISTS trigger_entities_au AFTER UPDATE ON entities BEGIN
    INSERT INTO entities_fts(entities_fts, rowid, name, summary) VALUES ('delete', old.rowid, old.name, old.summary);
    INSERT INTO entities_fts(rowid, name, summary) VALUES (new.rowid, new.name, new.summary);
END;


Core Python Orchestration Script
This Python execution engine coordinates the local memory lifecycle. It handles multi-mode context retrieval, executes recursive CTE traversals, applies Reciprocal Rank Fusion, performs local LLM inference via Ollama, and manages asynchronous entity resolution and bi-temporal updates.
import os
import sqlite3
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from pydantic import BaseModel, Field
import ollama

# --- Pydantic Structures for Ontological Extraction ---
class ExtractedEntity(BaseModel):
    name: str = Field(description="Canonical, clean name of the entity.")
    entity_type: str = Field(description="Must be one of: Person, Organization, Location, Event, Object.")
    summary: str = Field(description="A single-sentence factual summary of the entity.")

class ExtractedEdge(BaseModel):
    source_name: str = Field(description="The exact name of the source entity.")
    target_name: str = Field(description="The exact name of the target entity.")
    relation: str = Field(description="One of: NEAR, LEADS_TO, CONTAINS, EXPRESSES_PROPERTY.")
    fact: str = Field(description="Brief, context-focused description of how they relate.")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Extraction confidence score.")

class CognitiveExtractionPayload(BaseModel):
    analysis_rationale: str = Field(description="Internal logic analyzing entities and relationships.")
    entities: List[ExtractedEntity] = Field(default_factory=list)
    edges: List[ExtractedEdge] = Field(default_factory=list)


# --- Sovereign Orchestration Engine ---
class SovereignOrchestrator:
    def __init__(self, db_path: str = "lucy_warehouse.db", model_name: str = "llama3.1:8b", secret_key: str = None):
        self.db_path = db_path
        self.model_name = model_name
        self.secret_key = secret_key
        self._initialize_database()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        
        # Apply local encryption parameters if a key is supplied
        if self.secret_key:
            conn.execute(f"PRAGMA key = '{self.secret_key}';")
            conn.execute("PRAGMA cipher_page_size = 4096;")
            
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA synchronous = NORMAL;")
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    def _initialize_database(self):
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Core storage tables setup (matching SQLite-Graph specifications)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS entities (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            entity_type TEXT NOT NULL CHECK(entity_type IN ('Person', 'Organization', 'Location', 'Event', 'Object')),
            summary TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT
        );""")
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS edges (
            id TEXT PRIMARY KEY,
            source_id TEXT NOT NULL,
            target_id TEXT NOT NULL,
            relation TEXT NOT NULL CHECK(relation IN ('NEAR', 'LEADS_TO', 'CONTAINS', 'EXPRESSES_PROPERTY')),
            fact TEXT,
            confidence REAL DEFAULT 1.0,
            valid_from TEXT NOT NULL,
            valid_until TEXT,
            recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(source_id) REFERENCES entities(id) ON DELETE CASCADE,
            FOREIGN KEY(target_id) REFERENCES entities(id) ON DELETE CASCADE
        );""")
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS episodes (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            source TEXT NOT NULL,
            recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT
        );""")
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS episode_entities (
            episode_id TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            PRIMARY KEY(episode_id, entity_id),
            FOREIGN KEY(episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
            FOREIGN KEY(entity_id) REFERENCES entities(id) ON DELETE CASCADE
        );""")

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS aliases (
            alias_name TEXT PRIMARY KEY,
            canonical_id TEXT NOT NULL,
            FOREIGN KEY(canonical_id) REFERENCES entities(id) ON DELETE CASCADE
        );""")

        # FTS5 Virtual Tables Setup
        cursor.execute("CREATE VIRTUAL TABLE IF NOT EXISTS episodes_fts USING fts5(content, source, tokenize='unicode61');")
        
        # FTS5 Synchronization Triggers Setup
        cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS trigger_episodes_ai AFTER INSERT ON episodes BEGIN
            INSERT INTO episodes_fts(rowid, content, source) VALUES (new.rowid, new.content, new.source);
        END;""")
        cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS trigger_episodes_ad AFTER DELETE ON episodes BEGIN
            INSERT INTO episodes_fts(episodes_fts, rowid, content, source) VALUES ('delete', old.rowid, old.content, old.source);
        END;""")
        cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS trigger_episodes_au AFTER UPDATE ON episodes BEGIN
            INSERT INTO episodes_fts(episodes_fts, rowid, content, source) VALUES ('delete', old.rowid, old.content, old.source);
            INSERT INTO episodes_fts(rowid, content, source) VALUES (new.rowid, new.content, new.source);
        END;""")

        # Optimization Indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_edges_relation ON edges(relation);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_edges_validity ON edges(valid_from, valid_until) WHERE valid_until IS NULL;")
        
        conn.commit()
        conn.close()

    # --- Bidirectional Recursive CTE Traversal ---
    def retrieve_graph_neighborhood(self, seed_entity_ids: List[str], max_depth: int = 2) -> Tuple], List]]:
        if not seed_entity_ids:
            return,
            
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Construct parameters for SQL query binding
        placeholders = ','.join('?' for _ in seed_entity_ids)
        
        # Execute recursive CTE traversal (bidirectional graph search)
        traversal_query = f"""
        WITH RECURSIVE traversal(entity_id, depth) AS (
            SELECT id, 0 FROM entities WHERE id IN ({placeholders})
            UNION
            SELECT 
                CASE WHEN e.source_id = t.entity_id THEN e.target_id ELSE e.source_id END,
                t.depth + 1
            FROM traversal t
            JOIN edges e ON (e.source_id = t.entity_id OR e.target_id = t.entity_id)
            WHERE t.depth <? AND e.valid_until IS NULL
        )
        SELECT DISTINCT entity_id FROM traversal;
        """
        
        params = list(seed_entity_ids) + [max_depth]
        cursor.execute(traversal_query, params)
        traversed_ids = [row["entity_id"] for row in cursor.fetchall()]
        
        if not traversed_ids:
            conn.close()
            return,
            
        # Retrieve traversed entity attributes
        id_placeholders = ','.join('?' for _ in traversed_ids)
        cursor.execute(f"SELECT * FROM entities WHERE id IN ({id_placeholders});", traversed_ids)
        entities = [dict(row) for row in cursor.fetchall()]
        
        # Retrieve edges between traversed nodes
        cursor.execute(f"""
            SELECT * FROM edges 
            WHERE source_id IN ({id_placeholders}) 
              AND target_id IN ({id_placeholders}) 
              AND valid_until IS NULL;
        """, traversed_ids + traversed_ids)
        edges = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        return entities, edges

    # --- Local Text Search Interface ---
    def keyword_search_episodes(self, query: str, limit: int = 5) -> List]:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT e.id, e.content, e.source, e.recorded_at, e.metadata, fts.rank 
            FROM episodes e
            JOIN episodes_fts fts ON e.rowid = fts.rowid
            WHERE episodes_fts MATCH? 
            ORDER BY fts.rank ASC 
            LIMIT?;
        """, (query, limit))
        results = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return results

    # --- Dummy Vector Similarity Matcher ---
    def vector_similarity_search(self, query_text: str, limit: int = 5) -> List]:
        # This function represents a vector-similarity placeholder.
        # In a production system, this interface binds to an on-device ONNX runtime library
        # to generate query embeddings and evaluate cosine similarity metrics on database columns.
        return

    # --- Reciprocal Rank Fusion Context Aggregator ---
    def execute_fused_search(self, prompt: str, k_constant: int = 60) -> Tuple[List[str], List[str]]:
        # Execute individual search threads
        fts_hits = self.keyword_search_episodes(prompt, limit=10)
        vec_hits = self.vector_similarity_search(prompt, limit=10)
        
        # Combine ranks using Reciprocal Rank Fusion
        rrf_scores: Dict[str, float] = {}
        document_registry: Dict] = {}
        
        for index, item in enumerate(fts_hits):
            doc_id = item["id"]
            document_registry[doc_id] = item
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + (1.0 / (k_constant + (index + 1)))
            
        for index, item in enumerate(vec_hits):
            doc_id = item["id"]
            document_registry[doc_id] = item
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + (1.0 / (k_constant + (index + 1)))
            
        # Select top-ranked items
        sorted_docs = sorted(rrf_scores.items(), key=lambda x: x, reverse=True)[:5]
        fused_episodes = [document_registry[doc_id]["content"] for doc_id, _ in sorted_docs]
        
        # Resolve associated entity mappings
        seed_entity_ids =
        if sorted_docs:
            conn = self._get_connection()
            cursor = conn.cursor()
            doc_ids = [doc_id for doc_id, _ in sorted_docs]
            placeholders = ','.join('?' for _ in doc_ids)
            cursor.execute(f"SELECT DISTINCT entity_id FROM episode_entities WHERE episode_id IN ({placeholders});", doc_ids)
            seed_entity_ids = [row["entity_id"] for row in cursor.fetchall()]
            conn.close()
            
        # Execute recursive CTE traversal based on resolved entity seeds
        entities, edges = self.retrieve_graph_neighborhood(seed_entity_ids, max_depth=2)
        
        serialized_entities = [f"- **{e['name']}** ({e['entity_type']}): {e['summary']}" for e in entities]
        serialized_edges = [f"- **{edge['source_id']}** relates to **{edge['target_id']}** via [{edge['relation']}]: \"{edge['fact']}\"" for edge in edges]
        
        return fused_episodes, (serialized_entities + serialized_edges)

    # --- Core Generation Pipeline ---
    def generate_grounded_response(self, user_prompt: str) -> str:
        # Step 1: Execute multi-mode fused retrieval
        ep_context, graph_context = self.execute_fused_search(user_prompt)
        
        # Assemble grounding system prompt
        system_prompt = f"""You are 'Lucy', a secure, sovereign, local-first AI assistant.
Always ground your answers in the localized context graph provided below. If matching facts are present, prioritize them over generic training defaults.

=== SOPHISTICATED LOCAL CONTEXT MAP ===

{chr(10).join(graph_context) if graph_context else "No active relationship connections mapped."}


{chr(10).join(ep_context) if ep_context else "No previous dialogue context."}
======================================="""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        # Step 2: Run local LLM inference
        response = ollama.chat(
            model=self.model_name,
            messages=messages,
            options={"temperature": 0.3}
        )
        
        assistant_reply = response["message"]["content"]
        
        # Step 3: Run asynchronous memory update transaction
        self._async_memory_ingestion_pipeline(user_prompt, assistant_reply)
        
        return assistant_reply

    # --- Memory Ingestion Pipeline ---
    def _async_memory_ingestion_pipeline(self, user_msg: str, assistant_msg: str):
        episode_content = f"User: {user_msg}\nAssistant: {assistant_msg}"
        episode_id = str(uuid.uuid4())
        timestamp_str = datetime.utcnow().isoformat()
        
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # 1. Log Conversation Episode
            cursor.execute(
                "INSERT INTO episodes (id, content, source) VALUES (?,?,?);",
                (episode_id, episode_content, "conversation")
            )
            
            # 2. Extract structured entities and relations from interaction using local model and Pydantic schema
            extraction_payload = self._run_schema_constrained_extraction(episode_content)
            
            # 3. Process entities and reconcile with DB state
            entity_id_map = {}
            for raw_ent in extraction_payload.entities:
                canonical_id = self._reconcile_entity(cursor, raw_ent)
                entity_id_map[raw_ent.name.lower()] = canonical_id
                
                # Associate episode with entity
                cursor.execute(
                    "INSERT OR IGNORE INTO episode_entities (episode_id, entity_id) VALUES (?,?);",
                    (episode_id, canonical_id)
                )
                
            # 4. Process relationships with bi-temporal and temporal controls
            for raw_edge in extraction_payload.edges:
                src_canonical = entity_id_map.get(raw_edge.source_name.lower())
                tgt_canonical = entity_id_map.get(raw_edge.target_name.lower())
                
                if src_canonical and tgt_canonical:
                    self._upsert_edge(cursor, src_canonical, tgt_canonical, raw_edge, timestamp_str)
                    
            conn.commit()
        except Exception as e:
            conn.rollback()
            print(f" Transaction rolled back during memory ingestion: {e}")
        finally:
            conn.close()

    def _run_schema_constrained_extraction(self, text: str) -> CognitiveExtractionPayload:
        extraction_prompt = f"""You are a structural parser mapping conversational inputs into a strict JSON memory ontology schema.
Extract all relevant people, organizations, locations, events, and distinct objects as entities.
Analyze how those entities associate using ONLY the standard relation structures:
1. NEAR
2. LEADS_TO
3. CONTAINS
4. EXPRESSES_PROPERTY

Do not output raw commentary.

Source Chat:
\"\"\"
{text}
\"\"\""""

        try:
            # Leverage Ollama structured formatting to enforce Pydantic validation schema
            response = ollama.chat(
                model=self.model_name,
                messages=[{"role": "user", "content": extraction_prompt}],
                format=CognitiveExtractionPayload.model_json_schema(),
                options={"temperature": 0.0}  # Determinism is required
            )
            
            raw_payload = response["message"]["content"]
            return CognitiveExtractionPayload.model_validate_json(raw_payload)
        except Exception as e:
            print(f" Extraction execution failed: {e}. Falling back to empty memory payload.")
            return CognitiveExtractionPayload(analysis_rationale="Extraction failure.", entities=, edges=)

    def _reconcile_entity(self, cursor: sqlite3.Cursor, entity: ExtractedEntity) -> str:
        lookup_name = entity.name.strip().lower()
        
        # Check alias database for canonical target matching
        cursor.execute("SELECT canonical_id FROM aliases WHERE alias_name =?;", (lookup_name,))
        row = cursor.fetchone()
        
        if row:
            return row["canonical_id"]
            
        # Resolve Jaro-Winkler/exact match for duplicates in database
        cursor.execute("SELECT id FROM entities WHERE LOWER(name) =?;", (lookup_name,))
        exact_match = cursor.fetchone()
        if exact_match:
            canonical_id = exact_match["id"]
        else:
            # Create a new Canonical Entity Record
            canonical_id = str(uuid.uuid4())
            cursor.execute(
                "INSERT INTO entities (id, name, entity_type, summary) VALUES (?,?,?,?);",
                (canonical_id, entity.name, entity.entity_type, entity.summary)
            )
            
        # Map Alias to Canonical ID
        cursor.execute(
            "INSERT OR IGNORE INTO aliases (alias_name, canonical_id) VALUES (?,?);",
            (lookup_name, canonical_id)
        )
        return canonical_id

    def _upsert_edge(self, cursor: sqlite3.Cursor, src_id: str, tgt_id: str, edge: ExtractedEdge, now_timestamp: str):
        # Search for an existing current path between source and target
        cursor.execute("""
            SELECT id, fact FROM edges 
            WHERE source_id =? AND target_id =? AND relation =? AND valid_until IS NULL;
        """, (src_id, tgt_id, edge.relation))
        existing_edge = cursor.fetchone()
        
        if existing_edge:
            # Update parameters if description is unchanged
            if existing_edge["fact"] == edge.fact:
                cursor.execute(
                    "UPDATE edges SET confidence = max(confidence,?), recorded_at =? WHERE id =?;",
                    (edge.confidence, now_timestamp, existing_edge["id"])
                )
            else:
                # Invalidate the older relationship record and write the updated state
                cursor.execute(
                    "UPDATE edges SET valid_until =? WHERE id =?;",
                    (now_timestamp, existing_edge["id"])
                )
                new_edge_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO edges (id, source_id, target_id, relation, fact, confidence, valid_from) 
                    VALUES (?,?,?,?,?,?,?);
                """, (new_edge_id, src_id, tgt_id, edge.relation, edge.fact, edge.confidence, now_timestamp))
        else:
            # Insert standard relationship
            new_edge_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO edges (id, source_id, target_id, relation, fact, confidence, valid_from) 
                VALUES (?,?,?,?,?,?,?);
            """, (new_edge_id, src_id, tgt_id, edge.relation, edge.fact, edge.confidence, now_timestamp))


# --- Verification Execution Scope ---
if __name__ == "__main__":
    # Instantiate engine with an encrypted local core database file
    assistant = SovereignOrchestrator(
        db_path="lucy_cognitive_core.db", 
        model_name="llama3.1:8b", 
        secret_key="secure_offline_key_phrase_for_lucy_warehouse"
    )
    
    # Store factual information in database
    prompt_one = "Remember that the Lucy core system runs on Llama 3 and uses an encrypted database."
    reply_one = assistant.generate_grounded_response(prompt_one)
    print(f"\nUser: {prompt_one}\nLucy: {reply_one}\n")
    
    # Verify multi-mode fusion and CTE retrieval works by querying relationship
    prompt_two = "What language model does the Lucy core run on?"
    reply_two = assistant.generate_grounded_response(prompt_two)
    print(f"\nUser: {prompt_two}\nLucy: {reply_two}\n")


Sovereignty, Containerization, and Desktop Deployment
To maintain operational sovereignty, the application stack must run locally on user-controlled hardware, omitting external cloud calls or remote analytics loops. Containerization provides security boundaries and execution isolation. The orchestrator process and its localized database layers are managed as secure, independent environments on the host hardware.
Production Docker-Compose Configuration
The following compose configuration packages the local application stack, exposing GPU rendering pipelines to Ollama while binding database storage volumes to local directories.
version: '3.8'

services:
  # Local LLM Inference Engine Engine
  ollama-engine:
    image: ollama/ollama:latest
    container_name: lucy_ollama_engine
    volumes:
      - ollama_model_data:/root/.ollama
    ports:
      - "11434:11434"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    restart: unless-stopped
    healthcheck:
      test:
      interval: 10s
      timeout: 5s
      retries: 3

  # Sovereign Application Layer and DB Warehouse Orchestrator
  lucy-orchestrator:
    image: python:3.11-slim
    container_name: lucy_app_core
    depends_on:
      ollama-engine:
        condition: service_healthy
    volumes:
      -./app_code:/app
      -./lucy_database_volume:/data
    working_dir: /app
    environment:
      - DB_FILE_PATH=/data/lucy_cognitive_core.db
      - OLLAMA_HOST=http://ollama-engine:11434
    command: >
      sh -c "pip install --no-cache-dir ollama pydantic &&
             python -u system_orchestrator.py"
    restart: unless-stopped

volumes:
  ollama_model_data:
    driver: local
  lucy_database_volume:
    driver: local


Desktop Runtime Engineering
While container orchestration provides a robust development framework, consumer-grade desktop deployments benefit from native wrappers like Tauri. Tauri uses Rust for backend process management and system calls, and a web-based frontend (React/Tailwind) for UI rendering, offering a secure alternative to Electron's resource-heavy footprint.
This native execution pattern has several key advantages:
Direct FFI Bindings: Tauri bypasses network exposure by loading databases like SQLite (using rusqlite or sqlite-vec extensions) or LadybugDB directly into the application process via Foreign Function Interfaces (FFI).
Local Security Safeguards: Applications can process and sanitize input (e.g., stripping JWTs, API keys, and personal identifiers) within the client runtime before writing any records to the encrypted local database.
Optimized Token Management: The Rust backend can dynamically manage model context windows, trimming older conversation messages to fit within Ollama's local hardware constraints and keeping response latency low.
Strategic Engineering Conclusions
Structuring AI memory as an embedded, strongly typed graph represents a reliable approach for engineering sovereign, personalized computing systems. By rejecting external cloud APIs, systems like Lucy mitigate risks associated with data privacy breaches, subscription service lock-in, and unpredictable API changes.
This implementation highlights several architectural advantages:
Relational Context Grounding: Unlike flat text searches that can lose logical structure, graph memory tracks explicit, typed relations between concepts, improving agent reasoning.
Controlled Token Budgets: Injecting highly compressed graph neighborhoods (one to two hops) into system prompts lowers context overhead, keeping local inference fast and computationally efficient.
Bi-temporal Validation Paths: Implementing validity intervals (valid_from, valid_until) and confidence scoring allows the system to manage contradictions and temporal progression natively, reducing hallucinations.
When scale requirements surpass SQLite's sweet spot (beyond one hundred thousand conceptual records), teams can transition directly to embedded LadybugDB instances. This upgrade preserves the schema configuration and local, in-process execution model, unlocking performance at scale. Integrating on-device reasoning engines with structured property graphs delivers highly localized, contextually grounded, and private AI assistants.
Works cited
1. Why Your AI Agent Needs a Graph Database on the Device | by Volodymyr Pavlyshyn, https://volodymyrpavlyshyn.medium.com/why-your-ai-agent-needs-a-graph-database-on-the-device-56ae0d423534 2. Agent Memory Architectures: Vector vs Graph vs Episodic, https://www.digitalapplied.com/blog/agent-memory-architectures-vector-graph-episodic 3. SurrealDB vs Neo4j: Key Differences - PuppyGraph, https://www.puppygraph.com/blog/surrealdb-vs-neo4j 4. Graph Database Explained: A Beginner's Guide for Developers - FalkorDB, https://www.falkordb.com/blog/graph-database-explained/ 5. neo4j-labs/create-context-graph: AI agents with graph based reasoning memory, scaffolded in seconds - GitHub, https://github.com/neo4j-labs/create-context-graph 6. Kuzu's Legacy and the New Wave of Embedded Graph Databases, https://gdotv.com/blog/kuzu-legacy-embedded-graph-database-landscape/ 7. KuzuDB or general GraphDBs - Offtopic - Julia Programming Language, https://discourse.julialang.org/t/kuzudb-or-general-graphdbs/133139 8. SurrealDB Benchmarks | Performance, https://surrealdb.com/benchmarks 9. Kùzu: Graph Learning Applications Need a Modern Graph Database Management System - OpenReview, https://openreview.net/pdf?id=Eg3MthXzeT 10. Documentation | Kuzu, https://kuzudb.github.io/docs/ 11. sqlite-graph - crates.io: Rust Package Registry, https://crates.io/crates/sqlite-graph 12. SQLite as a Graph Database: Recursive CTEs, Semantic Search ..., https://dev.to/rohansx/sqlite-as-a-graph-database-recursive-ctes-semantic-search-and-why-we-ditched-neo4j-1ai 13. TypeGraph: graph queries that compile to a single recursive CTE on Postgres/SQLite (no graph DB needed) : r/PostgreSQL - Reddit, https://www.reddit.com/r/PostgreSQL/comments/1tiszu2/typegraph_graph_queries_that_compile_to_a_single/ 14. Will the new SQLite graph capabilities supercharge the Logseq DB version? - Reddit, https://www.reddit.com/r/logseq/comments/1twpa5b/will_the_new_sqlite_graph_capabilities/ 15. Do you know a free/open source graph database that has these features? - Reddit, https://www.reddit.com/r/Database/comments/1lepbmq/do_you_know_a_freeopen_source_graph_database_that/ 16. LadybugDB/bugscope: sigmajs + react-force-graph-2d based visualizer for LadybugDB, https://github.com/LadybugDB/bugscope 17. LadybugDB FTS/VECTOR extension load hard-exits Node on Windows · Issue #1199 · abhigyanpatwari/GitNexus - GitHub, https://github.com/abhigyanpatwari/GitNexus/issues/1199 18. Explanation - Neo4j Agent Memory, https://neo4j.com/labs/agent-memory/explanation/ 19. Understanding the Three Memory Types - Neo4j Agent Memory, https://neo4j.com/labs/agent-memory/explanation/memory-types/ 20. Neo4j Agent Memory, https://neo4j.com/labs/agent-memory/ 21. LadybugDB for Edge Agent AI memory - Leanpub, https://leanpub.com/ladybugdb 22. A local-first project knowledge graph for AI coding agents - DEV Community, https://dev.to/heytalepazguato/a-local-first-project-knowledge-graph-for-ai-coding-agents-34b4 23. The Power of Properties in LadybugDB: Structs, Lists, Unions, and ..., https://ai.plainenglish.io/the-power-of-properties-in-ladybugdb-structs-lists-unions-and-the-view-from-semantic-spacetime-1f8efa0c307c 24. I built an open-source Desktop App that gives AI agents persistent memory (MCP Server + Chrome Extension sharing a local SQLite WAL database) : r/graphql - Reddit, https://www.reddit.com/r/graphql/comments/1tt5go2/i_built_an_opensource_desktop_app_that_gives_ai/ 25. Local models support for Microsoft's graphrag using ollama (llama3, mistral, gemma2 phi3)- LLM & Embedding extraction - GitHub, https://github.com/TheAiSingularity/graphrag-local-ollama 26. Running GraphRAG Locally with Neo4j and Ollama (Text format) - Sandeepgajula - Medium, https://sandeep14.medium.com/running-graphrag-locally-with-neo4j-and-ollama-text-format-371bf88b14b7 27. I built a fully local GraphRAG pipeline (0 GPUs needed) using Llama 3.1, Neo4j, and LangChain. Code included! : r/ollama - Reddit, https://www.reddit.com/r/ollama/comments/1s5wkyk/i_built_a_fully_local_graphrag_pipeline_0_gpus/ 28. Structured Outputs - Ollama's documentation, https://docs.ollama.com/capabilities/structured-outputs 29. GraphRAG with Qdrant and Neo4j, https://qdrant.tech/documentation/examples/graphrag-qdrant-neo4j/ 30. I built an open-source Desktop App that gives your AI persistent memory across all platforms (100% Local SQLite, Zero-Docker) : r/ollama - Reddit, https://www.reddit.com/r/ollama/comments/1tszsp5/i_built_an_opensource_desktop_app_that_gives_your/ 31. GitHub - MedGm/Ollie: A fast, Linux‑native desktop GUI for Ollama. Built with Tauri 2 (Rust) and React + TypeScript., https://github.com/MedGm/Ollie 32. Database interfaces — list of Rust libraries/crates // Lib.rs, https://lib.rs/database
