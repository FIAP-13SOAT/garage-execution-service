import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinishExecutionUseCase } from '../FinishExecutionUseCase.js';
import { ServiceOrderExecution } from '../../../domain/serviceOrderExecution/ServiceOrderExecution.js';
import { ExecutionNotFoundException } from '../exceptions/ExecutionNotFoundException.js';
import { toUUID } from '../../../shared/types/UUID.js';
import type { ServiceOrderExecutionGateway } from '../../../adapters/outbound/database/ServiceOrderExecutionGateway.js';
import type { ExecutionEventProducer } from '../../../adapters/outbound/messaging/ExecutionEventProducer.js';

const orderId = toUUID('order-123');

const makeGateway = (): ServiceOrderExecutionGateway => ({
  save: vi.fn(),
  findByServiceOrderId: vi.fn(),
});

const makeEventProducer = (): ExecutionEventProducer =>
  ({ sendExecucaoConcluida: vi.fn(), sendStatusAtualizado: vi.fn() }) as unknown as ExecutionEventProducer;

describe('FinishExecutionUseCase', () => {
  let gateway: ServiceOrderExecutionGateway;
  let eventProducer: ExecutionEventProducer;
  let useCase: FinishExecutionUseCase;

  beforeEach(() => {
    gateway = makeGateway();
    eventProducer = makeEventProducer();
    useCase = new FinishExecutionUseCase(gateway, eventProducer);
  });

  it('should finish an existing execution and publish EXECUCAO_CONCLUIDA', async () => {
    const started = new ServiceOrderExecution({
      serviceOrderId: orderId,
      startDate: new Date('2026-01-01T10:00:00Z'),
    });
    vi.mocked(gateway.findByServiceOrderId).mockResolvedValue(started);
    vi.mocked(gateway.save).mockResolvedValue();
    vi.mocked(eventProducer.sendExecucaoConcluida).mockResolvedValue();

    const result = await useCase.execute({ serviceOrderId: orderId });

    expect(result.isFinished()).toBe(true);
    expect(result.endDate).toBeInstanceOf(Date);
    expect(gateway.save).toHaveBeenCalledOnce();
    expect(eventProducer.sendExecucaoConcluida).toHaveBeenCalledOnce();
    expect(eventProducer.sendExecucaoConcluida).toHaveBeenCalledWith({ serviceOrderId: orderId });
  });

  it('should throw ExecutionNotFoundException when execution not found', async () => {
    vi.mocked(gateway.findByServiceOrderId).mockResolvedValue(null);

    await expect(useCase.execute({ serviceOrderId: orderId })).rejects.toThrow(
      ExecutionNotFoundException,
    );
    expect(eventProducer.sendExecucaoConcluida).not.toHaveBeenCalled();
  });
});
