import type { UUID } from '../../shared/types/UUID.js';
import { RepairLog } from '../../domain/repairLog/RepairLog.js';
import type { RepairLogGateway } from '../../adapters/outbound/database/RepairLogGateway.js';

export type Command = {
  serviceOrderId: UUID;
};

export class ListRepairLogsUseCase {
  constructor(private readonly gateway: RepairLogGateway) {}

  async execute(command: Command): Promise<RepairLog[]> {
    return this.gateway.listByServiceOrderId(command.serviceOrderId);
  }
}
