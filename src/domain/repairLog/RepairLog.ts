import type { UUID } from '../../shared/types/UUID.js';
import { newUUID } from '../../shared/types/UUID.js';

export interface RepairLogProps {
  id?: UUID;
  serviceOrderId: UUID;
  event: string;
  details?: Record<string, unknown>;
  timestamp?: Date;
}

export class RepairLog {
  readonly id: UUID;
  readonly serviceOrderId: UUID;
  readonly event: string;
  readonly details: Record<string, unknown>;
  readonly timestamp: Date;

  constructor(props: RepairLogProps) {
    this.id = props.id ?? newUUID();
    this.serviceOrderId = props.serviceOrderId;
    this.event = props.event;
    this.details = props.details ?? {};
    this.timestamp = props.timestamp ?? new Date();
  }
}
