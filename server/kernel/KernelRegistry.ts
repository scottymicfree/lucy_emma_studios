/**
 * @file KernelRegistry.ts
 * @description The Single Source of Truth for runtime execution.
 * No engine operates, binds to the EventBus, or receives ExecutionRequests
 * unless explicitly registered and activated by the Kernel via this registry.
 */

export interface EngineDescriptor {
  name: string;
  layer: 1 | 2 | 3 | 4;
  dependencies: string[];
  status: 'missing' | 'partial' | 'active' | 'broken' | 'deferred';
  entryPoint: string;
  eventSubscriptions: string[];
  permissions: string[];
}

export class KernelRegistry {
  private static instance: KernelRegistry;
  
  // The authoritative map of all physical OS components
  private engines: Map<string, EngineDescriptor> = new Map();

  private constructor() {
    this.populateManifest();
  }

  public static getInstance(): KernelRegistry {
    if (!KernelRegistry.instance) {
      KernelRegistry.instance = new KernelRegistry();
    }
    return KernelRegistry.instance;
  }

  private populateManifest() {
    // LAYER 1: Kernel Truth Layer
    this.register({ name: 'SystemState', layer: 1, dependencies: [], status: 'partial', entryPoint: './SystemState', eventSubscriptions: [], permissions: ['CORE'] });
    this.register({ name: 'EventBus', layer: 1, dependencies: [], status: 'partial', entryPoint: './EventBus', eventSubscriptions: [], permissions: ['CORE'] });
    this.register({ name: 'StateTransitionEngine', layer: 1, dependencies: ['SystemState', 'EventBus'], status: 'partial', entryPoint: './StateTransitionEngine', eventSubscriptions: [], permissions: ['CORE'] });
    this.register({ name: 'GlobalEventSequencer', layer: 1, dependencies: [], status: 'partial', entryPoint: './GlobalEventSequencer', eventSubscriptions: [], permissions: ['CORE'] });
    this.register({ name: 'ExecutionFence', layer: 1, dependencies: ['ExecutionAuthorityLayer'], status: 'partial', entryPoint: './ExecutionFence', eventSubscriptions: [], permissions: ['EXECUTE'] });
    this.register({ name: 'ExecutionAuthorityLayer', layer: 1, dependencies: ['CapabilityManager', 'ResourceManager'], status: 'partial', entryPoint: './ExecutionAuthorityLayer', eventSubscriptions: [], permissions: ['EXECUTE'] });
    this.register({ name: 'KernelScheduler', layer: 1, dependencies: ['ExecutionFence'], status: 'partial', entryPoint: './KernelScheduler', eventSubscriptions: [], permissions: ['CORE'] });
    this.register({ name: 'FAE', layer: 1, dependencies: ['ToolRealityChecker'], status: 'partial', entryPoint: './FAE', eventSubscriptions: ['REALITY_EVALUATED'], permissions: ['CORE'] });
    
    // LAYER 2: Control Intelligence Layer
    this.register({ name: 'CapabilityManager', layer: 2, dependencies: [], status: 'partial', entryPoint: './CapabilityManager', eventSubscriptions: [], permissions: ['CORE'] });
    this.register({ name: 'ResourceManager', layer: 2, dependencies: [], status: 'partial', entryPoint: './ResourceManager', eventSubscriptions: [], permissions: ['CORE'] });
    this.register({ name: 'ToolRealityChecker', layer: 2, dependencies: [], status: 'partial', entryPoint: './ToolRealityChecker', eventSubscriptions: ['TOOL_RESULT'], permissions: ['READ_ALL'] });
    this.register({ name: 'EmmaGovernance', layer: 2, dependencies: [], status: 'partial', entryPoint: './Emma', eventSubscriptions: ['POLICY_REQUEST'], permissions: ['POLICY_OVERRIDE'] });
    this.register({ name: 'LucyRuntime', layer: 2, dependencies: ['EmmaGovernance'], status: 'partial', entryPoint: './Lucy', eventSubscriptions: ['TASK_PROPOSED'], permissions: ['PROPOSE_EXECUTION'] });
    this.register({ name: 'MeshOrchestrator', layer: 2, dependencies: ['KernelScheduler'], status: 'partial', entryPoint: './MeshOrchestrator', eventSubscriptions: ['NODE_DEPENDENCIES_MET'], permissions: ['SPAWN_NODE'] });
    this.register({ name: 'AZR', layer: 2, dependencies: ['EmmaGovernance', 'ShadowLayer'], status: 'partial', entryPoint: './AZR', eventSubscriptions: ['AZR_TASK_SPAWNED'], permissions: ['SELF_EDIT'] });
    this.register({ name: 'RepairRouter', layer: 2, dependencies: ['AZR'], status: 'partial', entryPoint: './RepairRouter', eventSubscriptions: ['REPAIR_REQUIRED'], permissions: ['ROUTE_FAILURE'] });

    // LAYER 3: Transformation Layer
    this.register({ name: 'NeuromorphicEncoder', layer: 3, dependencies: [], status: 'partial', entryPoint: './NeuromorphicEncoder', eventSubscriptions: ['RAW_TELEMETRY'], permissions: [] });
    this.register({ name: 'HolographicMemory', layer: 3, dependencies: [], status: 'partial', entryPoint: './HolographicMemory', eventSubscriptions: ['AZR_PROPOSAL'], permissions: [] });
    this.register({ name: 'TemporalCausalityGraph', layer: 3, dependencies: ['EventBus'], status: 'partial', entryPoint: './TemporalCausality', eventSubscriptions: ['ALL_EVENTS'], permissions: [] });
    this.register({ name: 'CapabilityDecayEngine', layer: 3, dependencies: ['CapabilityManager'], status: 'partial', entryPoint: './CapabilityDecay', eventSubscriptions: ['EXECUTION_COMPLETE'], permissions: [] });
    this.register({ name: 'RelativisticMapper', layer: 3, dependencies: [], status: 'partial', entryPoint: './RelativisticMapper', eventSubscriptions: ['NETWORK_LOG'], permissions: [] });
    this.register({ name: 'SovereignGraphMemory', layer: 3, dependencies: [], status: 'partial', entryPoint: './SovereignGraphMemory', eventSubscriptions: [], permissions: ['READ_MEMORY', 'WRITE_MEMORY'] });
    this.register({ name: 'ShadowLayer', layer: 3, dependencies: [], status: 'partial', entryPoint: './ShadowLayer', eventSubscriptions: [], permissions: ['GIT_EXEC'] });

    // LAYER 4: Presentation Layer
    this.register({ name: 'DeviceGateway', layer: 4, dependencies: ['CapabilityManager'], status: 'partial', entryPoint: './DeviceGateway', eventSubscriptions: [], permissions: ['HARDWARE_READ'] });
    this.register({ name: 'NarrativeCompiler', layer: 4, dependencies: [], status: 'partial', entryPoint: './NarrativeCompiler', eventSubscriptions: ['STATE_TRANSITION'], permissions: [] });
    this.register({ name: 'WebSocketGateway', layer: 4, dependencies: ['NarrativeCompiler'], status: 'partial', entryPoint: './WebSocketGateway', eventSubscriptions: ['NARRATIVE_UPDATE'], permissions: [] });
    this.register({ name: 'SonificationEngine', layer: 4, dependencies: ['RelativisticMapper'], status: 'partial', entryPoint: './SonificationEngine', eventSubscriptions: ['MASS_MAP_GENERATED'], permissions: [] });
  }

  private register(descriptor: EngineDescriptor) {
    this.engines.set(descriptor.name, descriptor);
  }

  public getDescriptor(name: string): EngineDescriptor | undefined {
    return this.engines.get(name);
  }

  public updateStatus(name: string, status: EngineDescriptor['status']) {
    const desc = this.engines.get(name);
    if (desc) {
      desc.status = status;
      this.engines.set(name, desc);
    }
  }

  public getAllEngines(): EngineDescriptor[] {
    return Array.from(this.engines.values());
  }
}
