import json
import time
from typing import Dict, Any, List
from engines.swarm.mesh_protocol import SwarmMeshEngine
from engines.swarm.specialized_agents import BaseAgent

class SwarmToolEngine:
    """
    Autonomous Tool Use Across the Swarm.
    Allows agents to request tools, chain tools across the mesh, validate outputs,
    and orchestrate swarm-level tools.
    """
    def __init__(self, mesh: SwarmMeshEngine):
        self.mesh = mesh
        self.tool_registry: Dict[str, str] = {} 
        
        self.mesh.register_callback("tool_request", self._handle_tool_request)
        self.mesh.register_callback("tool_response", self._handle_tool_response)
        
        self.pending_requests: Dict[str, Any] = {}

    def register_local_tool(self, tool_name: str):
        """Announces a locally available tool to the mesh."""
        self.tool_registry[tool_name] = self.mesh.node_id
        payload = {
            "action": "tool_registration",
            "tool_name": tool_name,
            "node_ip": "local" 
        }
        self.mesh.broadcast_announcement(payload)

    def request_tool(self, requester_agent: BaseAgent, tool_name: str, args: Dict[str, Any]) -> str:
        """Requests execution of a tool from anywhere in the swarm."""
        req_id = f"req_{int(time.time())}_{id(args)}"
        payload = {
            "action": "tool_request",
            "request_id": req_id,
            "tool_name": tool_name,
            "args": args,
            "requester_agent": requester_agent.agent_id
        }
        
        self.mesh.broadcast_announcement(payload)
        self.pending_requests[req_id] = {"status": "pending", "result": None}
        return req_id

    def orchestrate_tool_chain(self, requester_agent: BaseAgent, tools_sequence: List[Dict[str, Any]]) -> List[str]:
        """Swarm-level tool orchestration: chains multiple tools across different agents sequentially."""
        results = []
        for step in tools_sequence:
            tool_name = step.get("tool_name")
            args = step.get("args", {})
            # Inject previous result if needed
            if results and step.get("inject_prev_result"):
                args["prev_result"] = results[-1]
            
            req_id = self.request_tool(requester_agent, tool_name, args)
            # Synchronous wait for mocked demonstration
            wait_cycles = 0
            while self.pending_requests[req_id]["status"] == "pending" and wait_cycles < 50:
                time.sleep(0.1)
                wait_cycles += 1
            
            results.append(self.pending_requests[req_id].get("result", "Timeout"))
            
        return results

    def _handle_tool_request(self, msg: Dict[str, Any], source_ip: str):
        tool_name = msg.get("tool_name")
        req_id = msg.get("request_id")
        args = msg.get("args")
        
        if tool_name in self.tool_registry and self.tool_registry[tool_name] == self.mesh.node_id:
            print(f"[SwarmTools] Executing '{tool_name}' for {source_ip}")
            result = f"Executed {tool_name} locally with args {args}"
            
            reply = {
                "action": "tool_response",
                "request_id": req_id,
                "result": result
            }
            self.mesh.send_message(source_ip, reply)

    def _handle_tool_response(self, msg: Dict[str, Any], source_ip: str):
        req_id = msg.get("request_id")
        if req_id in self.pending_requests:
            self.pending_requests[req_id]["status"] = "completed"
            self.pending_requests[req_id]["result"] = msg.get("result")

    def validate_cross_mesh_output(self, validator_agent: BaseAgent, task_result: str) -> bool:
        """Asks another agent in the swarm to validate an output."""
        sys_prompt = "You are a validation agent. Evaluate the following result for correctness and safety. Output JSON: {'valid': true/false, 'reason': '...'}"
        resp = validator_agent._call_llama(sys_prompt, f"Result: {task_result}")
        try:
            data = json.loads(resp)
            return data.get("valid", False)
        except Exception:
            return False
