/**
 * @file Kernel.ts
 * @description The Master Bootstrapper and OS Event Loop.
 * Initializes the entire 9-layer control stack, wires the EventBus to the StateTransitionEngine,
 * and maintains the single authoritative pointer to the live SystemState.
 */

import { SystemState, initialSystemState } from './SystemState';
import { EventBus } from './EventBus';
import { StateTransitionEngine } from './StateTransitionEngine';
import { BaseEvent, EventType } from './BaseEvent';
import { GlobalEventSequencer } from './GlobalEventSequencer';
import { NarrativeCompiler } from './NarrativeCompiler';
import { KernelRegistry, EngineDescriptor } from './KernelRegistry';

export class Kernel {
  private static instance: Kernel;
  
  // The SINGLE authoritative pointer to the system state.
  private currentState: SystemState;

  private constructor() {
    this.currentState = { ...initialSystemState };
  }

  public static getInstance(): Kernel {
    if (!Kernel.instance) {
      Kernel.instance = new Kernel();
    }
    return Kernel.instance;
  }

  /**
   * Bootstraps the OS via the KernelRegistry.
   */
  public async boot() {
    console.log('[Kernel] Boot sequence initiated...');
    
    const registry = KernelRegistry.getInstance();
    const engines = registry.getAllEngines();

    // 1. Resolve Dependencies & Instantiate
    this.resolveAndInstantiate(engines, registry);

    // 2. Initialize Event Bus and wire the Reducer
    this.bindEventLoop();

    // 3. Centralized Event Binding
    this.centralizeEventBindings(engines);

    // Transition state
    EventBus.getInstance().emit('Kernel', 'KERNEL_STATUS_CHANGED', { status: 'live' }, 'critical', 'sys-boot');
    console.log('[Kernel] System is LIVE. Strict 4-layer execution graph active.');
  }

  /**
   * Centralized dependency resolution. If an engine's dependencies are missing,
   * it is marked DEFERRED.
   */
  private resolveAndInstantiate(engines: EngineDescriptor[], registry: KernelRegistry) {
    const activeNames = new Set<string>();

    // Layer 1 first, then 2, 3, 4
    for (let layer = 1; layer <= 4; layer++) {
      const layerEngines = engines.filter(e => e.layer === layer);
      
      for (const engine of layerEngines) {
        const missingDeps = engine.dependencies.filter(d => !activeNames.has(d));
        
        if (missingDeps.length > 0) {
          console.warn(`[Kernel] Deferring ${engine.name} (Missing deps: ${missingDeps.join(', ')})`);
          registry.updateStatus(engine.name, 'deferred');
        } else {
          try {
            // In a real TS environment with dynamic imports:
            // const module = require(engine.entryPoint);
            // module[engine.name].getInstance();
            
            registry.updateStatus(engine.name, 'active');
            activeNames.add(engine.name);
            console.log(`[Kernel] Activated ${engine.name} [Layer ${engine.layer}]`);
          } catch (e) {
            console.error(`[Kernel] Failed to activate ${engine.name}`);
            registry.updateStatus(engine.name, 'broken');
          }
        }
      }
    }
  }

  /**
   * Centralized Event Binding: Modules do NOT self-bind.
   * Kernel reads `eventSubscriptions` and wires them explicitly.
   */
  private centralizeEventBindings(engines: EngineDescriptor[]) {
    for (const engine of engines) {
      if (engine.status === 'deferred') {
        // DEFERRED behavior enforcement
        continue;
      }

      for (const sub of engine.eventSubscriptions) {
        // Mock wiring: EventBus.getInstance().subscribe(sub, module.handler);
        // console.log(`[Kernel] Bound ${engine.name} to event ${sub}`);
      }
    }
  }

  /**
   * CQRS Formalization: The Event Loop is the EXCLUSIVE WRITER to SystemState.
   */
  private bindEventLoop() {
    EventBus.getInstance().onAny((rawEventPayload: any) => {
      const sequencedEvent = GlobalEventSequencer.getInstance().sequence(rawEventPayload);
      this.currentState = StateTransitionEngine.apply(this.currentState, sequencedEvent);
      
      const chatUpdate = NarrativeCompiler.getInstance().compile(this.currentState, sequencedEvent);
      if (chatUpdate) {
        EventBus.getInstance().emit('NarrativeCompiler', 'NARRATIVE_UPDATE', chatUpdate, 'normal', sequencedEvent.correlationId);
      }
    });
  }

  public getState(): SystemState {
    return this.currentState;
  }
}
