import type { Channel } from 'amqplib';
import {
  StockReply,
  type SagaMessage,
  type EstoqueReservadoPayload,
  type EstoqueInsuficientePayload,
  type EstoqueRestauradoPayload,
} from '../../../application/messaging/messages.js';
import type { CancelExecutionUseCase } from '../../../application/executionQueue/CancelExecutionUseCase.js';
import type { ExecutionReplyProducer } from '../../outbound/messaging/ExecutionReplyProducer.js';
import { setupQueue } from '../../outbound/messaging/setupQueue.js';
import { toUUID } from '../../../shared/types/UUID.js';
import { Logger } from '../../../shared/logger/Logger.js';

const QUEUE = 'stock.replies';

export class StockReplyConsumer {
  constructor(
    private readonly channel: Channel,
    private readonly cancelExecution: CancelExecutionUseCase,
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
        Logger.error('[StockReplyConsumer] Failed to process message', { err });
        this.channel.nack(msg, false, false);
      }
    });
    Logger.info('[StockReplyConsumer] Listening', { queue: QUEUE });
  }

  private async handle(type: string, payload: unknown): Promise<void> {
    switch (type) {
      case StockReply.ESTOQUE_RESERVADO:
        await this.handleEstoqueReservado(payload as EstoqueReservadoPayload);
        break;
      case StockReply.ESTOQUE_INSUFICIENTE:
        await this.handleEstoqueInsuficiente(payload as EstoqueInsuficientePayload);
        break;
      case StockReply.ESTOQUE_RESTAURADO:
        await this.handleEstoqueRestaurado(payload as EstoqueRestauradoPayload);
        break;
      default:
        Logger.warn('[StockReplyConsumer] Unknown message type', { type });
    }
  }

  private async handleEstoqueReservado(payload: EstoqueReservadoPayload): Promise<void> {
    await this.replyProducer.sendOsEnfileirada({
      serviceOrderId: toUUID(payload.serviceOrderId),
    });
  }

  private async handleEstoqueInsuficiente(payload: EstoqueInsuficientePayload): Promise<void> {
    const serviceOrderId = toUUID(payload.serviceOrderId);

    await this.cancelExecution.execute({ serviceOrderId });

    await this.replyProducer.sendExecucaoFalha({
      serviceOrderId,
      reason: payload.reason,
    });
  }

  private async handleEstoqueRestaurado(payload: EstoqueRestauradoPayload): Promise<void> {
    Logger.info('[StockReplyConsumer] Stock restored', { serviceOrderId: payload.serviceOrderId });
  }
}
