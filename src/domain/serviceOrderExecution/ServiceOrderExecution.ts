import type { UUID } from '../../shared/types/UUID.js';
import { ExecutionNotStartedException } from './exceptions/ExecutionNotStartedException.js';

export interface ServiceOrderExecutionProps {
  serviceOrderId: UUID;
  startDate?: Date;
  endDate?: Date;
  executionTimeMs?: number;
}

export class ServiceOrderExecution {
  readonly serviceOrderId: UUID;
  startDate: Date | null;
  endDate: Date | null;
  executionTimeMs: number;

  constructor(props: ServiceOrderExecutionProps) {
    this.serviceOrderId = props.serviceOrderId;
    this.startDate = props.startDate ?? null;
    this.endDate = props.endDate ?? null;
    this.executionTimeMs = props.executionTimeMs ?? 0;
  }

  start(): void {
    this.startDate = new Date();
  }

  finish(): void {
    if (!this.startDate) {
      throw new ExecutionNotStartedException(this.serviceOrderId);
    }
    this.endDate = new Date();
    this.executionTimeMs = this.endDate.getTime() - this.startDate.getTime();
  }

  isRunning(): boolean {
    return this.startDate !== null && this.endDate === null;
  }

  isFinished(): boolean {
    return this.endDate !== null;
  }
}
