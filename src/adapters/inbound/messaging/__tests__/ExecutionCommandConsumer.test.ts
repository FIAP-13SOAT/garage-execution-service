import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionCommandConsumer } from '../ExecutionCommandConsumer.js';
import { ExecutionQueue } from '../../../../domain/executionQueue/ExecutionQueue.js';
import { ExecutionQueueStatus } from '../../../../domain/executionQueue/ExecutionQueueStatus.js';
import { toUUID } from '../../../../shared/types/UUID.js';
import type { EnqueueServiceOrderUseCase } from '../../../../application/executionQueue/EnqueueServiceOrderUseCase.js';
import type { CancelExecutionUseCase } from '../../../../application/executionQueue/CancelExecutionUseCase.js';
import type { StockCommandProducer } from '../../../outbound/messaging/StockCommandProducer.js';
import type { ExecutionReplyProducer } from '../../../outbound/messaging/ExecutionReplyProducer.js';
import type { SQSBroker } from '../../../outbound/messaging/SQSBroker.js';

const orderId = toUUID('order-123');
const stockId = toUUID('stock-1');

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
  let broker: ReturnType<typeof makeBroker>;
  let enqueue: EnqueueServiceOrderUseCase;
  let cancel: CancelExecutionUseCase;
  let stockProducer: StockCommandProducer;
  let replyProducer: ExecutionReplyProducer;
  let consumer: ExecutionCommandConsumer;

  beforeEach(() => {
    broker = makeBroker();
    enqueue = makeEnqueue();
    cancel = makeCancel();
    stockProducer = makeStockProducer();
    replyProducer = makeReplyProducer();
    consumer = new ExecutionCommandConsumer(broker, enqueue, cancel, stockProducer, replyProducer);
  });

  it('should call broker.subscribe on start()', async () => {
    await consumer.start();
    expect(broker.subscribe).toHaveBeenCalledOnce();
  });

  describe('ENFILEIRAR_OS', () => {
    it('should enqueue OS and send RESERVAR_ESTOQUE', async () => {
      vi.mocked(enqueue.execute).mockResolvedValue(
        new ExecutionQueue({ serviceOrderId: orderId, stockItems: [{ stockId, quantity: 3 }] }),
      );

      await consumer.start();
      await broker.triggerMessage('ENFILEIRAR_OS', {
        serviceOrderId: orderId,
        stockItems: [{ stockItemId: stockId, quantity: 3 }],
      });

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

  describe('CANCELAR_EXECUCAO', () => {
    it('should cancel execution and send RESTAURAR_ESTOQUE', async () => {
      const cancelledQueue = new ExecutionQueue({
        serviceOrderId: orderId,
        stockItems: [{ stockId, quantity: 2 }],
        status: ExecutionQueueStatus.CANCELLED,
      });
      vi.mocked(cancel.execute).mockResolvedValue(cancelledQueue);

      await consumer.start();
      await broker.triggerMessage('CANCELAR_EXECUCAO', { serviceOrderId: orderId });

      expect(cancel.execute).toHaveBeenCalledWith({ serviceOrderId: orderId });
      expect(stockProducer.sendRestaurarEstoque).toHaveBeenCalledWith({
        serviceOrderId: orderId,
        items: [{ stockId, quantity: 2 }],
      });
    });
  });
});
