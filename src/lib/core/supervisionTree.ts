import { ProcessState, ProcessCheckpoint } from "../../types";

export class SupervisionTree {
  private static instance: SupervisionTree;
  private processes: Map<string, ProcessState> = new Map();
  private checkpoints: Map<string, ProcessCheckpoint[]> = new Map();
  private readonly MAX_RESTARTS = 5;

  private constructor() {
    // Start health check loop
    setInterval(() => this.healthCheck(), 5000);
  }

  public static getInstance(): SupervisionTree {
    if (!SupervisionTree.instance) {
      SupervisionTree.instance = new SupervisionTree();
    }
    return SupervisionTree.instance;
  }

  public registerProcess(pid: string, name: string): void {
    this.processes.set(pid, {
      pid,
      name,
      status: "running",
      restarts: 0,
      lastRestart: Date.now(),
      uptime: 0,
      healthCheck: true,
    });
    console.log(`[SupervisionTree] Process registered: ${name} (${pid})`);
  }

  public reportCrash(pid: string): void {
    const process = this.processes.get(pid);
    if (!process) return;

    console.error(
      `[SupervisionTree] Process CRASH detected: ${process.name} (${pid})`,
    );
    process.status = "failed";
    this.handleRecovery(process);
  }

  private handleRecovery(process: ProcessState): void {
    if (process.restarts >= this.MAX_RESTARTS) {
      console.error(
        `[SupervisionTree] Process ${process.name} reached max restarts. Halting.`,
      );
      process.status = "stopped";
      return;
    }

    console.log(
      `[SupervisionTree] Attempting graceful recovery for ${process.name}...`,
    );
    process.restarts++;
    process.lastRestart = Date.now();
    process.status = "restarting";

    // Simulate recovery delay
    setTimeout(() => {
      process.status = "running";
      console.log(
        `[SupervisionTree] Process ${process.name} recovered successfully (Restart ${process.restarts}/${this.MAX_RESTARTS}).`,
      );
    }, 2000);
  }

  public createCheckpoint(pid: string, stateData: any): void {
    if (!this.checkpoints.has(pid)) {
      this.checkpoints.set(pid, []);
    }

    const checkpoint: ProcessCheckpoint = {
      id: `chk_${Date.now()}`,
      pid,
      timestamp: Date.now(),
      stateData,
    };

    this.checkpoints.get(pid)?.push(checkpoint);
    console.log(`[SupervisionTree] Checkpoint created for ${pid}`);
  }

  public loadLatestCheckpoint(pid: string): ProcessCheckpoint | null {
    const processCheckpoints = this.checkpoints.get(pid);
    if (!processCheckpoints || processCheckpoints.length === 0) return null;
    return processCheckpoints[processCheckpoints.length - 1];
  }

  private async healthCheck(): Promise<void> {
    let serverHealthy = false;
    try {
      const res = await fetch("/api/health");
      serverHealthy = res.ok;
    } catch (e) {
      serverHealthy = false;
    }

    this.processes.forEach((process) => {
      if (process.status === "running") {
        process.uptime += 5; // 5 seconds interval
        
        process.healthCheck = serverHealthy;

        if (!process.healthCheck) {
          console.warn(
            `[SupervisionTree] Health check failed for ${process.name} (${process.pid})`,
          );
          this.reportCrash(process.pid);
        }
      }
    });
  }

  public getProcessStatus(pid: string): ProcessState | undefined {
    return this.processes.get(pid);
  }
}
