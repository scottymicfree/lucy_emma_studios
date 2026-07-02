from typing import List, Dict, Any, Optional
import re

class TaskVectorMachine:
    """
    Implements The Dynamic Task Vector Machine.
    Uses internal reasoning steps delimited by <think> and </think> tags
    to dynamically guide processing at inference time.
    """
    def __init__(self):
        self.deliberation_history: List[str] = []
        
    def extract_deliberation(self, model_output: str) -> str:
        """Extracts the <think> ... </think> block from the model's output."""
        match = re.search(r'<think>(.*?)</think>', model_output, re.DOTALL)
        if match:
            return match.group(1).strip()
        return ""
        
    def dynamic_alignment(self, deliberation: str) -> Dict[str, Any]:
        """Continuous Dynamic Alignment based on active deliberation."""
        # E.g., parses the deliberation to align with user values or safety constraints
        return {"aligned": True, "context": "deliberated"}
        
    def task_vector_transformation(self, base_weights: Any, deliberation: str) -> Any:
        """Task Vector Transformation."""
        # Modifies the active routing or attention biases dynamically
        # based on the cognitive deliberation trace.
        transformed_weights = base_weights # Placeholder
        return transformed_weights
        
    def process_trajectory(self, user_query: str, raw_model_output: str, base_weights: Any) -> Dict[str, Any]:
        """
        Executes the full Inference Trajectory:
        1. Active Deliberation (<think>)
        2. Continuous Dynamic Alignment
        3. Task Vector Transformation
        4. Unified API Payload Output
        """
        deliberation = self.extract_deliberation(raw_model_output)
        if deliberation:
            self.deliberation_history.append(deliberation)
            
        alignment_state = self.dynamic_alignment(deliberation)
        adapted_weights = self.task_vector_transformation(base_weights, deliberation)
        
        # Generates final payload incorporating the reasoning and adaptations
        final_payload = {
            "query": user_query,
            "deliberation": deliberation,
            "alignment": alignment_state,
            "adapted_state": "transformed" if adapted_weights else "base",
            "output": raw_model_output.replace(f"<think>{deliberation}</think>", "").strip()
        }
        return final_payload
