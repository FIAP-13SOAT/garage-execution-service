import type { Channel } from 'amqplib';
import {
  StockCommand,
  type SagaMessage,
  type ReservarEstoquePayload,
  type RestaurarEstoquePayload,
} from '../../../application/messaging/messages.js';
import { setupQueue } from './setupQueue.js';

const QUEUE = 'stock.commands';

export class StockCommandProducer {
  constructor(private readonly channel: Channel) {}

  async sendReservarEstoque(payload: ReservarEstoquePayload): Promise<void> {
    await this.send(StockCommand.RESERVAR_ESTOQUE, payload);
  }

  async sendRestaurarEstoque(payload: RestaurarEstoquePayload): Promise<void> {
    await this.send(StockCommand.RESTAURAR_ESTOQUE, payload);
  }

  private async send<T>(type: string, payload: T): Promise<void> {
    await setupQueue(this.channel, QUEUE);
    const message: SagaMessage<T> = { type, payload };
    this.channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(message)), { persistent: true });
  }
}
