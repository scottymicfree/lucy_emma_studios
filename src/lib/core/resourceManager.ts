import {
  ResourceBudget,
  ResourceUsage,
  TaskPriorityContext,
} from "../../types";

export class ResourceManager {
  private static instance: ResourceManager;

  // Real hardware limits where available, else fallback
  private SYSTEM_BUDGET: ResourceBudget = {
    gpuMemoryMb: 24576, // Fallback VRAM
    cpuPercentage: (typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4) * 100,
    networkBandwidthKbps: 1000000, // 1Gbps
  };

  private currentAllocations: Map<string, ResourceUsage> = new Map();
  private taskQueue: TaskPriorityContext[] = [];

  private constructor() {
    if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
      // Use system memory as a baseline for total memory capacity
      // @ts-ignore
      this.SYSTEM_BUDGET.gpuMemoryMb = Math.min((navigator.deviceMemory || 8) * 1024, 24576);
    }
  }

  public static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  public requestResources(
    processId: string,
    requested: ResourceBudget,
    priority: number,
  ): boolean {
    console.log(
      `[ResourceManager] Process ${processId} requesting resources:`,
      requested,
    );

    const available = this.calculateAvailableResources();

    if (this.canFulfill(requested, available)) {
      // Allocate resources
      this.currentAllocations.set(processId, {
        processId,
        currentUsage: requested,
        peakUsage: requested,
        throttled: false,
      });
      console.log(`[ResourceManager] Allocation successful for ${processId}.`);
      return true;
    } else {
      // Admission control - reject or queue based on priority
      if (priority > 80) {
        // High priority, try to preempt
        console.warn(
          `[ResourceManager] High priority task ${processId} triggered adaptive scheduling / preemption.`,
        );
        this.throttleLowPriorityTasks();
        // Retry allocation after throttling
        const newAvailable = this.calculateAvailableResources();
        if (this.canFulfill(requested, newAvailable)) {
          this.currentAllocations.set(processId, {
            processId,
            currentUsage: requested,
            peakUsage: requested,
            throttled: false,
          });
          return true;
        }
      }

      console.warn(
        `[ResourceManager] Allocation denied for ${processId}. Insufficient resources.`,
      );
      this.taskQueue.push({
        taskId: processId,
        priorityLevel: priority,
        admissionStatus: "queued",
      });
      // Sort queue by priority
      this.taskQueue.sort((a, b) => b.priorityLevel - a.priorityLevel);
      return false;
    }
  }

  public releaseResources(processId: string): void {
    if (this.currentAllocations.has(processId)) {
      this.currentAllocations.delete(processId);
      console.log(`[ResourceManager] Resources released for ${processId}.`);
      this.processQueue(); // Check if queued tasks can now run
    }
  }

  private calculateAvailableResources(): ResourceBudget {
    let usedGpu = 0;
    let usedCpu = 0;
    let usedNet = 0;

    for (const usage of this.currentAllocations.values()) {
      usedGpu += usage.currentUsage.gpuMemoryMb;
      usedCpu += usage.currentUsage.cpuPercentage;
      usedNet += usage.currentUsage.networkBandwidthKbps;
    }

    return {
      gpuMemoryMb: this.SYSTEM_BUDGET.gpuMemoryMb - usedGpu,
      cpuPercentage: this.SYSTEM_BUDGET.cpuPercentage - usedCpu,
      networkBandwidthKbps: this.SYSTEM_BUDGET.networkBandwidthKbps - usedNet,
    };
  }

  private canFulfill(
    requested: ResourceBudget,
    available: ResourceBudget,
  ): boolean {
    return (
      requested.gpuMemoryMb <= available.gpuMemoryMb &&
      requested.cpuPercentage <= available.cpuPercentage &&
      requested.networkBandwidthKbps <= available.networkBandwidthKbps
    );
  }

  private throttleLowPriorityTasks(): void {
    console.log(
      `[ResourceManager] Throttling low priority tasks to free resources...`,
    );
    for (const [pid, usage] of this.currentAllocations.entries()) {
      // Simplistic throttling logic: halve usage of all existing tasks
      // In a real system, you'd check priorities
      usage.currentUsage.gpuMemoryMb *= 0.5;
      usage.currentUsage.cpuPercentage *= 0.5;
      usage.throttled = true;
      console.log(`[ResourceManager] Throttled ${pid}`);
    }
  }

  private processQueue(): void {
    if (this.taskQueue.length === 0) return;

    // Simplistic queue processing
    const nextTask = this.taskQueue[0];
    console.log(
      `[ResourceManager] Attempting to admit queued task ${nextTask.taskId}...`,
    );
    // Need a way to map taskId back to original requested budget.
    // For this mock, we just say it failed again or we'd need to store the requested budget.
  }

  public getSystemLoad(): number {
    const available = this.calculateAvailableResources();
    const usedCpu = this.SYSTEM_BUDGET.cpuPercentage - available.cpuPercentage;
    return (usedCpu / this.SYSTEM_BUDGET.cpuPercentage) * 100;
  }
}
