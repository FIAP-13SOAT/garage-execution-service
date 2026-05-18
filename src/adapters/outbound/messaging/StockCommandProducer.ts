import {
  StockCommand,
  type ReservarEstoquePayload,
  type RestaurarEstoquePayload,
} from '../../../application/messaging/messages.js';
import type { SQSBroker } from './SQSBroker.js';
import { env } from '../../../shared/config/env.js';

export class StockCommandProducer {
  constructor(private readonly broker: SQSBroker) {}

  async sendReservarEstoque(payload: ReservarEstoquePayload): Promise<void> {
    await this.broker.publish(env.sqsQueues.stockCommands, StockCommand.RESERVAR_ESTOQUE, payload);
  }

  async sendRestaurarEstoque(payload: RestaurarEstoquePayload): Promise<void> {
    await this.broker.publish(env.sqsQueues.stockCommands, StockCommand.RESTAURAR_ESTOQUE, payload);
  }
}
