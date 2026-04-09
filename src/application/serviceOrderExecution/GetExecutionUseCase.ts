import type { UUID } from '../../shared/types/UUID.js';
import { ServiceOrderExecution } from '../../domain/serviceOrderExecution/ServiceOrderExecution.js';
import { ExecutionNotFoundException } from './exceptions/ExecutionNotFoundException.js';
import type { ServiceOrderExecutionGateway } from '../../adapters/outbound/database/ServiceOrderExecutionGateway.js';

export type Command = {
  serviceOrderId: UUID;
};

export class GetExecutionUseCase {
  constructor(private readonly gateway: ServiceOrderExecutionGateway) {}

  async execute(command: Command): Promise<ServiceOrderExecution> {
    const execution = await this.gateway.findByServiceOrderId(command.serviceOrderId);

    if (!execution) {
      throw new ExecutionNotFoundException(command.serviceOrderId);
    }

    return execution;
  }
}
