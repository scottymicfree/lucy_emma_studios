import { Proposal } from "../../types";
import { scoreProposal } from "./Emma";

export function selectProposals(
  proposals: Proposal[],
  globalIntent: string,
  topN = 3,
): Proposal[] {
  const scored = proposals.map((p) => ({
    ...p,
    score: scoreProposal(p, globalIntent),
  }));
  scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return scored.slice(0, topN);
}
