import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogRepairEventUseCase } from '../LogRepairEventUseCase.js';
import { toUUID } from '../../../shared/types/UUID.js';
import type { RepairLogGateway } from '../../../adapters/outbound/database/RepairLogGateway.js';

const orderId = toUUID('order-123');

const makeGateway = (): RepairLogGateway => ({
  save: vi.fn(),
  listByServiceOrderId: vi.fn(),
});

describe('LogRepairEventUseCase', () => {
  let gateway: RepairLogGateway;
  let useCase: LogRepairEventUseCase;

  beforeEach(() => {
    gateway = makeGateway();
    useCase = new LogRepairEventUseCase(gateway);
  });

  it('should create and save a repair log', async () => {
    vi.mocked(gateway.save).mockResolvedValue();

    const result = await useCase.execute({
      serviceOrderId: orderId,
      event: 'OIL_CHANGED',
      details: { quantity: '5L' },
    });

    expect(result.serviceOrderId).toBe(orderId);
    expect(result.event).toBe('OIL_CHANGED');
    expect(result.details).toEqual({ quantity: '5L' });
    expect(result.id).toBeDefined();
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(gateway.save).toHaveBeenCalledOnce();
  });

  it('should create a log without details', async () => {
    vi.mocked(gateway.save).mockResolvedValue();

    const result = await useCase.execute({
      serviceOrderId: orderId,
      event: 'INSPECTION_STARTED',
    });

    expect(result.details).toEqual({});
  });
});
