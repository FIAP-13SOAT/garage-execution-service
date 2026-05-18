import {
  ExecutionReply,
  type OsEnfileiraPayload,
  type ExecucaoFalhaPayload,
} from '../../../application/messaging/messages.js';
import type { SQSBroker } from './SQSBroker.js';
import { env } from '../../../shared/config/env.js';

export class ExecutionReplyProducer {
  constructor(private readonly broker: SQSBroker) {}

  async sendOsEnfileirada(payload: OsEnfileiraPayload): Promise<void> {
    await this.broker.publish(env.sqsQueues.executionReplies, ExecutionReply.OS_ENFILEIRADA, payload);
  }

  async sendExecucaoFalha(payload: ExecucaoFalhaPayload): Promise<void> {
    await this.broker.publish(env.sqsQueues.executionReplies, ExecutionReply.EXECUCAO_FALHA, payload);
  }
}
