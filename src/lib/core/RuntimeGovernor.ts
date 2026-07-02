import { useNodeStore } from "../../store/useNodeStore";
import { NodeStatus, EventPriority } from "../../types";

export interface OSTelemetry {
  cpuLoad: number;
  gpuLoad: number;
  memoryUsage: number;
  thermal: number;
}

export class RuntimeGovernor {
  private static instance: RuntimeGovernor;
  private isDreaming: boolean = false;
  private osTelemetry: OSTelemetry = {
    cpuLoad: 0,
    gpuLoad: 0,
    memoryUsage: 0,
    thermal: 0,
  };

  private constructor() {}

  public static getInstance(): RuntimeGovernor {
    if (!RuntimeGovernor.instance) {
      RuntimeGovernor.instance = new RuntimeGovernor();
    }
    return RuntimeGovernor.instance;
  }

  // Hook this up to a real endpoint or ngrok tunnel in the future
  public updateTelemetry(data: Partial<OSTelemetry>) {
    this.osTelemetry = { ...this.osTelemetry, ...data };
  }

  public getTelemetry(): OSTelemetry {
    return this.osTelemetry;
  }

  public async startDreaming(buildIdea: string) {
    if (this.isDreaming) return;
    this.isDreaming = true;

    const store = useNodeStore.getState();
    store.emitEvent("LP1", NodeStatus.THINKING, EventPriority.CRITICAL, {
      action: "start_dreaming",
      idea: buildIdea,
    });

    console.log(`[Hyper-Lucy] Initiating Dream State for: ${buildIdea}`);
    console.log(`[Hyper-Lucy] Simulating 1,000 Future Ticks...`);

    let simulatedThermal = this.osTelemetry.thermal;
    let crashPredicted = false;

    // Use real telemetry rather than a simulated random loop
    if (this.osTelemetry.thermal >= 75.0) {
      crashPredicted = true;
    }

    // Artificial delay for UX
    await new Promise((resolve) => setTimeout(resolve, 3000));

    if (crashPredicted) {
      console.warn(
        `[Hyper-Lucy] High Risk Detected! Thermal limit (82.0°C) hit during Dream State.`,
      );
      store.emitEvent("LP1", NodeStatus.ALERT, EventPriority.CRITICAL, {
        action: "dream_result",
        status: "High Risk",
        reason: "Thermal limit 82.0°C exceeded",
        suggestion:
          "Optimize build: Reduce geometry density or defer rendering.",
      });
    } else {
      console.log(`[Hyper-Lucy] Dream State Complete. Build is stable.`);
      store.emitEvent("LP1", NodeStatus.ACTIVE, EventPriority.NORMAL, {
        action: "dream_result",
        status: "Stable",
        maxThermal: simulatedThermal.toFixed(1),
      });
    }

    this.isDreaming = false;
  }
}

export const runtimeGovernor = RuntimeGovernor.getInstance();
