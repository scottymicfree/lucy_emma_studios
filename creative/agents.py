import json
from typing import Dict, Any, List
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

try:
    from engines.swarm.specialized_agents import BaseAgent
except ImportError:
    BaseAgent = object

class ConceptArtistAgent(BaseAgent):
    def __init__(self, mesh):
        if BaseAgent is not object:
            super().__init__("concept_1", "concept_artist", mesh)
        self.toolset = ["idea_generation"]
        self.style_profile = "Divergent, surreal, boundary-pushing"

    def reason(self, prompt: str = "") -> str:
        sys_prompt = f"You are a Concept Artist. Style: {self.style_profile}. Generate raw, novel ideas."
        return self._call_llama(sys_prompt, prompt) if hasattr(self, '_call_llama') else ""

class ComposerAgent(BaseAgent):
    def __init__(self, mesh):
        if BaseAgent is not object:
            super().__init__("composer_1", "composer", mesh)
        self.toolset = ["midi_generation", "audio_synthesis"]
        self.style_profile = "Harmonic, structured, emotive"

    def reason(self, prompt: str = "") -> str:
        sys_prompt = f"You are a Composer. Style: {self.style_profile}. Create melodies, rhythms, or structural musical ideas."
        return self._call_llama(sys_prompt, prompt) if hasattr(self, '_call_llama') else ""

class WriterAgent(BaseAgent):
    def __init__(self, mesh):
        if BaseAgent is not object:
            super().__init__("writer_1", "writer", mesh)
        self.toolset = ["text_generation"]
        self.style_profile = "Poetic, narrative-driven, evocative"

    def reason(self, prompt: str = "") -> str:
        sys_prompt = f"You are a Writer. Style: {self.style_profile}. Produce narrative, lyrics, or descriptions."
        return self._call_llama(sys_prompt, prompt) if hasattr(self, '_call_llama') else ""

class DesignerAgent(BaseAgent):
    def __init__(self, mesh):
        if BaseAgent is not object:
            super().__init__("designer_1", "designer", mesh)
        self.toolset = ["layout_generation", "visual_structure"]
        self.style_profile = "Minimalist, functional, elegant"

    def reason(self, prompt: str = "") -> str:
        sys_prompt = f"You are a Designer. Style: {self.style_profile}. Produce visual or structural layouts."
        return self._call_llama(sys_prompt, prompt) if hasattr(self, '_call_llama') else ""

class CriticAgent(BaseAgent):
    def __init__(self, mesh):
        if BaseAgent is not object:
            super().__init__("critic_1", "critic", mesh)
        self.toolset = ["evaluation", "refinement"]
        self.style_profile = "Analytical, constructive, detail-oriented"

    def reason(self, prompt: str = "") -> str:
        sys_prompt = f"You are a Critic. Style: {self.style_profile}. Evaluate and improve the provided creative output."
        return self._call_llama(sys_prompt, prompt) if hasattr(self, '_call_llama') else ""
