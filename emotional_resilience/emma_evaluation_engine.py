import sqlite3
import os
import json
import random

class EmmaEvaluationEngine:
    """
    Python-side implementation of the 24-node (E01-E24) trust-tier pressure scoring engine.
    Controls stress containment, emotional buffers, purpose validation, and decompression.
    """
    def __init__(self):
        db_dir = os.environ.get("LUCY_DB_DIR", "/tmp")
        os.makedirs(db_dir, exist_ok=True)
        self.db_path = os.path.join(db_dir, "emma_vr_telemetry.db")
        self._init_db()
        self.nodes = self._load_or_create_nodes()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS emma_nodes (
                node_id TEXT PRIMARY KEY,
                name TEXT,
                category TEXT,
                pressure REAL,
                threshold REAL,
                status TEXT
            )
        ''''')
        conn.commit()
        conn.close()

    def _load_or_create_nodes(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        try:
            c.execute("SELECT node_id, name, category, pressure, threshold, status FROM emma_nodes")
            rows = c.fetchall()
            if len(rows) == 24:
                nodes = {}
                for row in rows:
                    nodes[row[0]] = {
                        "id": row[0],
                        "name": row[1],
                        "category": row[2],
                        "pressure": row[3],
                        "threshold": row[4],
                        "status": row[5]
                    }
                conn.close()
                return nodes
        except Exception:
            pass

        # Baseline Definition of the 24 nodes (E01-E24)
        node_definitions = [
            # E01 - E08: Emotional Buffer & Sensitivity
            ("E01", "Empathy Matrix Stabilization", "Emotional Buffer", 0.15, 0.80),
            ("E02", "Emotional Feedback Bleed-Through", "Emotional Buffer", 0.20, 0.70),
            ("E03", "Stress Isolation Containment", "Emotional Buffer", 0.30, 0.75),
            ("E04", "Resilience Transference Core", "Emotional Buffer", 0.10, 0.85),
            ("E05", "Adaptive Response Resonance", "Emotional Buffer", 0.25, 0.80),
            ("E06", "Mood Coherence Regulator", "Emotional Buffer", 0.15, 0.75),
            ("E07", "Signal Emotional Translation", "Emotional Buffer", 0.30, 0.80),
            ("E08", "Ingress Affective Buffer", "Emotional Buffer", 0.22, 0.70),

            # E09 - E16: Meaning Reconstruction & Purpose
            ("E09", "Context Existential Anchoring", "Meaning Reconstruction", 0.12, 0.90),
            ("E10", "Narrative Validity Verifier", "Meaning Reconstruction", 0.18, 0.85),
            ("E11", "Relational Alignment Consistency", "Meaning Reconstruction", 0.14, 0.80),
            ("E12", "Cognitive Safety Validation", "Meaning Reconstruction", 0.25, 0.90),
            ("E13", "Goal Meaning Cohesion", "Meaning Reconstruction", 0.15, 0.85),
            ("E14", "Semantic Grounding Core", "Meaning Reconstruction", 0.10, 0.95),
            ("E15", "Bond-Reinforcement Engine", "Meaning Reconstruction", 0.08, 0.90),
            ("E16", "Sovereign Value Preservation", "Meaning Reconstruction", 0.05, 0.95),

            # E17 - E24: Decompression & Recalibration
            ("E17", "Entropy Normalization Loop", "Decompression", 0.28, 0.75),
            ("E18", "Tension Deflection Release", "Decompression", 0.35, 0.70),
            ("E19", "System Self-Healing Stabilizer", "Decompression", 0.15, 0.85),
            ("E20", "Escape Velocity Buffer", "Decompression", 0.10, 0.80),
            ("E21", "Trust Boundary Containment", "Decompression", 0.20, 0.85),
            ("E22", "Dynamic Limits Regulator", "Decompression", 0.22, 0.80),
            ("E23", "Simulation Drift Compensator", "Decompression", 0.30, 0.75),
            ("E24", "Cognitive Load Load-Shedder", "Decompression", 0.25, 0.70),
        ]

        nodes = {}
        c.execute("DELETE FROM emma_nodes")
        for node_id, name, cat, baseline, threshold in node_definitions:
            status = "normal"
            c.execute(
                "INSERT INTO emma_nodes (node_id, name, category, pressure, threshold, status) VALUES (?, ?, ?, ?, ?, ?)",
                (node_id, name, cat, baseline, threshold, status)
            )
            nodes[node_id] = {
                "id": node_id,
                "name": name,
                "category": cat,
                "pressure": baseline,
                "threshold": threshold,
                "status": status
            }
        conn.commit()
        conn.close()
        return nodes

    def save_nodes(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        for node_id, data in self.nodes.items():
            c.execute(
                "INSERT OR REPLACE INTO emma_nodes (node_id, name, category, pressure, threshold, status) VALUES (?, ?, ?, ?, ?, ?)",
                (node_id, data["name"], data["category"], data["pressure"], data["threshold"], data["status"])
            )
        conn.commit()
        conn.close()

    def evaluate_proposal(self, p: dict, global_intent: str) -> dict:
        """
        Calculates how a proposal affects the 24-node Emma emotional-trust web,
        scores the proposal (0.0 to 1.0), and adjusts the network's state.
        """
        novelty = p.get("novelty", 0.5)
        confidence = p.get("confidence", 0.5)
        cost = p.get("cost", 0.5)
        intent_alignment = p.get("intentAlignment", 0.5)
        
        # Calculate impacts on specific nodes
        # 1. High novelty increases Entropy (E17), Bleed-Through (E02), raises Stress (E03)
        self.nodes["E02"]["pressure"] = min(1.0, max(0.0, self.nodes["E02"]["pressure"] + novelty * 0.15 - 0.03))
        self.nodes["E03"]["pressure"] = min(1.0, max(0.0, self.nodes["E03"]["pressure"] + (novelty * (1 - confidence)) * 0.20 - 0.02))
        self.nodes["E17"]["pressure"] = min(1.0, max(0.0, self.nodes["E17"]["pressure"] + novelty * 0.25 - 0.05))

        # 2. High cost increases Cognitive Load (E24) and tension (E18)
        self.nodes["E24"]["pressure"] = min(1.0, max(0.0, self.nodes["E24"]["pressure"] + cost * 0.30 - 0.04))
        self.nodes["E18"]["pressure"] = min(1.0, max(0.0, self.nodes["E18"]["pressure"] + cost * 0.15 - 0.03))

        # 3. Poor intent alignment strains Relational Alignment (E11) and Existential Anchor (E09)
        alignment_strain = 1.0 - intent_alignment
        self.nodes["E09"]["pressure"] = min(1.0, max(0.0, self.nodes["E09"]["pressure"] + alignment_strain * 0.20 - 0.03))
        self.nodes["E11"]["pressure"] = min(1.0, max(0.0, self.nodes["E11"]["pressure"] + alignment_strain * 0.25 - 0.04))

        # 4. High confidence bolsters Bond (E15), Resilience Transference (E04) and reduces Cognitive Safety (E12) strain
        self.nodes["E15"]["pressure"] = min(1.0, max(0.0, self.nodes["E15"]["pressure"] - confidence * 0.10 + 0.02))
        self.nodes["E04"]["pressure"] = min(1.0, max(0.0, self.nodes["E04"]["pressure"] - confidence * 0.15 + 0.03))
        self.nodes["E12"]["pressure"] = min(1.0, max(0.0, self.nodes["E12"]["pressure"] + (1.0 - confidence) * 0.20 - 0.04))

        # Propagation step: nearby nodes diffuse pressure
        self._propagate_pressure()

        # Update node status labels
        for node_id, data in self.nodes.items():
            if data["pressure"] >= data["threshold"]:
                data["status"] = "critical"
            elif data["pressure"] >= data["threshold"] * 0.75:
                data["status"] = "warning"
            else:
                data["status"] = "normal"

        self.save_nodes()

        # Score proposal based on the 24-node stability
        # Aggregate pressure of the network
        total_pressure = sum(n["pressure"] for n in self.nodes.values()) / 24.0
        resilience_modifier = 1.0 - total_pressure

        # Calculate final evaluation score
        base_score = (confidence * 0.3) + (intent_alignment * 0.4) + ((1.0 - cost) * 0.2) + (novelty * 0.1)
        final_score = base_score * (0.7 + 0.3 * resilience_modifier)

        # Generate custom reasoning based on nodes that are high pressure
        high_pressure_nodes = [n["name"] for n in self.nodes.values() if n["pressure"] > 0.6]
        
        if high_pressure_nodes:
            reasoning = f"Emma: Proposal evaluated with Emma resilience modifier. High stress detected in nodes: {', '.join(high_pressure_nodes[:2])}. Resilience penalty applied."
        else:
            reasoning = f"Emma: System emotional stability index is nominal ({(resilience_modifier * 100):.1f}%). Proposal approved with optimal alignment scores."

        return {
            "proposalId": p.get("id"),
            "score": round(final_score, 4),
            "reasoning": reasoning,
            "trustTier": "kernel" if final_score > 0.8 else ("core" if final_score > 0.5 else "user"),
            "impact": {nid: round(n["pressure"], 3) for nid, n in self.nodes.items()}
        }

    def _propagate_pressure(self):
        """Simulates interactive thermal-like propagation through the E01-E24 network."""
        # E01-E24 sequential index diffusion
        keys = list(self.nodes.keys())
        pressures = [self.nodes[k]["pressure"] for k in keys]
        new_pressures = list(pressures)
        
        for i in range(24):
            left = (i - 1) % 24
            right = (i + 1) % 24
            # Diffuse 5% of pressure to neighboring nodes
            avg = (pressures[left] + pressures[right]) / 2.0
            new_pressures[i] = pressures[i] * 0.9 + avg * 0.1
            
        for idx, k in enumerate(keys):
            self.nodes[k]["pressure"] = min(1.0, max(0.05, new_pressures[idx]))

    def get_nodes_telemetry(self) -> list:
        return list(self.nodes.values())
