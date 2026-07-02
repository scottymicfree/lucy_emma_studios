import json
from typing import Dict, Any, List

class CreativeToolEngine:
    def __init__(self, mesh):
        self.mesh = mesh
        self.creative_tools = ["audio_synthesis", "image_generation", "midi_tools", "text_formatter"]

    def request_creative_tool(self, tool_name: str, args: Dict[str, Any]) -> str:
        if tool_name not in self.creative_tools:
            return "Tool not available"
            
        payload = {
            "action": "creative_tool_request",
            "tool_name": tool_name,
            "args": args
        }
        self.mesh.broadcast_announcement(payload)
        return f"Requested {tool_name}"

    def chain_creative_tools(self, tool_sequence: List[Dict[str, Any]]) -> str:
        for step in tool_sequence:
            self.request_creative_tool(step["tool_name"], step.get("args", {}))
        return "Tool chain initiated"
