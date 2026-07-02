import time
import threading
import json
from typing import Dict, Any, List
from engines.swarm.mesh_protocol import SwarmMeshEngine
from engines.swarm.delegation import TaskDelegationEngine
from engines.research.question_generator import ResearchQuestionGenerator
from engines.research.report_generator import ResearchReportGenerator
from engines.research.improvement import ResearchImprovementEngine

class ResearchOrchestrator:
    def __init__(self, mesh: SwarmMeshEngine, delegation: TaskDelegationEngine):
        self.mesh = mesh
        self.delegation = delegation
        self.running = False
        self.question_generator = ResearchQuestionGenerator(mesh)
        self.report_generator = ResearchReportGenerator(mesh)
        self.improvement_engine = ResearchImprovementEngine(mesh)
        self.active_cycles = {}

    def start(self):
        self.running = True
        threading.Thread(target=self._research_loop, daemon=True).start()

    def stop(self):
        self.running = False

    def _research_loop(self):
        while self.running:
            if len(self.active_cycles) < 2:
                questions = self.question_generator.generate_questions()
                for q in questions[:1]:
                    self.launch_research_cycle(q)
            time.sleep(3600)

    def launch_research_cycle(self, question: str):
        cycle_id = f"res_{int(time.time())}"
        self.active_cycles[cycle_id] = {"question": question, "status": "planning", "findings": []}
        
        subtasks = [
            {"subtask": f"Discover sources for: {question}", "assigned_role": "discovery_agent"},
            {"subtask": f"Analyze findings for: {question}", "assigned_role": "analysis_agent"},
            {"subtask": f"Verify facts for: {question}", "assigned_role": "verification_agent"},
            {"subtask": f"Synthesize report for: {question}", "assigned_role": "synthesis_agent"}
        ]
        
        for idx, st in enumerate(subtasks):
            task_id = f"{cycle_id}_step_{idx}"
            self.delegation.announce_task(task_id, st)

    def consolidate_results(self, cycle_id: str, findings: List[Dict[str, Any]]):
        if cycle_id in self.active_cycles:
            self.active_cycles[cycle_id]["findings"].extend(findings)
            if len(self.active_cycles[cycle_id]["findings"]) >= 3:
                self.active_cycles[cycle_id]["status"] = "synthesizing"
                report = self.report_generator.generate_report(self.active_cycles[cycle_id]["question"], self.active_cycles[cycle_id]["findings"])
                self.active_cycles[cycle_id]["status"] = "completed"
                self.active_cycles[cycle_id]["report"] = report
                self.improvement_engine.evaluate_research(cycle_id, report)
