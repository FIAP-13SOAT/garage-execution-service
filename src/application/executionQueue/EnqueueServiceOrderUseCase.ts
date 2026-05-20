import type { UUID } from '../../shared/types/UUID.js';
import { ExecutionQueue, type StockItem } from '../../domain/executionQueue/ExecutionQueue.js';
import type { ExecutionQueueGateway } from '../../adapters/outbound/database/ExecutionQueueGateway.js';

export type Command = {
  serviceOrderId: UUID;
  stockItems: StockItem[];
};

export class EnqueueServiceOrderUseCase {
  constructor(private readonly gateway: ExecutionQueueGateway) {}

  async execute(command: Command): Promise<ExecutionQueue> {
    const existing = await this.gateway.findByServiceOrderId(command.serviceOrderId);

    if (existing && !existing.isCancelled()) {
      return existing;
    }

    const queue = new ExecutionQueue({
      serviceOrderId: command.serviceOrderId,
      stockItems: command.stockItems,
    });

    await this.gateway.save(queue);
    return queue;
  }
}
