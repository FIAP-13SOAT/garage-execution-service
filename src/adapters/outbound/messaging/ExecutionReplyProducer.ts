import type { Channel } from 'amqplib';
import {
  ExecutionReply,
  type SagaMessage,
  type OsEnfileiraPayload,
  type ExecucaoFalhaPayload,
} from '../../../application/messaging/messages.js';
import { setupQueue } from './setupQueue.js';

const QUEUE = 'execution.replies';

export class ExecutionReplyProducer {
  constructor(private readonly channel: Channel) {}

  async sendOsEnfileirada(payload: OsEnfileiraPayload): Promise<void> {
    await this.send(ExecutionReply.OS_ENFILEIRADA, payload);
  }

  async sendExecucaoFalha(payload: ExecucaoFalhaPayload): Promise<void> {
    await this.send(ExecutionReply.EXECUCAO_FALHA, payload);
  }

  private async send<T>(type: string, payload: T): Promise<void> {
    await setupQueue(this.channel, QUEUE);
    const message: SagaMessage<T> = { type, payload };
    this.channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(message)), { persistent: true });
  }
}
