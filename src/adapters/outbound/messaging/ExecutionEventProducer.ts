import {
  ExecutionEvent,
  type StatusAtualizadoPayload,
  type ExecucaoConcluidaPayload,
} from '../../../application/messaging/messages.js';
import type { SQSBroker } from './SQSBroker.js';
import { env } from '../../../shared/config/env.js';

export class ExecutionEventProducer {
  constructor(private readonly broker: SQSBroker) {}

  async sendStatusAtualizado(payload: StatusAtualizadoPayload): Promise<void> {
    await this.broker.publish(env.sqsQueues.executionEvents, ExecutionEvent.STATUS_ATUALIZADO, payload);
  }

  async sendExecucaoConcluida(payload: ExecucaoConcluidaPayload): Promise<void> {
    await this.broker.publish(env.sqsQueues.executionEvents, ExecutionEvent.EXECUCAO_CONCLUIDA, payload);
  }
}
