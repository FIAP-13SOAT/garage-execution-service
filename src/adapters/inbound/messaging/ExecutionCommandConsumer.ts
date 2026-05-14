import type { Channel } from 'amqplib';
import {
  ExecutionCommand,
  type SagaMessage,
  type EnfileirarOsPayload,
  type CancelarExecucaoPayload,
} from '../../../application/messaging/messages.js';
import type { EnqueueServiceOrderUseCase } from '../../../application/executionQueue/EnqueueServiceOrderUseCase.js';
import type { CancelExecutionUseCase } from '../../../application/executionQueue/CancelExecutionUseCase.js';
import type { StockCommandProducer } from '../../outbound/messaging/StockCommandProducer.js';
import type { ExecutionReplyProducer } from '../../outbound/messaging/ExecutionReplyProducer.js';
import { setupQueue } from '../../outbound/messaging/setupQueue.js';
import { toUUID } from '../../../shared/types/UUID.js';
import { Logger } from '../../../shared/logger/Logger.js';

const QUEUE = 'execution.commands';

export class ExecutionCommandConsumer {
  constructor(
    private readonly channel: Channel,
    private readonly enqueueServiceOrder: EnqueueServiceOrderUseCase,
    private readonly cancelExecution: CancelExecutionUseCase,
    private readonly stockProducer: StockCommandProducer,
    private readonly replyProducer: ExecutionReplyProducer,
  ) {}

  async start(): Promise<void> {
    await setupQueue(this.channel, QUEUE);
    await this.channel.consume(QUEUE, async (msg) => {
      if (!msg) return;
      try {
        const { type, payload } = JSON.parse(msg.content.toString()) as SagaMessage;
        await this.handle(type, payload);
        this.channel.ack(msg);
      } catch (err) {
        Logger.error('[ExecutionCommandConsumer] Failed to process message', { err });
        this.channel.nack(msg, false, false);
      }
    });
    Logger.info('[ExecutionCommandConsumer] Listening', { queue: QUEUE });
  }

  private async handle(type: string, payload: unknown): Promise<void> {
    switch (type) {
      case ExecutionCommand.ENFILEIRAR_OS:
        await this.handleEnfileirarOs(payload as EnfileirarOsPayload);
        break;
      case ExecutionCommand.CANCELAR_EXECUCAO:
        await this.handleCancelarExecucao(payload as CancelarExecucaoPayload);
        break;
      default:
        Logger.warn('[ExecutionCommandConsumer] Unknown message type', { type });
    }
  }

  private async handleEnfileirarOs(payload: EnfileirarOsPayload): Promise<void> {
    const serviceOrderId = toUUID(payload.serviceOrderId);
    const stockItems = payload.stockItems.map((i) => ({
      stockId: toUUID(i.stockItemId),
      quantity: i.quantity,
    }));

    await this.enqueueServiceOrder.execute({ serviceOrderId, stockItems });

    await this.stockProducer.sendReservarEstoque({
      serviceOrderId,
      items: stockItems,
    });
  }

  private async handleCancelarExecucao(payload: CancelarExecucaoPayload): Promise<void> {
    const serviceOrderId = toUUID(payload.serviceOrderId);

    const queue = await this.cancelExecution.execute({ serviceOrderId });

    await this.stockProducer.sendRestaurarEstoque({
      serviceOrderId,
      items: queue.stockItems.map((i) => ({
        stockId: i.stockId,
        quantity: i.quantity,
      })),
    });
  }
}
