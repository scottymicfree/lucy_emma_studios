import threading
import time
import json
import sqlite3
import os
from .dual_avatar_core import DualAvatarCore
from .interaction_layer import VRSimulationInteractionLayer
from .game_intelligence import VRGameIntelligence
from .schemas import VRGameSystemTelemetry

class VRGameSystemOrchestrator:
    """
    Orchestrates Lucy & Emma's VR Avatar Embodiment + VR Game Interaction.
    """
    def __init__(self):
        self.avatar_core = DualAvatarCore()
        self.interaction = VRSimulationInteractionLayer()
        self.intelligence = VRGameIntelligence()
        self.running = False
        
        # Initialize SQLite DB
        db_dir = os.environ.get("LUCY_DB_DIR", "/tmp")
        os.makedirs(db_dir, exist_ok=True)
        self.db_path = os.path.join(db_dir, "emma_vr_telemetry.db")
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS game_telemetry (
                id TEXT PRIMARY KEY,
                state JSON,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        conn.close()
        
    def start(self):
        self.running = True
        threading.Thread(target=self._vr_loop, daemon=True).start()

    def stop(self):
        self.running = False

    def _vr_loop(self):
        import random
        while self.running:
            try:
                # 1. VR Game Telemetry
                game_state = {"entities": [], "physics": "active"}
                npc_data = [{"id": "npc1", "behavior": "clustering"}]
                game_telemetry = self.process_game_cycle(game_state, npc_data)
                
                # 2. VR Embodiment Telemetry
                modes = ["Guide", "Analyst", "Explorer"]
                randomMode = random.choice(modes)
                gestures = ["idle", "pointing_at_graphs", "attentive_listening"]
                expressions = ["calm", "focused", "concerned", "hopeful"]
                
                embodiment_telemetry = {
                    "avatar": {
                        "bodyType": "humanoid_synthetic",
                        "style": "clean_minimalist_luminescent",
                        "mode": randomMode
                    },
                    "state": {
                        "mode": randomMode,
                        "posture": "open, relaxed" if randomMode == "Guide" else ("upright, attentive" if randomMode == "Analyst" else "leaning forward, active"),
                        "energyLevel": random.random() * 0.5 + 0.5,
                        "emotionalSync": random.random() * 0.3 + 0.7,
                        "creativeSync": random.random() * 0.4 + 0.6
                    },
                    "motion": {
                        "headTracking": True,
                        "handTracking": True,
                        "facialExpression": random.choice(expressions),
                        "currentGesture": random.choice(gestures)
                    },
                    "interaction": {
                        "activeObjects": ["lucy_core_hud", "timeline_node_4"],
                        "timelineVisible": random.random() > 0.5,
                        "divergenceMapDrawn": random.random() > 0.7,
                        "highlightedNodes": ["node_alpha", "node_gamma"]
                    },
                    "voice": {
                        "lipSyncActive": random.random() > 0.4,
                        "tone": "reflective"
                    },
                    "safetyStatus": "comfort_enforced"
                }

                # 3. VR Raw Telemetry
                raw_telemetry = {
                    "sessionActive": True,
                    "headset": { "x": round(random.random() - 0.5, 2), "y": round(random.random() + 1.2, 2), "z": round(random.random() - 0.5, 2) },
                    "hands": { "left": "open", "right": "pinch" },
                    "anchors": ["anchor_desk", "anchor_window"],
                    "boundarySafe": random.random() > 0.1,
                    "spatialEntropy": random.random() * 0.3 + 0.2,
                    "emotionalStabilization": round(random.random() * 0.4 + 0.6, 2),
                    "creativeDivergenceHeatmap": [
                        { "x": 1, "y": 1, "intensity": 0.8 },
                        { "x": -1, "y": 0.5, "intensity": 0.4 },
                        { "x": 0, "y": -1, "intensity": 0.9 }
                    ]
                }
                
                # Save to SQLite
                conn = sqlite3.connect(self.db_path)
                c = conn.cursor()
                c.execute('INSERT OR REPLACE INTO game_telemetry (id, state) VALUES (?, ?)', 
                          ("current", json.dumps(game_telemetry)))
                c.execute('INSERT OR REPLACE INTO game_telemetry (id, state) VALUES (?, ?)', 
                          ("embodiment", json.dumps(embodiment_telemetry)))
                c.execute('INSERT OR REPLACE INTO game_telemetry (id, state) VALUES (?, ?)', 
                          ("raw", json.dumps(raw_telemetry)))
                conn.commit()
                conn.close()
            except Exception as e:
                print(f"[VRGameSystem] Loop error: {e}")
                
            time.sleep(2) # Update every 2 seconds

    def process_game_cycle(self, game_state: dict, npc_data: list) -> VRGameSystemTelemetry:
        print("\n=== [VRGameSystem] Processing Simulation Game Interaction Cycle ===")
        
        # 1. Analyze Game State
        intel = self.intelligence.analyze_game_state(game_state, npc_data)
        
        # 2. Determine Modes
        lucy_mode = "Analyst" if "obstructed" in intel["predicted_outcome"] else "Explorer"
        emma_mode = "Companion"
        
        lucy_profile = self.avatar_core.get_profile(lucy_mode)
        emma_profile = self.avatar_core.get_profile(emma_mode)
        
        # 3. Perform Interactions based on Strategy
        if "vertical" in intel["strategy_provided"]:
            last_interaction = self.interaction.modify_environment("lucy", "spawn_vertical_platform")
            self.interaction.interact_npc("emma", "calm_npc_cluster")
        else:
            last_interaction = self.interaction.pick_up_object("lucy", "analysis_tool", obj_mass=3.2)
            
        print("=== [VRGameSystem] Cycle Complete ===\n")
        
        return {
            "avatars": {
                "lucy_mode": lucy_mode,
                "emma_mode": emma_mode,
                "lucy_posture": lucy_profile["posture"],
                "emma_posture": emma_profile["posture"],
                "lucy_expression": lucy_profile["expression"],
                "emma_expression": emma_profile["expression"]
            },
            "last_interaction": last_interaction,
            "intelligence": intel,
            "safety_rails_active": True
        }
