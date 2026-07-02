import { Proposal } from "../../types";
import { EmmaEvaluationEngine } from "./EmmaEvaluationEngine";

export function scoreProposal(p: Proposal, globalIntent: string): number {
  const engine = EmmaEvaluationEngine.getInstance();
  const evaluation = engine.evaluateProposal(p, globalIntent);
  
  // Backwards compatibility: assign evaluation results directly to proposal object
  p.score = evaluation.score;
  p.reasoning = evaluation.reasoning;
  
  return evaluation.score;
}

export function getEmmaNodes() {
  return EmmaEvaluationEngine.getInstance().getNodes();
}

