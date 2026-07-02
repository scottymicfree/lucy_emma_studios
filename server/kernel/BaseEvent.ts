/**
 * @file BaseEvent.ts
 * @description The universal contract for all events in the OS.
 * Every subsystem MUST emit only BaseEvent-compliant structures.
 */

export type EventType = 
  | 'command' 
  | 'tool_call' 
  | 'tool_result' 
  | 'mesh_event' 
  | 'recovery_event' 
  | 'capability_event'
  | 'device_event'
  | 'system_state_change'
  | 'narrative_update'
  | 'lifecycle';

export interface BaseEvent {
  eventId: string;
  correlationId: string;
  sequenceNumber: number;     // Enforces strict causal ordering
  causalParentId: string;     // The eventId that caused this event
  timestamp: number;
  source: string;
  type: EventType;
  action: string; // e.g. "NODE_SPAWNED", "LEASE_GRANTED"
  payload: any;
}
