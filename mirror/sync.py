import os
import shutil
from typing import Dict, Any

class StateSyncEngine:
    """
    The Snapshot & Sync Engine (The "Shadow State")
    Provides the Twin with a read-only clone of Lucy's current vector database,
    core memory logs, and system states.
    """
    def create_snapshot(self, live_state: Dict[str, Any], sandbox_dir: str = None) -> Dict[str, Any]:
        """Creates a read-only snapshot (git-like fork) of the live state."""
        print("[SyncEngine] Cloning vector database and memory logs...")
        
        snapshot_meta = {
            "snapshot_id": f"snap_{int(os.getpid())}_{os.getpid()}",
            "live_state": live_state.copy(),
            "databases_cloned": [],
            "code_cloned": False
        }

        if sandbox_dir and os.path.exists(sandbox_dir):
            # 1. Clone live database (SQLite) if present in LUCY_DB_DIR or /tmp
            db_dir = os.environ.get("LUCY_DB_DIR", "/tmp")
            for f in os.listdir(db_dir):
                if f.endswith(".db") or f.endswith(".sqlite"):
                    src_db = os.path.join(db_dir, f)
                    dest_db = os.path.join(sandbox_dir, f)
                    try:
                        shutil.copy2(src_db, dest_db)
                        snapshot_meta["databases_cloned"].append(f)
                    except Exception as e:
                        print(f"[SyncEngine] Warning: Could not clone database {f}: {e}")

            # 2. Clone active source code (excluding virtual environments, node_modules, etc.)
            src_code_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            dest_code_dir = os.path.join(sandbox_dir, "emma-core")
            try:
                if os.path.exists(dest_code_dir):
                    shutil.rmtree(dest_code_dir, ignore_errors=True)
                
                # Copy selective files to prevent massive node_modules copying
                def ignore_patterns(path, names):
                    ignored = []
                    for name in names:
                        if name in ["node_modules", "dist", "__pycache__", ".git", ".next", "venv"]:
                            ignored.append(name)
                    return ignored

                shutil.copytree(src_code_dir, dest_code_dir, ignore=ignore_patterns)
                snapshot_meta["code_cloned"] = True
                print(f"[SyncEngine] Successfully synced core code into sandbox staging path.")
            except Exception as e:
                print(f"[SyncEngine] Error cloning codebase: {e}")

        return snapshot_meta

