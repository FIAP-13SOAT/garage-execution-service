import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StockReplyConsumer } from '../StockReplyConsumer.js';
import { ExecutionQueue } from '../../../../domain/executionQueue/ExecutionQueue.js';
import { ExecutionQueueStatus } from '../../../../domain/executionQueue/ExecutionQueueStatus.js';
import { toUUID } from '../../../../shared/types/UUID.js';
import type { CancelExecutionUseCase } from '../../../../application/executionQueue/CancelExecutionUseCase.js';
import type { ExecutionReplyProducer } from '../../../outbound/messaging/ExecutionReplyProducer.js';
import type { SQSBroker } from '../../../outbound/messaging/SQSBroker.js';

const orderId = toUUID('order-123');

type Handler = (type: string, payload: unknown) => Promise<void>;

const makeBroker = () => {
  let capturedHandler: Handler | null = null;
  const broker = {
    publish: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockImplementation((_url: string, handler: Handler) => { capturedHandler = handler; }),
    stop: vi.fn(),
    triggerMessage: (type: string, payload: unknown) => capturedHandler!(type, payload),
  };
  return broker as unknown as SQSBroker & { triggerMessage(type: string, payload: unknown): Promise<void> };
};

const makeCancel = (): CancelExecutionUseCase =>
  ({ execute: vi.fn() }) as unknown as CancelExecutionUseCase;

const makeReplyProducer = (): ExecutionReplyProducer =>
  ({
    sendOsEnfileirada: vi.fn().mockResolvedValue(undefined),
    sendExecucaoFalha: vi.fn().mockResolvedValue(undefined),
  }) as unknown as ExecutionReplyProducer;

describe('StockReplyConsumer', () => {
  let broker: ReturnType<typeof makeBroker>;
  let cancel: CancelExecutionUseCase;
  let replyProducer: ExecutionReplyProducer;
  let consumer: StockReplyConsumer;

  beforeEach(() => {
    broker = makeBroker();
    cancel = makeCancel();
    replyProducer = makeReplyProducer();
    consumer = new StockReplyConsumer(broker, cancel, replyProducer);
  });

  it('should call broker.subscribe on start()', async () => {
    await consumer.start();
    expect(broker.subscribe).toHaveBeenCalledOnce();
  });

  describe('ESTOQUE_RESERVADO', () => {
    it('should send OS_ENFILEIRADA reply', async () => {
      await consumer.start();
      await broker.triggerMessage('ESTOQUE_RESERVADO', { serviceOrderId: orderId });

      expect(replyProducer.sendOsEnfileirada).toHaveBeenCalledWith({ serviceOrderId: orderId });
    });
  });

  describe('ESTOQUE_INSUFICIENTE', () => {
    it('should cancel execution and send EXECUCAO_FALHA reply', async () => {
      vi.mocked(cancel.execute).mockResolvedValue(
        new ExecutionQueue({ serviceOrderId: orderId, stockItems: [], status: ExecutionQueueStatus.CANCELLED }),
      );

      await consumer.start();
      await broker.triggerMessage('ESTOQUE_INSUFICIENTE', { serviceOrderId: orderId, reason: 'Insufficient stock' });

      expect(cancel.execute).toHaveBeenCalledWith({ serviceOrderId: orderId });
      expect(replyProducer.sendExecucaoFalha).toHaveBeenCalledWith({
        serviceOrderId: orderId,
        reason: 'Insufficient stock',
      });
    });
  });

  describe('ESTOQUE_RESTAURADO', () => {
    it('should acknowledge without sending any reply', async () => {
      await consumer.start();
      await broker.triggerMessage('ESTOQUE_RESTAURADO', { serviceOrderId: orderId });

      expect(replyProducer.sendOsEnfileirada).not.toHaveBeenCalled();
      expect(replyProducer.sendExecucaoFalha).not.toHaveBeenCalled();
      expect(cancel.execute).not.toHaveBeenCalled();
    });
  });
});
