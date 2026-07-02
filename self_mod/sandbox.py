import os
import subprocess

class SandboxAuditor:
    """
    Separate Architecture: Mind vs. Sandbox
    Isolates self-rewrites to a staging directory and runs an automated Quality Gate.
    """
    def __init__(self, sandbox_dir: str = "lucy-workspace/sandbox"):
        self.sandbox_dir = sandbox_dir
        os.makedirs(self.sandbox_dir, exist_ok=True)

    def stage_file(self, filename: str, content: str) -> str:
        """Writes new module or patch to the isolated staging directory."""
        file_path = os.path.join(self.sandbox_dir, filename)
        with open(file_path, "w") as f:
            f.write(content)
        return file_path

    def run_quality_gate(self, file_path: str) -> bool:
        """
        Runs automated syntax check or linter against the sandbox file.
        e.g., `python -m py_compile` or `eslint`.
        """
        print(f"[Auditor] Running Quality Gate on {file_path}...")
        
        if file_path.endswith(".py"):
            result = subprocess.run(["python", "-m", "py_compile", file_path], capture_output=True)
            if result.returncode == 0:
                print("[Auditor] Quality Gate Passed: Syntax is valid.")
                return True
            else:
                print(f"[Auditor] Quality Gate Failed: {result.stderr.decode('utf-8')}")
                return False
        # Add JS/TS checking here if needed
        return True
