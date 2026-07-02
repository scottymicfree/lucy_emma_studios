/**
 * @file CorrelationGraph.ts
 * @description The unified indexing layer for tracing operations across the entire OS.
 * Links Commands, Events, Sessions, Proposals, and Snapshots to a root Correlation ID.
 */

export class CorrelationGraph {
  private static instance: CorrelationGraph;
  
  // Maps a root correlationId to a set of related sub-IDs
  private graph: Map<string, Set<string>> = new Map();

  private constructor() {}

  public static getInstance(): CorrelationGraph {
    if (!CorrelationGraph.instance) {
      CorrelationGraph.instance = new CorrelationGraph();
    }
    return CorrelationGraph.instance;
  }

  /**
   * Links a new related ID (e.g. an EventId or SnapshotId) to a root CorrelationId.
   */
  public link(correlationId: string, relatedId: string) {
    if (!this.graph.has(correlationId)) {
      this.graph.set(correlationId, new Set());
    }
    this.graph.get(correlationId)!.add(relatedId);
  }

  /**
   * Retrieves all IDs associated with a specific operation trace.
   */
  public getTrace(correlationId: string): string[] {
    const trace = this.graph.get(correlationId);
    return trace ? Array.from(trace) : [];
  }
}
