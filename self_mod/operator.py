import json
import os
import subprocess
import shutil
from typing import Dict, Any

class FileSystemOperator:
    """
    Structured File-System Agent Protocol.
    Executes precise string replacements, file reads/writes, and local scripts safely.
    """
    def __init__(self, workspace_root: str = "lucy-workspace"):
        self.workspace_root = workspace_root
        os.makedirs(self.workspace_root, exist_ok=True)

    def parse_and_apply_patch(self, json_payload: str) -> bool:
        """Applies a search-and-replace patch with automatic backup generation."""
        try:
            patch = json.loads(json_payload)
            if patch.get("action") != "patch_file":
                return False
                
            target_file = patch.get("target_file")
            search_text = patch.get("search")
            replace_text = patch.get("replace")
            
            full_path = os.path.normpath(os.path.join(self.workspace_root, target_file))
            if not full_path.startswith(os.path.abspath(self.workspace_root)):
                return False

            if not os.path.exists(full_path):
                return False

            # Create backup snapshot for rollback
            shutil.copy2(full_path, f"{full_path}.bak")

            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()

            if search_text not in content:
                return False

            content = content.replace(search_text, replace_text)

            with open(full_path, "w", encoding="utf-8") as f:
                f.write(content)
                
            return True
        except Exception:
            return False

    def execute_local_script(self, script_path: str, args: list = None) -> str:
        """Executes a local Python script within the sandboxed workspace."""
        full_path = os.path.normpath(os.path.join(self.workspace_root, script_path))
        if not full_path.startswith(os.path.abspath(self.workspace_root)):
            return "Security violation: Path traversal detected."

        cmd = ["python", full_path]
        if args:
            cmd.extend(args)

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            return result.stdout if result.returncode == 0 else result.stderr
        except Exception as e:
            return str(e)

    def rollback_file(self, target_file: str) -> bool:
        """Restores a file from its last patch backup."""
        full_path = os.path.normpath(os.path.join(self.workspace_root, target_file))
        backup_path = f"{full_path}.bak"
        if os.path.exists(backup_path):
            shutil.copy2(backup_path, full_path)
            return True
        return False
