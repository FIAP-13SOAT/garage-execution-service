import { describe, it, expect } from 'vitest';
import { ExecutionQueue } from '../ExecutionQueue.js';
import { ExecutionQueueStatus } from '../ExecutionQueueStatus.js';
import { ExecutionQueueAlreadyCancelledException } from '../exceptions/ExecutionQueueAlreadyCancelledException.js';
import { ExecutionQueueAlreadyCompletedException } from '../exceptions/ExecutionQueueAlreadyCompletedException.js';
import { toUUID } from '../../../shared/types/UUID.js';

const orderId = toUUID('order-abc');
const stockId = toUUID('stock-1');

describe('ExecutionQueue', () => {
  it('should create with PENDING status and stockItems', () => {
    const queue = new ExecutionQueue({
      serviceOrderId: orderId,
      stockItems: [{ stockId, quantity: 2 }],
    });

    expect(queue.serviceOrderId).toBe(orderId);
    expect(queue.stockItems).toHaveLength(1);
    expect(queue.status).toBe(ExecutionQueueStatus.PENDING);
    expect(queue.isPending()).toBe(true);
  });

  it('should transition to PROCESSING', () => {
    const queue = new ExecutionQueue({ serviceOrderId: orderId, stockItems: [] });
    queue.startProcessing();

    expect(queue.status).toBe(ExecutionQueueStatus.PROCESSING);
    expect(queue.isProcessing()).toBe(true);
  });

  it('should transition to COMPLETED', () => {
    const queue = new ExecutionQueue({ serviceOrderId: orderId, stockItems: [] });
    queue.startProcessing();
    queue.complete();

    expect(queue.status).toBe(ExecutionQueueStatus.COMPLETED);
  });

  it('should cancel from PENDING', () => {
    const queue = new ExecutionQueue({ serviceOrderId: orderId, stockItems: [] });
    queue.cancel();

    expect(queue.isCancelled()).toBe(true);
  });

  it('should cancel from PROCESSING', () => {
    const queue = new ExecutionQueue({ serviceOrderId: orderId, stockItems: [] });
    queue.startProcessing();
    queue.cancel();

    expect(queue.isCancelled()).toBe(true);
  });

  it('should throw when cancelling a COMPLETED queue', () => {
    const queue = new ExecutionQueue({ serviceOrderId: orderId, stockItems: [] });
    queue.startProcessing();
    queue.complete();

    expect(() => queue.cancel()).toThrow(ExecutionQueueAlreadyCompletedException);
  });

  it('should throw when cancelling an already CANCELLED queue', () => {
    const queue = new ExecutionQueue({ serviceOrderId: orderId, stockItems: [] });
    queue.cancel();

    expect(() => queue.cancel()).toThrow(ExecutionQueueAlreadyCancelledException);
  });

  it('should reconstruct from persisted props', () => {
    const queue = new ExecutionQueue({
      serviceOrderId: orderId,
      stockItems: [{ stockId, quantity: 5 }],
      status: ExecutionQueueStatus.PROCESSING,
    });

    expect(queue.isProcessing()).toBe(true);
    expect(queue.stockItems[0]!.quantity).toBe(5);
  });
});
