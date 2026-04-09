import { describe, it, expect } from 'vitest';
import { ServiceOrderExecution } from '../ServiceOrderExecution.js';
import { ExecutionNotStartedException } from '../exceptions/ExecutionNotStartedException.js';
import { toUUID } from '../../../shared/types/UUID.js';

const orderId = toUUID('order-123');

describe('ServiceOrderExecution', () => {
  it('should create an execution with serviceOrderId', () => {
    const execution = new ServiceOrderExecution({ serviceOrderId: orderId });

    expect(execution.serviceOrderId).toBe(orderId);
    expect(execution.startDate).toBeNull();
    expect(execution.endDate).toBeNull();
    expect(execution.executionTimeMs).toBe(0);
  });

  it('should set startDate when start() is called', () => {
    const execution = new ServiceOrderExecution({ serviceOrderId: orderId });
    execution.start();

    expect(execution.startDate).toBeInstanceOf(Date);
    expect(execution.endDate).toBeNull();
  });

  it('should set endDate and calculate executionTimeMs when finish() is called', () => {
    const execution = new ServiceOrderExecution({
      serviceOrderId: orderId,
      startDate: new Date('2026-01-01T10:00:00Z'),
    });
    execution.finish();

    expect(execution.endDate).toBeInstanceOf(Date);
    expect(execution.executionTimeMs).toBeGreaterThan(0);
  });

  it('should throw ExecutionNotStartedException when finish() called without start', () => {
    const execution = new ServiceOrderExecution({ serviceOrderId: orderId });
    expect(() => execution.finish()).toThrow(ExecutionNotStartedException);
  });

  it('should return true for isRunning() when started but not finished', () => {
    const execution = new ServiceOrderExecution({ serviceOrderId: orderId });
    execution.start();

    expect(execution.isRunning()).toBe(true);
    expect(execution.isFinished()).toBe(false);
  });

  it('should return true for isFinished() when finished', () => {
    const execution = new ServiceOrderExecution({
      serviceOrderId: orderId,
      startDate: new Date('2026-01-01T10:00:00Z'),
    });
    execution.finish();

    expect(execution.isRunning()).toBe(false);
    expect(execution.isFinished()).toBe(true);
  });

  it('should reconstruct from persisted props', () => {
    const start = new Date('2026-01-01T10:00:00Z');
    const end = new Date('2026-01-01T12:30:00Z');
    const execution = new ServiceOrderExecution({
      serviceOrderId: toUUID('order-456'),
      startDate: start,
      endDate: end,
      executionTimeMs: end.getTime() - start.getTime(),
    });

    expect(execution.isFinished()).toBe(true);
    expect(execution.executionTimeMs).toBe(9000000);
  });
});
