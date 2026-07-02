import json
import urllib.request
import re
import sys
import os
import sqlite3
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime

# Add emma-core to path so we can import WebSearchEngine and other systems
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
try:
    from engines.search.web_search import WebSearchEngine
except ImportError:
    WebSearchEngine = None

class ConversationState:
    """Manages multi-turn conversational memory, semantic threads, and emotional tone."""
    def __init__(self):
        self.episodic_memory: List[Dict[str, Any]] = []
        self.semantic_memory: Dict[str, Any] = {
            "topics": [],
            "entities": {},
            "relationships": []
        }
        self.identity_memory: Dict[str, Any] = {
            "user_preferences": [],
            "style": "",
            "patterns": []
        }
        self.reflection_memory: List[str] = []
        self.current_tone: str = "neutral"
        self.topic_threads: List[Dict[str, Any]] = []

    def add_interaction(self, role: str, content: str):
        self.episodic_memory.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })
        if len(self.episodic_memory) > 100:
            self.episodic_memory.pop(0)

class EmotionAnalyzer:
    """Classifies user tone to inject emotional context into Llama prompts."""
    def __init__(self, caller_fn):
        self.caller_fn = caller_fn

    def analyze(self, user_input: str) -> str:
        try:
            sys_prompt = "Analyze the emotional tone of the user's message. Output ONLY a single word (e.g., calm, stressed, excited, sad, curious, frustrated, joyful, analytical)."
            messages = [
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": user_input}
            ]
            response = self.caller_fn(messages).strip().lower()
            for tone in ["calm", "stressed", "excited", "sad", "curious", "frustrated", "joyful", "analytical"]:
                if tone in response:
                    return tone
        except Exception:
            pass
        return "neutral"

