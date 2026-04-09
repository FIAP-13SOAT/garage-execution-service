import type { UUID } from '../../shared/types/UUID.js';
import { toUUID } from '../../shared/types/UUID.js';
import { ServiceOrderExecution } from '../../domain/serviceOrderExecution/ServiceOrderExecution.js';
import { AppError } from '../../shared/errors/AppError.js';
import type { ServiceOrderExecutionGateway } from '../../adapters/outbound/database/ServiceOrderExecutionGateway.js';

export type Command = {
  serviceOrderId: UUID;
};

export class StartExecutionUseCase {
  constructor(private readonly gateway: ServiceOrderExecutionGateway) {}

  async execute(command: Command): Promise<ServiceOrderExecution> {
    const existing = await this.gateway.findByServiceOrderId(command.serviceOrderId);

    if (existing?.isRunning()) {
      throw new AppError(
        `Execution already in progress for service order ${command.serviceOrderId}`,
      );
    }

    if (existing?.isFinished()) {
      throw new AppError(
        `Execution already finished for service order ${command.serviceOrderId}`,
      );
    }

    const execution = new ServiceOrderExecution({
      serviceOrderId: toUUID(command.serviceOrderId),
    });
    execution.start();
    await this.gateway.save(execution);

    return execution;
  }
}
