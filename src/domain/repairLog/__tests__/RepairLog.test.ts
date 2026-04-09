import { describe, it, expect } from 'vitest';
import { RepairLog } from '../RepairLog.js';
import { toUUID } from '../../../shared/types/UUID.js';

const orderId = toUUID('order-123');

describe('RepairLog', () => {
  it('should create a log with required fields', () => {
    const log = new RepairLog({ serviceOrderId: orderId, event: 'STARTED' });

    expect(log.serviceOrderId).toBe(orderId);
    expect(log.event).toBe('STARTED');
    expect(log.id).toBeDefined();
    expect(log.timestamp).toBeInstanceOf(Date);
    expect(log.details).toEqual({});
  });

  it('should store details as flexible record', () => {
    const details = { mechanic: 'João', notes: 'Oil change', duration: 30 };
    const log = new RepairLog({ serviceOrderId: orderId, event: 'OIL_CHANGED', details });

    expect(log.details).toEqual(details);
  });

  it('should reconstruct from persisted props', () => {
    const id = toUUID('log-456');
    const ts = new Date('2026-01-01T10:00:00Z');
    const log = new RepairLog({
      id,
      serviceOrderId: orderId,
      event: 'COMPLETED',
      timestamp: ts,
    });

    expect(log.id).toBe(id);
    expect(log.timestamp).toBe(ts);
    expect(log.event).toBe('COMPLETED');
  });

  it('should generate unique ids for each log', () => {
    const log1 = new RepairLog({ serviceOrderId: orderId, event: 'A' });
    const log2 = new RepairLog({ serviceOrderId: orderId, event: 'B' });

    expect(log1.id).not.toBe(log2.id);
  });
});
