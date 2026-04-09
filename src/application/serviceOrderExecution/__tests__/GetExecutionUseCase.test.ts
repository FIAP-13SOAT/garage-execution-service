import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetExecutionUseCase } from '../GetExecutionUseCase.js';
import { ServiceOrderExecution } from '../../../domain/serviceOrderExecution/ServiceOrderExecution.js';
import { ExecutionNotFoundException } from '../exceptions/ExecutionNotFoundException.js';
import { toUUID } from '../../../shared/types/UUID.js';
import type { ServiceOrderExecutionGateway } from '../../../adapters/outbound/database/ServiceOrderExecutionGateway.js';

const orderId = toUUID('order-123');

const makeGateway = (): ServiceOrderExecutionGateway => ({
  save: vi.fn(),
  findByServiceOrderId: vi.fn(),
});

describe('GetExecutionUseCase', () => {
  let gateway: ServiceOrderExecutionGateway;
  let useCase: GetExecutionUseCase;

  beforeEach(() => {
    gateway = makeGateway();
    useCase = new GetExecutionUseCase(gateway);
  });

  it('should return execution when found', async () => {
    const execution = new ServiceOrderExecution({
      serviceOrderId: orderId,
      startDate: new Date('2026-01-01T10:00:00Z'),
    });
    vi.mocked(gateway.findByServiceOrderId).mockResolvedValue(execution);

    const result = await useCase.execute({ serviceOrderId: orderId });

    expect(result.serviceOrderId).toBe(orderId);
    expect(result.isRunning()).toBe(true);
  });

  it('should throw ExecutionNotFoundException when not found', async () => {
    vi.mocked(gateway.findByServiceOrderId).mockResolvedValue(null);

    await expect(useCase.execute({ serviceOrderId: orderId })).rejects.toThrow(
      ExecutionNotFoundException,
    );
  });
});
