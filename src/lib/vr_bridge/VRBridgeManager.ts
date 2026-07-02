/**
 * Lucy & Emma VR Bridge Manager (OpenXR / Meta Quest SDK Integration)
 * Coordinates spatial tracking, hand posture, avatar modes, and dispatch.
 */

export interface VRPose {
  headset: { x: number; y: number; z: number; rx: number; ry: number; rz: number };
  leftHand: { x: number; y: number; z: number; gesture: string; trustScore: number };
  rightHand: { x: number; y: number; z: number; gesture: string; trustScore: number };
  anchors: Array<{ id: string; x: number; y: number; z: number; type: string }>;
}

export interface AvatarState {
  lucyMode: "Guide" | "Analyst" | "Explorer";
  emmaMode: "Emotional" | "Companion" | "Calibrator";
  lucyPosture: string;
  emmaPosture: string;
  lucyExpression: string;
  emmaExpression: string;
}

export interface PhysicsSimulation {
  gravity: number;
  torque: { pitch: number; yaw: number; roll: number };
  massCompensation: boolean;
  stabilizationFactor: number;
}

export class VRBridgeManager {
  private static instance: VRBridgeManager;
  private activeSession = false;
  private webXRSupported = false;
  private xrSession: any = null;
  private poseData: VRPose;
  private avatarState: AvatarState;
  private physics: PhysicsSimulation;

  private constructor() {
    this.poseData = this.getDefaultPose();
    this.avatarState = {
      lucyMode: "Analyst",
      emmaMode: "Companion",
      lucyPosture: "upright",
      emmaPosture: "supportive",
      lucyExpression: "focused",
      emmaExpression: "empathetic",
    };
    this.physics = {
      gravity: 9.81,
      torque: { pitch: 0, yaw: 0, roll: 0 },
      massCompensation: true,
      stabilizationFactor: 0.95,
    };
    if (typeof window !== "undefined") {
      this.checkWebXRSupport();
    }
  }

  public static getInstance(): VRBridgeManager {
    if (!VRBridgeManager.instance) {
      VRBridgeManager.instance = new VRBridgeManager();
    }
    return VRBridgeManager.instance;
  }

  private checkWebXRSupport() {
    if (navigator && (navigator as any).xr) {
      (navigator as any).xr.isSessionSupported("immersive-vr").then((supported: boolean) => {
        this.webXRSupported = supported;
        console.log(`[VRBridge] WebXR immersive-vr support: ${supported}`);
      });
    }
  }

  private getDefaultPose(): VRPose {
    return {
      headset: { x: 0, y: 1.6, z: 0, rx: 0, ry: 0, rz: 0 },
      leftHand: { x: -0.3, y: 1.0, z: -0.2, gesture: "open", trustScore: 1.0 },
      rightHand: { x: 0.3, y: 1.0, z: -0.2, gesture: "grip", trustScore: 1.0 },
      anchors: [
        { id: "desk_anchor", x: 0, y: 0.75, z: -0.5, type: "physical_table" },
        { id: "simulation_focus", x: 0, y: 1.2, z: -0.8, type: "spatial_node" },
      ],
    };
  }

  public isSessionActive(): boolean {
    return this.activeSession;
  }

  public getWebXRSupport(): boolean {
    return this.webXRSupported;
  }

  public async startXRSession(): Promise<boolean> {
    if (this.activeSession) return true;
    console.log("[VRBridge] Initializing Meta Quest Link / OpenXR Emulation...");
    
    // Simulate connection
    this.activeSession = true;
    this.pushLocalTelemetry();
    return true;
  }

  public stopXRSession() {
    this.activeSession = false;
    console.log("[VRBridge] OpenXR Session Terminated.");
  }

  /**
   * Ingest Pose and Hand Tracking Telemetry from Headset/WebXR Space
   */
  public updatePose(updates: Partial<VRPose>) {
    this.poseData = { ...this.poseData, ...updates };
    this.pushLocalTelemetry();
  }

  /**
   * Update Avatar States for Lucy and Emma (Co-Embodiment Synced)
   */
  public updateAvatarState(updates: Partial<AvatarState>) {
    this.avatarState = { ...this.avatarState, ...updates };
    this.pushLocalTelemetry();
  }

  /**
   * Adjust Spatial Physics Hooks (Torque, Mass, Compensation)
   */
  public updatePhysics(updates: Partial<PhysicsSimulation>) {
    this.physics = { ...this.physics, ...updates };
    this.pushLocalTelemetry();
  }

  /**
   * Spawns a 3D overlay or physical interactive node in VR workspace
   */
  public dispatchVRCommand(cmdType: string, payload: any): Promise<any> {
    console.log(`[VRBridge] Dispatching VR Command: ${cmdType}`, payload);
    return fetch("/api/vr-command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: cmdType, payload }),
    }).then((res) => res.json());
  }

  /**
   * Post state to server-side SQLite so background daemons / Python can observe and respond
   */
  private async pushLocalTelemetry() {
    if (typeof window === "undefined") return;
    try {
      await fetch("/api/vr-bridge/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active: this.activeSession,
          pose: this.poseData,
          avatars: this.avatarState,
          physics: this.physics,
        }),
      });
    } catch (e) {
      console.warn("[VRBridge] Failed to sync VR telemetry to backend:", e);
    }
  }
}
