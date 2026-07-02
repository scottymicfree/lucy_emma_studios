import json
import urllib.request
from typing import Dict, Any, List

class VisualPromptChaining:
    """
    Reasoning: Local prompt-chaining logic to map visual input to coordinate clicks.
    Provides Llama templates for interpretation, planning, and coordinate selection.
    """
    def __init__(self, ocr_processor, llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
        self.ocr = ocr_processor
        self.llama_endpoint = llama_endpoint

    def _call_llama(self, system_prompt: str, user_prompt: str) -> str:
        data = {
            "model": "local-llama-3-8b-instruct",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        }
        req = urllib.request.Request(self.llama_endpoint, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                result = json.loads(response.read().decode())
                return result['choices'][0]['message']['content']
        except Exception as e:
            return ""

    def interpret_vision(self, screen_buffer: np.ndarray, goal: str) -> str:
        """Step 1: Parse screen visual context."""
        context = self.ocr.build_prompt_context(screen_buffer)
        sys_prompt = "You are a visual interpreter. Analyze the parsed screen text and UI elements to understand the current GUI state."
        user_prompt = f"Goal: {goal}\n\nScreen Data:\n{context}\n\nWhat is the current state of the screen and where should I look?"
        return self._call_llama(sys_prompt, user_prompt)

    def plan_action(self, interpretation: str, goal: str) -> str:
        """Step 2: Plan the next UI interaction."""
        sys_prompt = "You are an action planner. Determine the exact sequence of UI interactions needed."
        user_prompt = f"Goal: {goal}\n\nVisual Interpretation:\n{interpretation}\n\nWhat is the next immediate action to take? (e.g. click 'Submit', type 'text')"
        return self._call_llama(sys_prompt, user_prompt)

    def select_coordinate(self, screen_buffer: np.ndarray, plan: str) -> Dict[str, Any]:
        """Step 3: Map plan to physical coordinates."""
        sys_prompt = "You are a coordinate mapper. Return a JSON object with 'x', 'y' coordinates of the target element, or null if not found."
        context = self.ocr.build_prompt_context(screen_buffer)
        user_prompt = f"Action Plan: {plan}\n\nScreen Data:\n{context}\n\nOutput JSON with {\"x\": int, \"y\": int, \"action\": \"click|type\", \"keys\": \"optional\"}."
        
        response = self._call_llama(sys_prompt, user_prompt)
        try:
            import re
            json_match = re.search(r'\\{.*\\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
        except:
            pass
            
        # Fallback to direct OCR matching if LLM fails formatting
        parsed_blocks = self.ocr.extract_text(screen_buffer)
        for block in parsed_blocks:
            if block["text"].lower() in plan.lower():
                return {
                    "action": "click",
                    "x": block["center"][0],
                    "y": block["center"][1],
                    "confidence": block["confidence"]
                }
        
        return {"action": "none", "x": -1, "y": -1}
        
    def execute_reasoning_chain(self, screen_buffer: np.ndarray, goal: str) -> Dict[str, Any]:
        """Runs the full perception-to-action reasoning chain."""
        interp = self.interpret_vision(screen_buffer, goal)
        plan = self.plan_action(interp, goal)
        action = self.select_coordinate(screen_buffer, plan)
        return {
            "interpretation": interp,
            "plan": plan,
            "action": action
        }

