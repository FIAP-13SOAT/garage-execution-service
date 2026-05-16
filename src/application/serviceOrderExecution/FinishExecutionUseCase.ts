import type { UUID } from '../../shared/types/UUID.js';
import { ServiceOrderExecution } from '../../domain/serviceOrderExecution/ServiceOrderExecution.js';
import { ExecutionNotFoundException } from './exceptions/ExecutionNotFoundException.js';
import type { ServiceOrderExecutionGateway } from '../../adapters/outbound/database/ServiceOrderExecutionGateway.js';
import type { ExecutionEventProducer } from '../../adapters/outbound/messaging/ExecutionEventProducer.js';

export type Command = {
  serviceOrderId: UUID;
};

export class FinishExecutionUseCase {
  constructor(
    private readonly gateway: ServiceOrderExecutionGateway,
    private readonly eventProducer: ExecutionEventProducer,
  ) {}

  async execute(command: Command): Promise<ServiceOrderExecution> {
    const execution = await this.gateway.findByServiceOrderId(command.serviceOrderId);

    if (!execution) {
      throw new ExecutionNotFoundException(command.serviceOrderId);
    }

    execution.finish();
    await this.gateway.save(execution);
    await this.eventProducer.sendExecucaoConcluida({ serviceOrderId: command.serviceOrderId });

    return execution;
  }
}
