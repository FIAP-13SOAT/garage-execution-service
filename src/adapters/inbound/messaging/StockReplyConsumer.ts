import {
  StockReply,
  type EstoqueReservadoPayload,
  type EstoqueInsuficientePayload,
  type EstoqueRestauradoPayload,
} from '../../../application/messaging/messages.js';
import type { CancelExecutionUseCase } from '../../../application/executionQueue/CancelExecutionUseCase.js';
import type { ExecutionReplyProducer } from '../../outbound/messaging/ExecutionReplyProducer.js';
import type { SQSBroker } from '../../outbound/messaging/SQSBroker.js';
import { toUUID } from '../../../shared/types/UUID.js';
import { Logger } from '../../../shared/logger/Logger.js';
import { env } from '../../../shared/config/env.js';

export class StockReplyConsumer {
  constructor(
    private readonly broker: SQSBroker,
    private readonly cancelExecution: CancelExecutionUseCase,
    private readonly replyProducer: ExecutionReplyProducer,
  ) {}

  async start(): Promise<void> {
    this.broker.subscribe(env.sqsQueues.stockReplies, async (type, payload) => {
      await this.handle(type, payload);
    });
    Logger.info('[StockReplyConsumer] Listening', { queue: env.sqsQueues.stockReplies });
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
    await this.replyProducer.sendOsEnfileirada({ serviceOrderId: toUUID(payload.serviceOrderId) });
  }

  private async handleEstoqueInsuficiente(payload: EstoqueInsuficientePayload): Promise<void> {
    const serviceOrderId = toUUID(payload.serviceOrderId);
    await this.cancelExecution.execute({ serviceOrderId });
    await this.replyProducer.sendExecucaoFalha({ serviceOrderId, reason: payload.reason });
  }

  private async handleEstoqueRestaurado(payload: EstoqueRestauradoPayload): Promise<void> {
    Logger.info('[StockReplyConsumer] Stock restored', { serviceOrderId: payload.serviceOrderId });
  }
}
