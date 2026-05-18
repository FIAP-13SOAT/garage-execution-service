import {
  ExecutionCommand,
  type EnfileirarOsPayload,
  type CancelarExecucaoPayload,
} from '../../../application/messaging/messages.js';
import type { EnqueueServiceOrderUseCase } from '../../../application/executionQueue/EnqueueServiceOrderUseCase.js';
import type { CancelExecutionUseCase } from '../../../application/executionQueue/CancelExecutionUseCase.js';
import type { StockCommandProducer } from '../../outbound/messaging/StockCommandProducer.js';
import type { ExecutionReplyProducer } from '../../outbound/messaging/ExecutionReplyProducer.js';
import type { SQSBroker } from '../../outbound/messaging/SQSBroker.js';
import { toUUID } from '../../../shared/types/UUID.js';
import { Logger } from '../../../shared/logger/Logger.js';
import { env } from '../../../shared/config/env.js';

export class ExecutionCommandConsumer {
  constructor(
    private readonly broker: SQSBroker,
    private readonly enqueueServiceOrder: EnqueueServiceOrderUseCase,
    private readonly cancelExecution: CancelExecutionUseCase,
    private readonly stockProducer: StockCommandProducer,
    private readonly replyProducer: ExecutionReplyProducer,
  ) {}

  async start(): Promise<void> {
    this.broker.subscribe(env.sqsQueues.executionCommands, async (type, payload) => {
      await this.handle(type, payload);
    });
    Logger.info('[ExecutionCommandConsumer] Listening', { queue: env.sqsQueues.executionCommands });
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

    await this.stockProducer.sendReservarEstoque({ serviceOrderId, items: stockItems });
  }

  private async handleCancelarExecucao(payload: CancelarExecucaoPayload): Promise<void> {
    const serviceOrderId = toUUID(payload.serviceOrderId);
    const queue = await this.cancelExecution.execute({ serviceOrderId });

    await this.stockProducer.sendRestaurarEstoque({
      serviceOrderId,
      items: queue.stockItems.map((i) => ({ stockId: i.stockId, quantity: i.quantity })),
    });
  }
}
