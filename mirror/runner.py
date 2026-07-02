import sys
import os
import json
from datetime import datetime

# Ensure correct path resolution for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from kernel.orchestrator import Orchestrator
from self_mod.rollback import ImmutableShadowLayer

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "reason": "No command specified."}))
        return

    cmd = sys.argv[1]
    
    if cmd == "propose":
        try:
            if len(sys.argv) < 3:
                print(json.dumps({"success": False, "reason": "Missing proposal payload."}))
                return
                
            arg_data = sys.argv[2]
            if os.path.exists(arg_data):
                with open(arg_data, 'r') as f:
                    proposal_data = json.load(f)
            else:
                proposal_data = json.loads(arg_data)
                
            new_code = proposal_data.get("new_code", "")
            file_path = proposal_data.get("file_path", "")
            live_prompt = proposal_data.get("live_prompt", "Run safety check.")
            live_output = proposal_data.get("live_output", "Nominal.")
            
            # Setup orchestrator
            orch = Orchestrator()
            
            # Setup stable live state context
            live_state = {
                "active_laws_count": len(orch.identity_manager.wisdom_store.query_active_laws(None) or []),
                "resilience_index": 0.95,
                "current_time": str(datetime.now())
            }
            
            # Execute propose upgrade
            result = orch.propose_self_upgrade(
                proposal=proposal_data,
                live_state=live_state,
                new_code=new_code,
                file_path=file_path,
                live_prompt=live_prompt,
                live_output=live_output
            )
            print(json.dumps(result))
        except Exception as e:
            print(json.dumps({"success": False, "reason": f"Execution error: {str(e)}"}))
            
    elif cmd == "rollback":
        try:
            shadow = ImmutableShadowLayer()
            prompt = shadow.rollback("Manual Rollback Triggered by Operator Console.")
            print(json.dumps({"success": True, "reason": "System rolled back successfully.", "prompt": prompt}))
        except Exception as e:
            print(json.dumps({"success": False, "reason": f"Rollback error: {str(e)}"}))
            
    else:
        print(json.dumps({"success": False, "reason": f"Unknown command: {cmd}"}))

if __name__ == "__main__":
    main()