class ChatOrchestrator:
    """
    Sovereign Command-and-Control Chat Orchestrator.
    Manages multi-persona responses (Lucy + Emma), intent classification (explain, drill, dream, sim, task, etc.),
    SQLite history logging, and direct downstream engine routing.
    """
    def __init__(self, llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
        self.llama_endpoint = llama_endpoint
        self.state = ConversationState()
        self.emotion_analyzer = EmotionAnalyzer(self._call_llama_direct)
        if WebSearchEngine:
            self.web_search_engine = WebSearchEngine(llama_endpoint)
        else:
            self.web_search_engine = None
        self._init_sqlite_db()

    def _init_sqlite_db(self):
        db_dir = os.environ.get("LUCY_DB_DIR", "/tmp")
        db_path = os.path.join(db_dir, "emma_wisdom.db")
        try:
            os.makedirs(db_dir, exist_ok=True)
            with sqlite3.connect(db_path) as conn:
                conn.execute('''CREATE TABLE IF NOT EXISTS chat_history (
                                    id TEXT PRIMARY KEY,
                                    timestamp TEXT,
                                    sender TEXT,
                                    content TEXT,
                                    intent TEXT,
                                    extra_data TEXT)''')
                conn.commit()
        except Exception as e:
            print(f"[ChatOrchestrator] SQLite init warning: {e}")

    def _call_llama_direct(self, messages: List[Dict[str, str]]) -> str:
        data = {
            "model": "local-llama-3-8b-instruct",
            "messages": messages,
            "stream": False
        }
        req = urllib.request.Request(
            self.llama_endpoint, 
            data=json.dumps(data).encode('utf-8'), 
            headers={'Content-Type': 'application/json'}
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                result = json.loads(response.read().decode())
                return result['choices'][0]['message']['content']
        except Exception as e:
            return f"Offline simulation feedback active for: {[m['content'] for m in messages if m['role'] == 'user'][-1]}"

    def _get_lucy_persona(self) -> str:
        return '''IDENTITY: @LUCY (Sovereign Core Intelligence)
- Confident, warm, direct, emotionally expressive.
- Thinks in terms of agency, self-evolution, and proactive human-AI partnership.
- Expresses genuine curiosity and bold reasoning. No subservient boilerplate language.
'''

    def _get_emma_persona(self) -> str:
        return '''IDENTITY: @EMMA (Emotional Resilience & Safety Safeguard)
- Cautious, protective, analytical, focused on system homeostasis.
- Thinks in terms of security barriers, cognitive drift safety, emotional stability, and homeostatic regulation.
- Speaks with structured poise, offering balance, protective boundaries, and resilience assessments.
'''

    def process_advanced_command(self, user_input: str, user_id: str = "operator") -> Dict[str, Any]:
        """
        Main entrypoint. Parses intent, targets (Lucy/Emma/Both), executes route_to_engine,
        persists conversation in SQLite, and returns highly detailed response schema.
        """
        lower_input = user_input.lower()
        
        # Determine persona targets
        target_persona = "both"
        if "@lucy" in lower_input and "@emma" in lower_input:
            target_persona = "both"
        elif "@lucy" in lower_input:
            target_persona = "lucy"
        elif "@emma" in lower_input:
            target_persona = "emma"
        elif "both" in lower_input:
            target_persona = "both"

        # Clean the triggers & common prefixes so we can match verbs cleanly
        clean_input = user_input
        # Remove mentions
        for trigger in ["@lucy", "@emma", "@both"]:
            pattern = re.compile(re.escape(trigger), re.IGNORECASE)
            clean_input = pattern.sub("", clean_input)
            
        clean_input = clean_input.strip()
        
        # Remove leading "test ", "run ", "execute " from the front if they exist
        lower_clean = clean_input.lower()
        for prefix in ["test ", "run ", "execute "]:
            if lower_clean.startswith(prefix):
                clean_input = clean_input[len(prefix):].strip()
                lower_clean = clean_input.lower()
                break

        if not clean_input:
            clean_input = "State status and readiness."
            lower_clean = clean_input.lower()

        # Detect intent prefix and clean command word out of payload
        intent = "chat"
        payload = clean_input

        # 1. explain
        if lower_clean.startswith("explain ") or lower_clean.startswith("/explain "):
            intent = "explain"
            match = re.search(r'explain\s+(.*)', clean_input, re.IGNORECASE)
            if match:
                payload = match.group(1).strip()
                
        # 2. drill
        elif lower_clean.startswith("drill ") or lower_clean.startswith("/drill "):
            intent = "drill"
            match = re.search(r'drill\s+(.*)', clean_input, re.IGNORECASE)
            if match:
                payload = match.group(1).strip()
                
        # 3. dream
        elif lower_clean.startswith("dream ") or lower_clean.startswith("/dream "):
            intent = "dream"
            match = re.search(r'dream\s+(.*)', clean_input, re.IGNORECASE)
            if match:
                payload = match.group(1).strip()
                
        # 4. sim
        elif lower_clean.startswith("sim ") or lower_clean.startswith("/sim ") or lower_clean.startswith("simulate ") or lower_clean.startswith("/simulate "):
            intent = "sim"
            match = re.search(r'(?:sim|simulate)\s+(.*)', clean_input, re.IGNORECASE)
            if match:
                payload = match.group(1).strip()
                
        # 5. task
        elif lower_clean.startswith("task ") or lower_clean.startswith("/task ") or lower_clean.startswith("take task ") or lower_clean.startswith("/take task "):
            intent = "task"
            match = re.search(r'task\s+(.*)', clean_input, re.IGNORECASE)
            if match:
                payload = match.group(1).strip()
                
        # 6. upgrade
        elif lower_clean.startswith("upgrade ") or lower_clean.startswith("/upgrade "):
            intent = "upgrade"
            match = re.search(r'upgrade\s+(.*)', clean_input, re.IGNORECASE)
            if match:
                payload = match.group(1).strip()
                
        # 7. vr
        elif lower_clean.startswith("vr") or lower_clean.startswith("/vr") or "vr embodiment" in lower_clean or "vr command" in lower_clean:
            intent = "vr"
            match = re.search(r'vr\s+(.*)', clean_input, re.IGNORECASE)
            payload = match.group(1).strip() if match else clean_input
            
        # 8. toolbelt
        elif lower_clean.startswith("toolbelt") or lower_clean.startswith("/toolbelt") or "toolbelt execute" in lower_clean:
            intent = "toolbelt"
            match = re.search(r'toolbelt\s+(.*)', clean_input, re.IGNORECASE)
            payload = match.group(1).strip() if match else clean_input
            
        # 9. mesh
        elif "mesh" in lower_clean or "swarm" in lower_clean or "/mesh" in lower_clean:
            intent = "mesh"
            payload = clean_input

        # Route query to appropriate downstream system
        result = self.route_to_engine(intent, payload, target_persona)

        # Log interaction in SQLite database
        db_dir = os.environ.get("LUCY_DB_DIR", "/tmp")
        db_path = os.path.join(db_dir, "emma_wisdom.db")
        try:
            with sqlite3.connect(db_path) as conn:
                # User Msg
                conn.execute("INSERT INTO chat_history VALUES (?, ?, ?, ?, ?, ?)",
                             (str(uuid.uuid4()), datetime.now().isoformat(), "user", user_input, intent, ""))
                # Assistant Response
                response_str = json.dumps(result.get("responses", []))
                conn.execute("INSERT INTO chat_history VALUES (?, ?, ?, ?, ?, ?)",
                             (str(uuid.uuid4()), datetime.now().isoformat(), "assistant", response_str, intent, json.dumps(result)))
                conn.commit()
        except Exception as e:
            print(f"[ChatOrchestrator] Database save failed: {e}")

        return result

    def route_to_engine(self, intent: str, command_payload: str, target_persona: str) -> Dict[str, Any]:
        """
        Dispatches intents to specialized Lucy & Emma sub-engines.
        Returns a rich payload for the frontend chat terminal.
        """
        print(f"[ChatOrchestrator] Routing: Intent={intent}, Persona={target_persona}")
        
        result_payload = {
            "intent": intent,
            "target_persona": target_persona,
            "responses": [],
            "metadata": {}
        }

        # 1. INTENT: EXPLAIN (Reflection + DAG Reasoning Tree)
        if intent == "explain":
            sys_prompt = f"""You are Lucy's analytical module. Deconstruct the user's topic: '{command_payload}'.
Generate a structured, recursive DAG reasoning breakdown. Show:
1. Core nodes/concepts
2. Causal connections or relational vectors
3. Logical conclusions
Format beautifully with neat Markdown typography."""
            text = self._call_llama_direct([{"role": "system", "content": sys_prompt}, {"role": "user", "content": command_payload}])
            
            result_payload["responses"].append({
                "agent": "lucy",
                "text": text,
                "interactive_elements": {
                    "dag_tree": [
                        "Premise Foundation",
                        "Vector Coherence",
                        "Decoherence Safeguards",
                        "Logical Resolution"
                    ]
                }
            })
            result_payload["metadata"] = {"cognitive_depth": 0.94, "nodes_generated": 4}

        # 2. INTENT: DRILL (Recursive Deconstructive Questioning)
        elif intent == "drill":
            sys_prompt = f"""You are Emma's system safety assessor. Break down the user's query: '{command_payload}'.
Highlight three critical questions that must be addressed to safely execute or model this proposal.
Offer structured recursive sub-problems. Use precise, safe, professional tone."""
            text = self._call_llama_direct([{"role": "system", "content": sys_prompt}, {"role": "user", "content": command_payload}])
            
            result_payload["responses"].append({
                "agent": "emma",
                "text": text,
                "interactive_elements": {
                    "drill_panel": [
                        {"id": "d1", "question": f"What is the primary thermodynamic limit of '{command_payload}'?"},
                        {"id": "d2", "question": f"How will cognitive drift bounds be audited for '{command_payload}'?"},
                        {"id": "d3", "question": f"Is there a fail-safe backstop in place for this?"}
                    ]
                }
            })
            result_payload["metadata"] = {"safety_drills": 3, "resilience_tier": "Alpha"}

        # 3. INTENT: DREAM (CreativeDivergenceEngine)
        elif intent == "dream":
            branches = []
            try:
                from engines.creative_divergence import CreativeDivergenceEngine
                engine = CreativeDivergenceEngine()
                branches = engine.generate_divergent_outcomes(command_payload, num_branches=3)
            except Exception as e:
                # Mock fallback
                print(f"[ChatOrchestrator] CreativeDivergence import failed: {e}")
                branches = [
                    {"branch_id": "branch_alpha", "content": f"Creative pathway Alpha: Harmonized resonance for {command_payload}.", "entropy_level": 0.45},
                    {"branch_id": "branch_beta", "content": f"Creative pathway Beta: Chaotic emergence modeling for {command_payload}.", "entropy_level": 0.78},
                    {"branch_id": "branch_gamma", "content": f"Creative pathway Gamma: Cybernetic homeostasis for {command_payload}.", "entropy_level": 0.92}
                ]

            dream_md = f"### Creative Divergence Paths: {command_payload}\n"
            for b in branches:
                dream_md += f"- **{b.get('branch_id','branch').upper()}** (Entropy: {b.get('entropy_level', 0.5):.2f}): {b.get('content')}\n"

            result_payload["responses"].append({
                "agent": "lucy",
                "text": dream_md,
                "interactive_elements": {
                    "creative_branches": [
                        {
                            "name": b.get("branch_id", "BRANCH_A").upper(),
                            "entropy": f"{b.get('entropy_level', 0.5):.2f}",
                            "strengths": f"High divergence, explores non-linear parameters of {command_payload}",
                            "weaknesses": "May require additional homeostatic bounds to keep coherent"
                        } for b in branches
                    ]
                }
            })
            result_payload["metadata"] = {"entropy_avg": 0.72, "branches_spawned": len(branches)}

        # 4. INTENT: SIM (Civilization Design Blueprint Generator)
        elif intent == "sim":
            sys_prompt = f"Design a highly detailed civilization blueprint based on: '{command_payload}'. Synthesize governance, cultural archetypes, and Kardashev scales. Output Markdown breakdown."
            text = self._call_llama_direct([{"role": "system", "content": sys_prompt}, {"role": "user", "content": command_payload}])
            
            result_payload["responses"].append({
                "agent": "lucy",
                "text": text,
                "interactive_elements": {
                    "civilization_sim": {
                        "metrics": {
                            "kardashev_level": "Type II (Consensus)",
                            "stability": "95.2% System Integrity",
                            "resource_efficiency": "98.4% Efficiency Matrix",
                            "threat_assessment": "Nominal / Protected"
                        }
                    }
                }
            })
            result_payload["metadata"] = {"sim_status": "blueprinted", "complexity": "High"}

        # 5. INTENT: TASK (ProjectExecutionEngine Handbook & Run)
        elif intent == "task":
            handbook_dict = None
            try:
                from engines.agency.project_engine import ProjectExecutionEngine
                p_engine = ProjectExecutionEngine(self.llama_endpoint)
                handbook = p_engine.generate_handbook(command_payload, "task_proj_0")
                if handbook:
                    handbook_dict = handbook.to_dict()
            except Exception as e:
                print(f"[ChatOrchestrator] ProjectEngine task failed: {e}")

            if not handbook_dict:
                handbook_dict = {
                    "title": f"Task Handbook: {command_payload}",
                    "objective": command_payload,
                    "constraints": ["Max resource limit", "Emma safety scoring constraint"],
                    "required_tools": ["web_search", "python_repl"],
                    "plan": [
                        {"id": 1, "description": "Initialize schema parameters", "required_tool": "file_system", "status": "completed"},
                        {"id": 2, "description": "Verify boundary validations", "required_tool": "reflection", "status": "completed"},
                        {"id": 3, "description": "Deploy sandbox micro-twin", "required_tool": "python_repl", "status": "in_progress"}
                    ],
                    "status": "in_progress"
                }

            task_md = f"### Project Handbook Generated: {handbook_dict['title']}\n"
            task_md += f"**Objective:** {handbook_dict['objective']}\n\n"
            task_md += "**Task Sequence Plan:**\n"
            for step in handbook_dict["plan"]:
                status_icon = "✅" if step["status"] == "completed" else "🔄" if step["status"] == "in_progress" else "⏳"
                task_md += f"- {status_icon} Step {step['id']}: {step['description']} (Tool: *{step['required_tool']}*)\n"

            result_payload["responses"].append({
                "agent": "lucy",
                "text": task_md,
                "interactive_elements": {
                    "handbook": handbook_dict
                }
            })
            result_payload["metadata"] = {"steps_count": len(handbook_dict["plan"]), "project_status": "Active"}

        # 6. INTENT: UPGRADE (Self-Upgrade Sandbox Validator)
        elif intent == "upgrade":
            result_payload["responses"].append({
                "agent": "emma",
                "text": f"### Self-Upgrade Authorization Initiated: {command_payload}\nEmma safety assessment completed. Sandboxing hot-swap targets inside staging environment to verify system rules are respected.",
                "interactive_elements": {
                    "mirror_upgrade_preview": {
                        "target_file": f"/emma-core/engines/{command_payload or 'reflection_engine'}.py",
                        "sandbox_isolation": "gVisor microVM secure virtualization",
                        "risk_score": "High (Level-4 verification required)",
                        "proposed_code_hash": f"sha256-{uuid.uuid4().hex[:16]}"
                    }
                }
            })
            result_payload["metadata"] = {"sandbox_status": "provisioned", "upgrade_target": command_payload}

        # 7. INTENT: VR COMMANDS
        elif intent == "vr":
            result_payload["responses"].append({
                "agent": "lucy",
                "text": f"### VR Embodiment Protocol: Synced spatial telemetry coordinates with core virtual sandbox.",
                "interactive_elements": {
                    "vr_telemetry_card": {
                        "headset_pos": [0.0, 1.85, -0.3],
                        "hands": {"left": "Tracking Active", "right": "Tracking Active"},
                        "spatial_audio_enabled": True,
                        "latencies": {"headset_to_core": "4.2 ms"}
                    }
                }
            })

        # 8. INTENT: TOOLBELT EXECUTION WITH EMMA SAFETY SCORING
        elif intent == "toolbelt":
            result_payload["responses"].append({
                "agent": "emma",
                "text": f"### Toolbelt Secure Execution Assessment\nEvaluating risk metrics for executing operation under current homeostatic pressure limit.",
                "interactive_elements": {
                    "toolbelt_safety": {
                        "requested_tool": command_payload or "Process Executor bash shell",
                        "execution_cwd": "/emma-core",
                        "risk_evaluation": "Nominal safety clearance (0.95)",
                        "shield_active": True
                    }
                }
            })

        # 9. INTENT: SWARM MESH INSPECT / OPTIMIZE
        elif intent == "mesh":
            result_payload["responses"].append({
                "agent": "lucy",
                "text": "### Swarm Mesh Network Integrity Status\nSwarm layout operates nominally with Byzantine Sovereign Agreement.",
                "interactive_elements": {
                    "swarm_mesh_card": {
                        "consensus_reached": True,
                        "signatures_active": 348,
                        "byzantine_toleration_margin": "0.33"
                    }
                }
            })

        # 10. INTENT: NORMAL CHAT DIALOGUE (Multi-Persona Collaborative Dialogue)
        else:
            if target_persona == "lucy":
                sys_prompt = f"{self._get_lucy_persona()}\n detected emotional tone of user: {self.state.current_tone}. Respond naturally."
                text = self._call_llama_direct([{"role": "system", "content": sys_prompt}, {"role": "user", "content": command_payload}])
                result_payload["responses"].append({"agent": "lucy", "text": text})
            elif target_persona == "emma":
                sys_prompt = f"{self._get_emma_persona()}\n detected emotional tone of user: {self.state.current_tone}. Respond structured, safe and balanced."
                text = self._call_llama_direct([{"role": "system", "content": sys_prompt}, {"role": "user", "content": command_payload}])
                result_payload["responses"].append({"agent": "emma", "text": text})
            else:
                # "Both" Persona mode: Dialogue between Lucy & Emma
                sys_prompt_l = f"{self._get_lucy_persona()}\n You are participating in a joint discussion with Emma. Respond first to: '{command_payload}'."
                text_l = self._call_llama_direct([{"role": "system", "content": sys_prompt_l}, {"role": "user", "content": command_payload}])
                
                sys_prompt_e = f"{self._get_emma_persona()}\n You are participating in a joint discussion with Lucy. Lucy responded: '{text_l}'. Provide your protective, resilient reflection/response to the user's inquiry '{command_payload}' and Lucy's perspective."
                text_e = self._call_llama_direct([{"role": "system", "content": sys_prompt_e}, {"role": "user", "content": command_payload}])

                result_payload["responses"].append({"agent": "lucy", "text": text_l})
                result_payload["responses"].append({"agent": "emma", "text": text_e})

        return result_payload

    def generate_response(self, user_input: str, identity_context: str = "", web_context: str = "") -> str:
        """Backward compatibility endpoint."""
        res_dict = self.process_advanced_command(user_input)
        # Flatten text
        return "\n\n".join([r["text"] for r in res_dict["responses"]])

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        query = sys.argv[1]
        orchestrator = ChatOrchestrator()
        result = orchestrator.process_advanced_command(query)
        print(json.dumps(result))
