import type { UUID } from '../../shared/types/UUID.js';
import { ExecutionQueue } from '../../domain/executionQueue/ExecutionQueue.js';
import { ExecutionQueueNotFoundException } from './exceptions/ExecutionQueueNotFoundException.js';
import type { ExecutionQueueGateway } from '../../adapters/outbound/database/ExecutionQueueGateway.js';

export type Command = {
  serviceOrderId: UUID;
};

export class CancelExecutionUseCase {
  constructor(private readonly gateway: ExecutionQueueGateway) {}

  async execute(command: Command): Promise<ExecutionQueue> {
    const queue = await this.gateway.findByServiceOrderId(command.serviceOrderId);

    if (!queue) {
      throw new ExecutionQueueNotFoundException(command.serviceOrderId);
    }

    queue.cancel();
    await this.gateway.save(queue);

    return queue;
  }
}
