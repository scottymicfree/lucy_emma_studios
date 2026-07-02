import sys
import os
import json

# Ensure path is correct
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from engines.chat.orchestrator import ChatOrchestrator

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "reason": "No command payload file provided."}))
        return

    payload_file = sys.argv[1]
    if not os.path.exists(payload_file):
        print(json.dumps({"success": False, "reason": f"Payload file {payload_file} does not exist."}))
        return

    try:
        with open(payload_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        user_input = data.get("user_input", "")
        
        orchestrator = ChatOrchestrator()
        result = orchestrator.process_advanced_command(user_input)
        
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "reason": f"Chat runner failed: {str(e)}"}))

if __name__ == "__main__":
    main()
