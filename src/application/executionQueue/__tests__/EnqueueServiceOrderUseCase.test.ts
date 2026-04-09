import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnqueueServiceOrderUseCase } from '../EnqueueServiceOrderUseCase.js';
import { ExecutionQueue } from '../../../domain/executionQueue/ExecutionQueue.js';
import { ExecutionQueueStatus } from '../../../domain/executionQueue/ExecutionQueueStatus.js';
import { ExecutionQueueAlreadyExistsException } from '../exceptions/ExecutionQueueAlreadyExistsException.js';
import { toUUID } from '../../../shared/types/UUID.js';
import type { ExecutionQueueGateway } from '../../../adapters/outbound/database/ExecutionQueueGateway.js';

const orderId = toUUID('order-abc');
const stockId = toUUID('stock-1');

const makeGateway = (): ExecutionQueueGateway => ({
  save: vi.fn(),
  findByServiceOrderId: vi.fn(),
});

describe('EnqueueServiceOrderUseCase', () => {
  let gateway: ExecutionQueueGateway;
  let useCase: EnqueueServiceOrderUseCase;

  beforeEach(() => {
    gateway = makeGateway();
    useCase = new EnqueueServiceOrderUseCase(gateway);
  });

  it('should enqueue a new service order', async () => {
    vi.mocked(gateway.findByServiceOrderId).mockResolvedValue(null);
    vi.mocked(gateway.save).mockResolvedValue();

    const result = await useCase.execute({
      serviceOrderId: orderId,
      stockItems: [{ stockId, quantity: 2 }],
    });

    expect(result.serviceOrderId).toBe(orderId);
    expect(result.status).toBe(ExecutionQueueStatus.PENDING);
    expect(result.stockItems).toHaveLength(1);
    expect(gateway.save).toHaveBeenCalledOnce();
  });

  it('should throw when queue already exists and is not cancelled', async () => {
    const existing = new ExecutionQueue({
      serviceOrderId: orderId,
      stockItems: [],
      status: ExecutionQueueStatus.PENDING,
    });
    vi.mocked(gateway.findByServiceOrderId).mockResolvedValue(existing);

    await expect(
      useCase.execute({ serviceOrderId: orderId, stockItems: [] }),
    ).rejects.toThrow(ExecutionQueueAlreadyExistsException);
  });

  it('should allow re-enqueue when existing queue is cancelled', async () => {
    const cancelled = new ExecutionQueue({
      serviceOrderId: orderId,
      stockItems: [],
      status: ExecutionQueueStatus.CANCELLED,
    });
    vi.mocked(gateway.findByServiceOrderId).mockResolvedValue(cancelled);
    vi.mocked(gateway.save).mockResolvedValue();

    const result = await useCase.execute({ serviceOrderId: orderId, stockItems: [] });

    expect(result.status).toBe(ExecutionQueueStatus.PENDING);
  });
});
