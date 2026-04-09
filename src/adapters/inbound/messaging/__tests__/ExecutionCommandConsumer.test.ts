import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionCommandConsumer } from '../ExecutionCommandConsumer.js';
import { ExecutionQueue } from '../../../../domain/executionQueue/ExecutionQueue.js';
import { ExecutionQueueStatus } from '../../../../domain/executionQueue/ExecutionQueueStatus.js';
import { toUUID } from '../../../../shared/types/UUID.js';
import type { EnqueueServiceOrderUseCase } from '../../../../application/executionQueue/EnqueueServiceOrderUseCase.js';
import type { CancelExecutionUseCase } from '../../../../application/executionQueue/CancelExecutionUseCase.js';
import type { StockCommandProducer } from '../../../outbound/messaging/StockCommandProducer.js';
import type { ExecutionReplyProducer } from '../../../outbound/messaging/ExecutionReplyProducer.js';
import type { Channel } from 'amqplib';

const orderId = toUUID('order-123');
const stockId = toUUID('stock-1');

const makeChannel = (): Channel =>
  ({
    assertQueue: vi.fn().mockResolvedValue(undefined),
    consume: vi.fn(),
    ack: vi.fn(),
    nack: vi.fn(),
    sendToQueue: vi.fn().mockReturnValue(true),
  }) as unknown as Channel;

const makeEnqueue = (): EnqueueServiceOrderUseCase =>
  ({ execute: vi.fn() }) as unknown as EnqueueServiceOrderUseCase;

const makeCancel = (): CancelExecutionUseCase =>
  ({ execute: vi.fn() }) as unknown as CancelExecutionUseCase;

const makeStockProducer = (): StockCommandProducer =>
  ({
    sendReservarEstoque: vi.fn().mockResolvedValue(undefined),
    sendRestaurarEstoque: vi.fn().mockResolvedValue(undefined),
  }) as unknown as StockCommandProducer;

const makeReplyProducer = (): ExecutionReplyProducer =>
  ({
    sendOsEnfileirada: vi.fn().mockResolvedValue(undefined),
    sendExecucaoFalha: vi.fn().mockResolvedValue(undefined),
  }) as unknown as ExecutionReplyProducer;

describe('ExecutionCommandConsumer', () => {
  let channel: Channel;
  let enqueue: EnqueueServiceOrderUseCase;
  let cancel: CancelExecutionUseCase;
  let stockProducer: StockCommandProducer;
  let replyProducer: ExecutionReplyProducer;
  let consumer: ExecutionCommandConsumer;

  beforeEach(() => {
    channel = makeChannel();
    enqueue = makeEnqueue();
    cancel = makeCancel();
    stockProducer = makeStockProducer();
    replyProducer = makeReplyProducer();
    consumer = new ExecutionCommandConsumer(
      channel,
      enqueue,
      cancel,
      stockProducer,
      replyProducer,
    );
  });

  it('should assert queue and start consuming on start()', async () => {
    await consumer.start();

    expect(channel.assertQueue).toHaveBeenCalledWith('execution.commands', { durable: true });
    expect(channel.consume).toHaveBeenCalledWith('execution.commands', expect.any(Function));
  });

  describe('ENFILEIRAR_OS', () => {
    it('should enqueue OS and send RESERVAR_ESTOQUE', async () => {
      vi.mocked(enqueue.execute).mockResolvedValue(
        new ExecutionQueue({
          serviceOrderId: orderId,
          stockItems: [{ stockId, quantity: 3 }],
        }),
      );

      const msg = {
        content: Buffer.from(
          JSON.stringify({
            type: 'ENFILEIRAR_OS',
            payload: {
              serviceOrderId: orderId,
              stockItems: [{ stockItemId: stockId, quantity: 3 }],
            },
          }),
        ),
      };

      vi.mocked(channel.consume).mockImplementation((_q, handler) => {
        handler(msg as never);
        return Promise.resolve({} as never);
      });

      await consumer.start();

      await vi.waitFor(() => {
        expect(enqueue.execute).toHaveBeenCalledWith({
          serviceOrderId: orderId,
          stockItems: [{ stockId, quantity: 3 }],
        });
        expect(stockProducer.sendReservarEstoque).toHaveBeenCalledWith({
          serviceOrderId: orderId,
          items: [{ stockId, quantity: 3 }],
        });
      });
    });
  });

  describe('CANCELAR_EXECUCAO', () => {
    it('should cancel execution and send RESTAURAR_ESTOQUE', async () => {
      const cancelledQueue = new ExecutionQueue({
        serviceOrderId: orderId,
        stockItems: [{ stockId, quantity: 2 }],
        status: ExecutionQueueStatus.CANCELLED,
      });
      vi.mocked(cancel.execute).mockResolvedValue(cancelledQueue);

      const msg = {
        content: Buffer.from(
          JSON.stringify({
            type: 'CANCELAR_EXECUCAO',
            payload: { serviceOrderId: orderId },
          }),
        ),
      };

      vi.mocked(channel.consume).mockImplementation((_q, handler) => {
        handler(msg as never);
        return Promise.resolve({} as never);
      });

      await consumer.start();

      await vi.waitFor(() => {
        expect(cancel.execute).toHaveBeenCalledWith({ serviceOrderId: orderId });
        expect(stockProducer.sendRestaurarEstoque).toHaveBeenCalledWith({
          serviceOrderId: orderId,
          items: [{ stockId, quantity: 2 }],
        });
      });
    });
  });
});
