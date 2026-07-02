import json
import urllib.request
import re
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class TaskStep:
    id: int
    description: str
    required_tool: str
    status: str = "pending"  # pending, in_progress, completed, failed
    result: str = ""
    error: str = ""

@dataclass
class TaskHandbook:
    title: str
    objective: str
    constraints: List[str]
    required_tools: List[str]
    plan: List[TaskStep]
    success_criteria: List[str]
    fallback_strategies: List[str]
    current_step: int = 0
    status: str = "not_started"

    def to_dict(self):
        return {
            "title": self.title,
            "objective": self.objective,
            "constraints": self.constraints,
            "required_tools": self.required_tools,
            "plan": [{"id": s.id, "description": s.description, "required_tool": s.required_tool, "status": s.status} for s in self.plan],
            "success_criteria": self.success_criteria,
            "fallback_strategies": self.fallback_strategies,
            "current_step": self.current_step,
            "status": self.status
        }

class ProjectExecutionEngine:
    """
    Project Execution Engine — Autonomous task completion for Lucy.
    Parses intent, auto-generates a task handbook, auto-selects tools, executes steps,
    tracks progress, and runs post-task reflection.
    """
    def __init__(self, llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
        self.llama_endpoint = llama_endpoint
        self.active_projects: Dict[str, TaskHandbook] = {}
        # We assume tools are available in a registry or injected.
        self.available_tools = ["web_search", "local_cmd", "file_system", "python_repl", "reflection", "perception"]
    
    def _call_llama(self, system_prompt: str, user_prompt: str) -> str:
        data = {
            "model": "local-llama-3-8b-instruct",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "stream": False
        }
        req = urllib.request.Request(
            self.llama_endpoint, 
            data=json.dumps(data).encode('utf-8'), 
            headers={'Content-Type': 'application/json'}
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                result = json.loads(response.read().decode())
                return result['choices'][0]['message']['content']
        except Exception as e:
            return f"Error connecting to Llama: {str(e)}"

    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        try:
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            return json.loads(text)
        except Exception:
            return {}

    def understand_task(self, user_request: str) -> Dict[str, Any]:
        """Parses intent, detects missing information, generates clarifying questions if needed."""
        sys_prompt = f'''You are Lucy's Project Execution Engine. Analyze the user's request.
Determine if you have enough information to create a full project plan.
Available tools: {", ".join(self.available_tools)}
Output strictly valid JSON:
{{
    "intent": "Core task objective",
    "is_clear": boolean,
    "missing_information": ["list of missing details"],
    "clarifying_question": "string, ask the user ONLY IF is_clear is false",
    "can_proceed_with_assumptions": boolean
}}'''
        response = self._call_llama(sys_prompt, user_request)
        return self._parse_json_response(response)

    def generate_handbook(self, user_request: str, project_id: str) -> Optional[TaskHandbook]:
        """Auto-generates a structured handbook for the task."""
        sys_prompt = f'''Create a Project Handbook for the following request.
Available tools: {", ".join(self.available_tools)}
Output strictly valid JSON:
{{
    "title": "Project Title",
    "objective": "Main goal",
    "constraints": ["constraint 1"],
    "required_tools": ["tool_name"],
    "plan": [
        {{"id": 1, "description": "step 1", "required_tool": "tool_name"}},
        {{"id": 2, "description": "step 2", "required_tool": "tool_name"}}
    ],
    "success_criteria": ["criteria 1"],
    "fallback_strategies": ["fallback 1"]
}}'''
        response = self._call_llama(sys_prompt, user_request)
        data = self._parse_json_response(response)
        
        if not data:
            return None
            
        steps = []
        for step_data in data.get("plan", []):
            steps.append(TaskStep(
                id=step_data.get("id", 0),
                description=step_data.get("description", ""),
                required_tool=step_data.get("required_tool", "none")
            ))
            
        handbook = TaskHandbook(
            title=data.get("title", "Untitled Project"),
            objective=data.get("objective", ""),
            constraints=data.get("constraints", []),
            required_tools=data.get("required_tools", []),
            plan=steps,
            success_criteria=data.get("success_criteria", []),
            fallback_strategies=data.get("fallback_strategies", [])
        )
        self.active_projects[project_id] = handbook
        return handbook

    def select_and_use_tool(self, tool_name: str, instruction: str) -> str:
        """
        Tool execution layer mapping to real agent capabilities.
        (Integration point for WebSearchEngine, WindowsExecutor, FileSystemOperator)
        """
        sys_prompt = f"You are Lucy's internal tool executor for '{tool_name}'. Execute the following instruction: {instruction}."
        return self._call_llama(sys_prompt, "Return the execution result.")

    def execute_step(self, project_id: str, step_index: int) -> bool:
        """Executes a single step in the plan, validates output, and handles fallbacks."""
        if project_id not in self.active_projects:
            return False
            
        handbook = self.active_projects[project_id]
        if step_index >= len(handbook.plan):
            return False
            
        step = handbook.plan[step_index]
        step.status = "in_progress"
        
        # Tool execution
        try:
            result = self.select_and_use_tool(step.required_tool, step.description)
            
            # Validation
            val_sys = "Evaluate if this tool output successfully completes the step. Output JSON: {\"success\": boolean, \"reason\": \"string\"}"
            val_user = f"Step: {step.description}\\nResult: {result}"
            val_resp = self._parse_json_response(self._call_llama(val_sys, val_user))
            
            if val_resp.get("success", False):
                step.status = "completed"
                step.result = result
                handbook.current_step += 1
                return True
            else:
                step.status = "failed"
                step.error = val_resp.get("reason", "Validation failed.")
                return False
                
        except Exception as e:
            step.status = "failed"
            step.error = str(e)
            return False

    def recover_failure(self, project_id: str, step_index: int) -> bool:
        """Adapts and retries a failed step."""
        handbook = self.active_projects.get(project_id)
        if not handbook: 
            return False
        
        step = handbook.plan[step_index]
        sys_prompt = "You are recovering from a failed project step. Propose an alternative strategy or corrected tool instruction."
        user_prompt = f"Step: {step.description}\\nError: {step.error}\\nFallbacks: {handbook.fallback_strategies}\\nProvide new instruction."
        
        new_instruction = self._call_llama(sys_prompt, user_prompt)
        step.description = f"Retry with new approach: {new_instruction}"
        step.status = "pending"
        
        return self.execute_step(project_id, step_index)

    def execute_project(self, project_id: str) -> str:
        """Runs the entire project plan end-to-end."""
        handbook = self.active_projects.get(project_id)
        if not handbook: 
            return "Project not found."
        
        handbook.status = "running"
        
        while handbook.current_step < len(handbook.plan):
            idx = handbook.current_step
            success = self.execute_step(project_id, idx)
            if not success:
                # Try recovery once
                rec_success = self.recover_failure(project_id, idx)
                if not rec_success:
                    handbook.status = "failed"
                    self._reflect_on_project(project_id)
                    return f"Project failed at step {idx + 1}: {handbook.plan[idx].error}"
                    
        handbook.status = "completed"
        summary = self._generate_final_delivery(project_id)
        self._reflect_on_project(project_id)
        return summary

    def _generate_final_delivery(self, project_id: str) -> str:
        """Produces the finished output and summarizes what was done."""
        handbook = self.active_projects.get(project_id)
        if not handbook: 
            return ""
        
        results = "\\n".join([f"Step {s.id}: {s.result}" for s in handbook.plan])
        sys_prompt = "You are Lucy. Summarize the completed project clearly and deliver the final result to the user."
        user_prompt = f"Project: {handbook.title}\\nObjective: {handbook.objective}\\nResults:\\n{results}"
        return self._call_llama(sys_prompt, user_prompt)

    def _reflect_on_project(self, project_id: str):
        """Post-task reflection to update policies and store lessons."""
        handbook = self.active_projects.get(project_id)
        if not handbook: 
            return
        
        status = handbook.status
        sys_prompt = "You are Lucy's Reflection Engine. Analyze this project execution. Extract ONE core lesson to improve future performance."
        user_prompt = f"Project: {handbook.title}\\nStatus: {status}\\nPlan: {json.dumps(handbook.to_dict())}"
        
        lesson = self._call_llama(sys_prompt, user_prompt)
        # In a real integration, this connects to the Wisdom Memory subsystem.
        print(f"[Project Execution Engine] Reflection Lesson: {lesson.strip()}")
