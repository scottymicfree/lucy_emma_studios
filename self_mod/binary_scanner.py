import os
import subprocess
import json
import re
from typing import Dict, Any, List

class ToolSchemaGenerator:
    """
    Tool Use: Dynamic schema generation for newly discovered local binaries.
    Scans local binaries and CLI tools, auto-generates JSON schemas for tool invocation,
    and argument signatures.
    """
    def __init__(self, bin_paths: List[str] = None):
        # Default common paths for Windows and Linux
        self.bin_paths = bin_paths or [
            "C:\\Windows\\System32", 
            os.path.expandvars("%ProgramFiles%"),
            os.path.expandvars("%LOCALAPPDATA%\\Programs")
        ]
        self.discovered_tools = {}

    def scan_for_binaries(self) -> List[str]:
        """Scans registered paths for executable files."""
        discovered = []
        for path in self.bin_paths:
            if not os.path.exists(path):
                continue
            for root, _, files in os.walk(path):
                for file in files:
                    if file.lower().endswith(".exe") or file.lower().endswith(".bat") or file.lower().endswith(".ps1"):
                        discovered.append(os.path.join(root, file))
        return discovered

    def _extract_args_from_help(self, help_text: str) -> Dict[str, Any]:
        """Parses help output to auto-generate argument signatures."""
        args_schema = {
            "type": "object",
            "properties": {},
            "required": []
        }
        
        # Look for patterns like --arg <value> or -a, --arg
        lines = help_text.splitlines()
        for line in lines:
            line = line.strip()
            if line.startswith("-") or line.startswith("/"):
                # Very basic extraction logic
                parts = re.split(r'\s{2,}|\t', line)
                flag_part = parts[0]
                desc_part = parts[1] if len(parts) > 1 else ""
                
                # Clean up flag name
                clean_name = re.sub(r'[^a-zA-Z0-9_]', '', flag_part.split()[0])
                if clean_name:
                    args_schema["properties"][clean_name] = {
                        "type": "string",
                        "description": desc_part
                    }
        return args_schema

    def generate_schema(self, binary_path: str) -> Dict[str, Any]:
        """
        Attempts to generate an API schema for the binary by running it with --help
        and parsing the output.
        """
        name = os.path.basename(binary_path).replace(".exe", "").replace(".bat", "")
        schema = {
            "type": "function",
            "function": {
                "name": f"execute_{name}",
                "description": f"Executes the local binary: {name}",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "args": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Command line arguments."
                        }
                    }
                }
            }
        }
        
        # Try to extract help text to enrich description and arguments
        try:
            result = subprocess.run([binary_path, "--help"], capture_output=True, text=True, timeout=2)
            help_text = result.stdout or result.stderr
            if help_text:
                # Truncate help text for description
                help_snippet = help_text[:200].replace("\n", " ")
                schema["function"]["description"] = f"Executes {name}. Details: {help_snippet}"
                
                # Attempt to parse specific arguments
                parsed_args = self._extract_args_from_help(help_text)
                if parsed_args["properties"]:
                    # Merge specific args with generic args list
                    schema["function"]["parameters"]["properties"]["specific_args"] = parsed_args
        except Exception:
            pass 
            
        self.discovered_tools[name] = {
            "path": binary_path,
            "schema": schema
        }
        return schema

    def get_all_schemas(self) -> List[Dict[str, Any]]:
        """Returns all generated schemas for integration into LLM context."""
        return [tool["schema"] for tool in self.discovered_tools.values()]

