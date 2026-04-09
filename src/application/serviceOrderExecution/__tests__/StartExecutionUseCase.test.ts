import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StartExecutionUseCase } from '../StartExecutionUseCase.js';
import { ServiceOrderExecution } from '../../../domain/serviceOrderExecution/ServiceOrderExecution.js';
import { toUUID } from '../../../shared/types/UUID.js';
import type { ServiceOrderExecutionGateway } from '../../../adapters/outbound/database/ServiceOrderExecutionGateway.js';

const orderId = toUUID('order-123');

const makeGateway = (): ServiceOrderExecutionGateway => ({
  save: vi.fn(),
  findByServiceOrderId: vi.fn(),
});

describe('StartExecutionUseCase', () => {
  let gateway: ServiceOrderExecutionGateway;
  let useCase: StartExecutionUseCase;

  beforeEach(() => {
    gateway = makeGateway();
    useCase = new StartExecutionUseCase(gateway);
  });

  it('should create and start a new execution', async () => {
    vi.mocked(gateway.findByServiceOrderId).mockResolvedValue(null);
    vi.mocked(gateway.save).mockResolvedValue();

    const result = await useCase.execute({ serviceOrderId: orderId });

    expect(result.serviceOrderId).toBe(orderId);
    expect(result.startDate).toBeInstanceOf(Date);
    expect(result.isRunning()).toBe(true);
    expect(gateway.save).toHaveBeenCalledOnce();
  });

  it('should throw if execution is already running', async () => {
    const running = new ServiceOrderExecution({
      serviceOrderId: orderId,
      startDate: new Date(),
    });
    vi.mocked(gateway.findByServiceOrderId).mockResolvedValue(running);

    await expect(useCase.execute({ serviceOrderId: orderId })).rejects.toThrow(
      'Execution already in progress',
    );
  });

  it('should throw if execution is already finished', async () => {
    const finished = new ServiceOrderExecution({
      serviceOrderId: orderId,
      startDate: new Date('2026-01-01T10:00:00Z'),
      endDate: new Date('2026-01-01T12:00:00Z'),
      executionTimeMs: 7200000,
    });
    vi.mocked(gateway.findByServiceOrderId).mockResolvedValue(finished);

    await expect(useCase.execute({ serviceOrderId: orderId })).rejects.toThrow(
      'Execution already finished',
    );
  });
});
