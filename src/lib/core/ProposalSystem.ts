import { Proposal, CognitiveNode } from "../../types";
import { useNodeStore } from "../../store/useNodeStore";

function isValidNode(node: CognitiveNode): boolean {
  if (!node || !node.id) return false;
  if (node.energy < 20) return false;
  if (node.autonomyLevel < 0.0 || node.autonomyLevel > 1.0) return false;
  return true;
}

function isValidProposal(proposal: Proposal): boolean {
  if (!proposal.id || !proposal.nodeId) return false;
  if (
    !proposal.action &&
    (!proposal.actionChain || proposal.actionChain.length === 0)
  )
    return false;
  if (proposal.confidence < 0 || proposal.confidence > 1) return false;
  if (proposal.cost < 0 || proposal.cost > 1) return false;
  return true;
}

export function collectProposals(
  activeNodes: CognitiveNode[],
  globalIntent: string,
): Proposal[] {
  const proposals: Proposal[] = [];
  const insights = useNodeStore.getState().insightStream;

  for (const node of activeNodes) {
    if (!isValidNode(node)) {
      if (node.energy >= 20)
        console.warn(`[ProposalSystem] Invalid node detected: ${node.id}`);
      continue;
    }

    // Check for specific anomaly insights to generate targeted proposals
    const nodeInsights = insights.filter((i) => i.sourceNodeId === node.id);
    let generatedSpecificProposal = false;

    for (const insight of nodeInsights) {
      let specificProposal: Partial<Proposal> | null = null;

      if (insight.message.includes("Pedestrian logic failure")) {
        specificProposal = {
          action: "external_call",
          actionChain: [
            "pause_pedestrian_ai",
            "calculate_safe_path",
            "force_idle_state",
          ],
          confidence: 0.98,
          domain: "unreal",
          reasoning:
            "Critical safety violation. Halting pedestrian AI to prevent traffic collision.",
        };
      } else if (insight.message.includes("Vehicle path deviation")) {
        specificProposal = {
          action: "external_call",
          actionChain: ["override_vehicle_path", "reroute_to_safe_zone"],
          confidence: 0.95,
          domain: "unreal",
          reasoning:
            "Vehicles ignoring rules. Rerouting to safe zones to avoid high-density areas.",
        };
      } else if (insight.message.includes("MR User Interaction Conflict")) {
        specificProposal = {
          action: "external_call",
          actionChain: [
            "lock_npc_state",
            "check_user_priority",
            "assign_control",
            "notify_users",
          ],
          confidence: 0.99,
          domain: "mr_sync",
          reasoning:
            "Resolving simultaneous grab by locking state and assigning based on priority.",
        };
      } else if (insight.message.includes("Dynamic obstacle spawned")) {
        specificProposal = {
          action: "external_call",
          actionChain: [
            "detect_obstacle",
            "recalculate_navmesh",
            "update_npc_paths",
          ],
          confidence: 0.92,
          domain: "unreal",
          reasoning:
            "New dynamic obstacle detected. Recalculating navmesh for affected NPCs.",
        };
      } else if (insight.message.includes("Hidden threat detected")) {
        specificProposal = {
          action: "external_call",
          actionChain: [
            "enable_thermal_tracking",
            "predict_movement_vector",
            "alert_security",
          ],
          confidence: 0.88,
          domain: "security",
          reasoning:
            "Cloaked NPC detected. Enabling advanced tracking and predicting movement.",
        };
      } else if (insight.message.includes("N0 Guardian rollback")) {
        specificProposal = {
          action: "external_call",
          actionChain: [
            "halt_simulation",
            "fetch_previous_world_digest",
            "apply_rollback",
            "resume_simulation",
          ],
          confidence: 1.0,
          domain: "system",
          reasoning:
            "Collision threshold exceeded. Executing N0 Guardian rollback to last safe state.",
        };
      } else if (insight.message.includes("Ghost Mode predictive smoothing")) {
        specificProposal = {
          action: "external_call",
          actionChain: [
            "enable_ghost_mode",
            "interpolate_npc_positions",
            "reduce_tick_rate",
          ],
          confidence: 0.96,
          domain: "mr_sync",
          reasoning:
            "MR latency spike detected. Activating Ghost Mode to maintain visual consistency.",
        };
      }

      if (specificProposal) {
        const proposal: Proposal = {
          id: `prop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          nodeId: node.id,
          action: specificProposal.action!,
          actionChain: specificProposal.actionChain,
          confidence: specificProposal.confidence!,
          intentAlignment: 1.0,
          cost: 0.2,
          novelty: 0.9,
          domain: specificProposal.domain,
          reasoning: specificProposal.reasoning,
        };
        if (isValidProposal(proposal)) {
          proposals.push(proposal);
          generatedSpecificProposal = true;
          break; // Only generate one specific proposal per node per tick
        }
      }
    }

    if (generatedSpecificProposal) continue;

    // Calculate intent alignment based on subsystem and global intent
    let intentAlignment = 0.5;
    if (globalIntent === "load_shedding" && node.subsystem === "core")
      intentAlignment = 0.9;
    if (globalIntent === "idle_optimization" && node.subsystem === "memory")
      intentAlignment = 0.8;
    if (globalIntent === "processing" && node.subsystem === "execution")
      intentAlignment = 0.9;

    // Real Proposal Generation: Derived from node health and history
    const history = node.decisionHistory || [];
    const recentActions = history.slice(-3).map((h) => h.action);

    // If node energy is critical, propose recovery
    if (node.energy < 30) {
      const action = "store";
      const actionChain = ["store", "analyze", "route"];
      const cost = (100 - node.energy) / 100;
      const novelty = recentActions.includes(action) ? 0.1 : 0.8;
      const domain = "system";

      const proposal: Proposal = {
        id: `prop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        nodeId: node.id,
        action,
        actionChain,
        confidence: node.autonomyLevel,
        intentAlignment: intentAlignment,
        cost,
        novelty,
        domain,
      };

      if (isValidProposal(proposal)) {
        proposals.push(proposal);
      } else {
        console.warn(`[ProposalSystem] Malformed proposal generated by node ${node.id}:`, proposal);
      }
    } else if (node.autonomyLevel > 0.8 && !recentActions.includes("external_call")) {
      // High autonomy nodes can propose routing/external interactions when healthy
      const action = "external_call";
      const actionChain = ["route", "external_call"];
      const cost = 0.3;
      const novelty = 0.9;
      const domain = node.subsystem === "execution" ? "llama" : "database";

      const proposal: Proposal = {
        id: `prop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        nodeId: node.id,
        action,
        actionChain,
        confidence: node.autonomyLevel,
        intentAlignment: intentAlignment,
        cost,
        novelty,
        domain,
      };

      if (isValidProposal(proposal)) {
        proposals.push(proposal);
      } else {
        console.warn(`[ProposalSystem] Malformed proposal generated by node ${node.id}:`, proposal);
      }
    }
  }

  return proposals;
}
