import json
from typing import Dict, Any, List
from engines.swarm.specialized_agents import BaseAgent
from engines.swarm.mesh_protocol import SwarmMeshEngine
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
try:
    from engines.search.web_search import WebSearchEngine
except ImportError:
    WebSearchEngine = None

class DiscoveryAgent(BaseAgent):
    def __init__(self, mesh: SwarmMeshEngine):
        super().__init__("discovery_1", "discovery_agent", mesh)
        self.toolset = ["web_search", "crawling"]
        self.search_engine = WebSearchEngine() if WebSearchEngine else None

    def reason(self, instruction: str = "") -> str:
        if self.search_engine:
            results = self.search_engine.search_web(instruction)
            return json.dumps(results)
        return "[]"

class AnalysisAgent(BaseAgent):
    def __init__(self, mesh: SwarmMeshEngine):
        super().__init__("analysis_1", "analysis_agent", mesh)
        self.toolset = ["data_extraction", "pattern_recognition"]

    def reason(self, data: str = "") -> str:
        sys_prompt = "You are an AnalysisAgent. Analyze the provided data, extract key facts, identify patterns, and structure the output."
        return self._call_llama(sys_prompt, f"Data: {data}")

class VerificationAgent(BaseAgent):
    def __init__(self, mesh: SwarmMeshEngine):
        super().__init__("verification_1", "verification_agent", mesh)
        self.toolset = ["fact_checking", "citation_tracking"]

    def reason(self, claim: str = "") -> str:
        sys_prompt = "You are a VerificationAgent. Verify the following claims. Cross-reference logically and output a confidence score with reasoning."
        return self._call_llama(sys_prompt, f"Claims: {claim}")

class SynthesisAgent(BaseAgent):
    def __init__(self, mesh: SwarmMeshEngine):
        super().__init__("synthesis_1", "synthesis_agent", mesh)
        self.toolset = ["report_generation", "summarization"]

    def reason(self, findings: str = "") -> str:
        sys_prompt = "You are a SynthesisAgent. Synthesize the findings into a cohesive narrative."
        return self._call_llama(sys_prompt, f"Findings: {findings}")
