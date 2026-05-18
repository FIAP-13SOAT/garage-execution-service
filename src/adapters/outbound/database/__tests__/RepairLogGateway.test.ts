import { describe, it, expect, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { RepairLogGatewayImpl } from '../RepairLogGateway.js';
import { RepairLog } from '../../../../domain/repairLog/RepairLog.js';
import { toUUID } from '../../../../shared/types/UUID.js';

const ddbMock = mockClient(DynamoDBDocumentClient);

const serviceOrderId = toUUID('order-1');
const logId = toUUID('log-1');
const ts = new Date('2025-01-01T00:00:00.000Z');

beforeEach(() => {
  ddbMock.reset();
});

describe('RepairLogGatewayImpl', () => {
  it('save() sends PutCommand with correct item', async () => {
    ddbMock.on(PutCommand).resolves({});
    const gateway = new RepairLogGatewayImpl();
    const log = new RepairLog({ id: logId, serviceOrderId, event: 'STARTED', timestamp: ts });

    await gateway.save(log);

    const calls = ddbMock.commandCalls(PutCommand);
    expect(calls).toHaveLength(1);
    const item = calls[0]!.args[0].input.Item!;
    expect(item['serviceOrderId']).toBe(serviceOrderId);
    expect(item['id']).toBe(logId);
    expect(item['event']).toBe('STARTED');
    expect(item['sk']).toBe(`${ts.toISOString()}#${logId}`);
  });

  it('listByServiceOrderId() returns ordered RepairLogs', async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: [
        { serviceOrderId, sk: `${ts.toISOString()}#${logId}`, id: logId, event: 'STARTED', details: { note: 'ok' }, timestamp: ts.toISOString() },
      ],
    });
    const gateway = new RepairLogGatewayImpl();

    const result = await gateway.listByServiceOrderId(serviceOrderId);

    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(RepairLog);
    expect(result[0]!.event).toBe('STARTED');
    expect(result[0]!.details).toEqual({ note: 'ok' });
    expect(result[0]!.timestamp).toEqual(ts);
  });

  it('listByServiceOrderId() returns empty array when Items is undefined', async () => {
    ddbMock.on(QueryCommand).resolves({});
    const gateway = new RepairLogGatewayImpl();

    const result = await gateway.listByServiceOrderId(serviceOrderId);

    expect(result).toEqual([]);
  });
});
