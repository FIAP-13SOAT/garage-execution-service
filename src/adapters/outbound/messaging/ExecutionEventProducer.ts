import type { Channel } from 'amqplib';
import {
  ExecutionEvent,
  type SagaMessage,
  type StatusAtualizadoPayload,
  type ExecucaoConcluidaPayload,
} from '../../../application/messaging/messages.js';
import { setupQueue } from './setupQueue.js';

const QUEUE = 'execution.events';

export class ExecutionEventProducer {
  constructor(private readonly channel: Channel) {}

  async sendStatusAtualizado(payload: StatusAtualizadoPayload): Promise<void> {
    await this.send(ExecutionEvent.STATUS_ATUALIZADO, payload);
  }

  async sendExecucaoConcluida(payload: ExecucaoConcluidaPayload): Promise<void> {
    await this.send(ExecutionEvent.EXECUCAO_CONCLUIDA, payload);
  }

  private async send<T>(type: string, payload: T): Promise<void> {
    await setupQueue(this.channel, QUEUE);
    const message: SagaMessage<T> = { type, payload };
    this.channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(message)), { persistent: true });
  }
}
