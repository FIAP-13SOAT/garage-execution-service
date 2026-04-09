import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StockReplyConsumer } from '../StockReplyConsumer.js';
import { ExecutionQueue } from '../../../../domain/executionQueue/ExecutionQueue.js';
import { ExecutionQueueStatus } from '../../../../domain/executionQueue/ExecutionQueueStatus.js';
import { toUUID } from '../../../../shared/types/UUID.js';
import type { CancelExecutionUseCase } from '../../../../application/executionQueue/CancelExecutionUseCase.js';
import type { ExecutionReplyProducer } from '../../../outbound/messaging/ExecutionReplyProducer.js';
import type { Channel } from 'amqplib';

const orderId = toUUID('order-123');

const makeChannel = (): Channel =>
  ({
    assertQueue: vi.fn().mockResolvedValue(undefined),
    consume: vi.fn(),
    ack: vi.fn(),
    nack: vi.fn(),
    sendToQueue: vi.fn().mockReturnValue(true),
  }) as unknown as Channel;

const makeCancel = (): CancelExecutionUseCase =>
  ({ execute: vi.fn() }) as unknown as CancelExecutionUseCase;

const makeReplyProducer = (): ExecutionReplyProducer =>
  ({
    sendOsEnfileirada: vi.fn().mockResolvedValue(undefined),
    sendExecucaoFalha: vi.fn().mockResolvedValue(undefined),
  }) as unknown as ExecutionReplyProducer;

describe('StockReplyConsumer', () => {
  let channel: Channel;
  let cancel: CancelExecutionUseCase;
  let replyProducer: ExecutionReplyProducer;
  let consumer: StockReplyConsumer;

  beforeEach(() => {
    channel = makeChannel();
    cancel = makeCancel();
    replyProducer = makeReplyProducer();
    consumer = new StockReplyConsumer(channel, cancel, replyProducer);
  });

  it('should assert queue and start consuming on start()', async () => {
    await consumer.start();

    expect(channel.assertQueue).toHaveBeenCalledWith('stock.replies', { durable: true });
    expect(channel.consume).toHaveBeenCalledWith('stock.replies', expect.any(Function));
  });

  describe('ESTOQUE_RESERVADO', () => {
    it('should send OS_ENFILEIRADA reply to OS Service', async () => {
      const msg = {
        content: Buffer.from(
          JSON.stringify({
            type: 'ESTOQUE_RESERVADO',
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
        expect(replyProducer.sendOsEnfileirada).toHaveBeenCalledWith({
          serviceOrderId: orderId,
        });
      });
    });
  });

  describe('ESTOQUE_INSUFICIENTE', () => {
    it('should cancel execution and send EXECUCAO_FALHA reply', async () => {
      const cancelledQueue = new ExecutionQueue({
        serviceOrderId: orderId,
        stockItems: [],
        status: ExecutionQueueStatus.CANCELLED,
      });
      vi.mocked(cancel.execute).mockResolvedValue(cancelledQueue);

      const msg = {
        content: Buffer.from(
          JSON.stringify({
            type: 'ESTOQUE_INSUFICIENTE',
            payload: { serviceOrderId: orderId, reason: 'Insufficient stock for item X' },
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
        expect(replyProducer.sendExecucaoFalha).toHaveBeenCalledWith({
          serviceOrderId: orderId,
          reason: 'Insufficient stock for item X',
        });
      });
    });
  });

  describe('ESTOQUE_RESTAURADO', () => {
    it('should acknowledge without sending any reply', async () => {
      const msg = {
        content: Buffer.from(
          JSON.stringify({
            type: 'ESTOQUE_RESTAURADO',
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
        expect(replyProducer.sendOsEnfileirada).not.toHaveBeenCalled();
        expect(replyProducer.sendExecucaoFalha).not.toHaveBeenCalled();
        expect(cancel.execute).not.toHaveBeenCalled();
      });
    });
  });
});
