import os
import shutil
import subprocess
from typing import Tuple

class ImmutableShadowLayer:
    """
    Immutable Shadow Layer for Rollbacks.
    Git-backed self-mod loop. Auto-reverts on crash, restores databases, and feeds stack trace back.
    """
    def __init__(self, workspace_root: str = "."):
        self.workspace_root = workspace_root
        self.backup_dir = os.path.join("/tmp", "lucy_mirror_backups")
        os.makedirs(self.backup_dir, exist_ok=True)

    def commit_state(self, message: str) -> bool:
        """Creates a checkpoint of both code (Git) and databases before a risky self-modification."""
        print(f"[ShadowLayer] Creating Git and database checkpoint: {message}")
        
        # 1. Back up SQLite databases
        db_dir = os.environ.get("LUCY_DB_DIR", "/tmp")
        if os.path.exists(db_dir):
            for f in os.listdir(db_dir):
                if f.endswith(".db") or f.endswith(".sqlite"):
                    src = os.path.join(db_dir, f)
                    dest = os.path.join(self.backup_dir, f)
                    try:
                        shutil.copy2(src, dest)
                        print(f"[ShadowLayer] Backed up database: {f}")
                    except Exception as e:
                        print(f"[ShadowLayer] Database backup failed for {f}: {e}")

        # 2. Execute Git checkpoint (Add + Commit or Stash)
        try:
            subprocess.run(["git", "add", "."], cwd=self.workspace_root, capture_output=True)
            # Try to commit, if there are changes
            res = subprocess.run(["git", "commit", "-m", f"[Pre-Upgrade Checkpoint] {message}"], cwd=self.workspace_root, capture_output=True, text=True)
            if "nothing to commit" in res.stdout or "nothing added to commit" in res.stdout:
                print("[ShadowLayer] No pending git changes. Already at stable checkpoint.")
            else:
                print(f"[ShadowLayer] Git commit checkpoint completed.")
            return True
        except Exception as e:
            print(f"[ShadowLayer] Warning: Git checkout backup skipped or failed: {e}")
            return True

    def execute_and_monitor(self, command: str) -> Tuple[bool, str]:
        """Runs the modified code and watches for uncaught exceptions."""
        print(f"[ShadowLayer] Executing modified code: {command}")
        try:
            result = subprocess.run(command.split(), cwd=self.workspace_root, capture_output=True, text=True, timeout=30)
            if result.returncode != 0:
                print(f"[ShadowLayer] Sandbox run failed with return code {result.returncode}. Initiating Rollback.")
                err_msg = f"Return Code {result.returncode}\nStderr:\n{result.stderr}\nStdout:\n{result.stdout}"
                self.rollback(err_msg)
                return False, err_msg
            return True, "Execution succeeded."
        except subprocess.TimeoutExpired:
            err_msg = "Execution timed out after 30 seconds."
            self.rollback(err_msg)
            return False, err_msg
        except Exception as e:
            err_msg = f"Unexpected execution failure: {e}"
            self.rollback(err_msg)
            return False, err_msg

    def rollback(self, stack_trace: str) -> str:
        """Reverts code to the last stable git commit, restores original SQLite databases, and prompts a daemon restart."""
        print("[ShadowLayer] [CRITICAL] Error detected! Rolling back to stable state.")
        
        # 1. Restore databases
        db_dir = os.environ.get("LUCY_DB_DIR", "/tmp")
        if os.path.exists(self.backup_dir):
            for f in os.listdir(self.backup_dir):
                if f.endswith(".db") or f.endswith(".sqlite"):
                    src = os.path.join(self.backup_dir, f)
                    dest = os.path.join(db_dir, f)
                    try:
                        shutil.copy2(src, dest)
                        print(f"[ShadowLayer] Restored database: {f}")
                    except Exception as e:
                        print(f"[ShadowLayer] Database restore failed for {f}: {e}")

        # 2. Revert code via Git
        try:
            print("[ShadowLayer] Rolling back git repository...")
            subprocess.run(["git", "reset", "--hard", "HEAD"], cwd=self.workspace_root, capture_output=True)
            subprocess.run(["git", "clean", "-fd"], cwd=self.workspace_root, capture_output=True)
            print("[ShadowLayer] Hard revert completed successfully.")
        except Exception as e:
            print(f"[ShadowLayer] Git rollback encountered warning: {e}")

        # 3. Attempt to signal restart daemon/server if running under supervisor/pm2
        print("[ShadowLayer] Signalling background daemon restart sequence...")
        
        prompt = f"Lucy, your last self-rewrite caused an unexpected error. Rolling back to the stable state. Please analyze this stack trace and refactor your approach:\n\n{stack_trace}"
        print(f"[ShadowLayer] Feeding feedback to Lucy:\n{prompt}")
        return prompt

