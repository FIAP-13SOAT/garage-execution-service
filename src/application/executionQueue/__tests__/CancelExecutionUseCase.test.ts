import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CancelExecutionUseCase } from '../CancelExecutionUseCase.js';
import { ExecutionQueue } from '../../../domain/executionQueue/ExecutionQueue.js';
import { ExecutionQueueStatus } from '../../../domain/executionQueue/ExecutionQueueStatus.js';
import { ExecutionQueueNotFoundException } from '../exceptions/ExecutionQueueNotFoundException.js';
import { toUUID } from '../../../shared/types/UUID.js';
import type { ExecutionQueueGateway } from '../../../adapters/outbound/database/ExecutionQueueGateway.js';

const orderId = toUUID('order-abc');

const makeGateway = (): ExecutionQueueGateway => ({
  save: vi.fn(),
  findByServiceOrderId: vi.fn(),
});

describe('CancelExecutionUseCase', () => {
  let gateway: ExecutionQueueGateway;
  let useCase: CancelExecutionUseCase;

  beforeEach(() => {
    gateway = makeGateway();
    useCase = new CancelExecutionUseCase(gateway);
  });

  it('should cancel a PENDING queue', async () => {
    const queue = new ExecutionQueue({
      serviceOrderId: orderId,
      stockItems: [],
      status: ExecutionQueueStatus.PENDING,
    });
    vi.mocked(gateway.findByServiceOrderId).mockResolvedValue(queue);
    vi.mocked(gateway.save).mockResolvedValue();

    const result = await useCase.execute({ serviceOrderId: orderId });

    expect(result.isCancelled()).toBe(true);
    expect(gateway.save).toHaveBeenCalledOnce();
  });

  it('should cancel a PROCESSING queue', async () => {
    const queue = new ExecutionQueue({
      serviceOrderId: orderId,
      stockItems: [],
      status: ExecutionQueueStatus.PROCESSING,
    });
    vi.mocked(gateway.findByServiceOrderId).mockResolvedValue(queue);
    vi.mocked(gateway.save).mockResolvedValue();

    const result = await useCase.execute({ serviceOrderId: orderId });

    expect(result.isCancelled()).toBe(true);
  });

  it('should throw ExecutionQueueNotFoundException when not found', async () => {
    vi.mocked(gateway.findByServiceOrderId).mockResolvedValue(null);

    await expect(useCase.execute({ serviceOrderId: orderId })).rejects.toThrow(
      ExecutionQueueNotFoundException,
    );
  });

  it('should propagate domain exception when cancelling a COMPLETED queue', async () => {
    const queue = new ExecutionQueue({
      serviceOrderId: orderId,
      stockItems: [],
      status: ExecutionQueueStatus.COMPLETED,
    });
    vi.mocked(gateway.findByServiceOrderId).mockResolvedValue(queue);

    await expect(useCase.execute({ serviceOrderId: orderId })).rejects.toThrow(
      'already completed',
    );
  });
});
