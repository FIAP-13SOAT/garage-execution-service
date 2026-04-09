import type { UUID } from '../../shared/types/UUID.js';
import { ExecutionQueueStatus } from './ExecutionQueueStatus.js';
import { ExecutionQueueAlreadyCancelledException } from './exceptions/ExecutionQueueAlreadyCancelledException.js';
import { ExecutionQueueAlreadyCompletedException } from './exceptions/ExecutionQueueAlreadyCompletedException.js';

export interface StockItem {
  stockId: UUID;
  quantity: number;
}

export interface ExecutionQueueProps {
  serviceOrderId: UUID;
  stockItems: StockItem[];
  status?: ExecutionQueueStatus;
}

export class ExecutionQueue {
  readonly serviceOrderId: UUID;
  readonly stockItems: StockItem[];
  status: ExecutionQueueStatus;

  constructor(props: ExecutionQueueProps) {
    this.serviceOrderId = props.serviceOrderId;
    this.stockItems = props.stockItems;
    this.status = props.status ?? ExecutionQueueStatus.PENDING;
  }

  startProcessing(): void {
    this.status = ExecutionQueueStatus.PROCESSING;
  }

  complete(): void {
    this.status = ExecutionQueueStatus.COMPLETED;
  }

  cancel(): void {
    if (this.status === ExecutionQueueStatus.COMPLETED) {
      throw new ExecutionQueueAlreadyCompletedException(this.serviceOrderId);
    }
    if (this.status === ExecutionQueueStatus.CANCELLED) {
      throw new ExecutionQueueAlreadyCancelledException(this.serviceOrderId);
    }
    this.status = ExecutionQueueStatus.CANCELLED;
  }

  isPending(): boolean {
    return this.status === ExecutionQueueStatus.PENDING;
  }

  isProcessing(): boolean {
    return this.status === ExecutionQueueStatus.PROCESSING;
  }

  isCancelled(): boolean {
    return this.status === ExecutionQueueStatus.CANCELLED;
  }
}
