import type { UUID } from '../../shared/types/UUID.js';
import { RepairLog } from '../../domain/repairLog/RepairLog.js';
import type { RepairLogGateway } from '../../adapters/outbound/database/RepairLogGateway.js';

export type Command = {
  serviceOrderId: UUID;
  event: string;
  details?: Record<string, unknown>;
};

export class LogRepairEventUseCase {
  constructor(private readonly gateway: RepairLogGateway) {}

  async execute(command: Command): Promise<RepairLog> {
    const log = new RepairLog({
      serviceOrderId: command.serviceOrderId,
      event: command.event,
      details: command.details,
    });

    await this.gateway.save(log);
    return log;
  }
}
