import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListRepairLogsUseCase } from '../ListRepairLogsUseCase.js';
import { RepairLog } from '../../../domain/repairLog/RepairLog.js';
import { toUUID } from '../../../shared/types/UUID.js';
import type { RepairLogGateway } from '../../../adapters/outbound/database/RepairLogGateway.js';

const orderId = toUUID('order-123');

const makeGateway = (): RepairLogGateway => ({
  save: vi.fn(),
  listByServiceOrderId: vi.fn(),
});

describe('ListRepairLogsUseCase', () => {
  let gateway: RepairLogGateway;
  let useCase: ListRepairLogsUseCase;

  beforeEach(() => {
    gateway = makeGateway();
    useCase = new ListRepairLogsUseCase(gateway);
  });

  it('should return all logs for a service order', async () => {
    const logs = [
      new RepairLog({ serviceOrderId: orderId, event: 'STARTED' }),
      new RepairLog({ serviceOrderId: orderId, event: 'COMPLETED' }),
    ];
    vi.mocked(gateway.listByServiceOrderId).mockResolvedValue(logs);

    const result = await useCase.execute({ serviceOrderId: orderId });

    expect(result).toHaveLength(2);
    expect(result[0]!.event).toBe('STARTED');
    expect(result[1]!.event).toBe('COMPLETED');
    expect(gateway.listByServiceOrderId).toHaveBeenCalledWith(orderId);
  });

  it('should return empty array when no logs exist', async () => {
    vi.mocked(gateway.listByServiceOrderId).mockResolvedValue([]);

    const result = await useCase.execute({ serviceOrderId: orderId });

    expect(result).toHaveLength(0);
  });
});
