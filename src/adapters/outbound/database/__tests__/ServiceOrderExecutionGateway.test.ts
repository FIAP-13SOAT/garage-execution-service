import { describe, it, expect, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ServiceOrderExecutionGatewayImpl } from '../ServiceOrderExecutionGateway.js';
import { ServiceOrderExecution } from '../../../../domain/serviceOrderExecution/ServiceOrderExecution.js';
import { toUUID } from '../../../../shared/types/UUID.js';

const ddbMock = mockClient(DynamoDBDocumentClient);

const serviceOrderId = toUUID('order-1');
const startDate = new Date('2025-01-01T10:00:00.000Z');
const endDate = new Date('2025-01-01T11:00:00.000Z');

beforeEach(() => {
  ddbMock.reset();
});

describe('ServiceOrderExecutionGatewayImpl', () => {
  it('save() sends PutCommand with correct item', async () => {
    ddbMock.on(PutCommand).resolves({});
    const gateway = new ServiceOrderExecutionGatewayImpl();
    const execution = new ServiceOrderExecution({ serviceOrderId, startDate, endDate, executionTimeMs: 3600000 });

    await gateway.save(execution);

    const calls = ddbMock.commandCalls(PutCommand);
    expect(calls).toHaveLength(1);
    const item = calls[0]!.args[0].input.Item!;
    expect(item['serviceOrderId']).toBe(serviceOrderId);
    expect(item['startDate']).toBe(startDate.toISOString());
    expect(item['endDate']).toBe(endDate.toISOString());
    expect(item['executionTimeMs']).toBe(3600000);
  });

  it('save() stores null dates as null', async () => {
    ddbMock.on(PutCommand).resolves({});
    const gateway = new ServiceOrderExecutionGatewayImpl();
    const execution = new ServiceOrderExecution({ serviceOrderId });

    await gateway.save(execution);

    const item = ddbMock.commandCalls(PutCommand)[0]!.args[0].input.Item!;
    expect(item['startDate']).toBeNull();
    expect(item['endDate']).toBeNull();
  });

  it('findByServiceOrderId() returns mapped ServiceOrderExecution', async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        serviceOrderId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        executionTimeMs: 3600000,
      },
    });
    const gateway = new ServiceOrderExecutionGatewayImpl();

    const result = await gateway.findByServiceOrderId(serviceOrderId);

    expect(result).toBeInstanceOf(ServiceOrderExecution);
    expect(result!.startDate).toEqual(startDate);
    expect(result!.endDate).toEqual(endDate);
    expect(result!.executionTimeMs).toBe(3600000);
  });

  it('findByServiceOrderId() returns execution with null dates when not yet started', async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        serviceOrderId,
        startDate: null,
        endDate: null,
        executionTimeMs: 0,
      },
    });
    const gateway = new ServiceOrderExecutionGatewayImpl();

    const result = await gateway.findByServiceOrderId(serviceOrderId);

    expect(result).toBeInstanceOf(ServiceOrderExecution);
    expect(result!.startDate).toBeNull();
    expect(result!.endDate).toBeNull();
    expect(result!.executionTimeMs).toBe(0);
  });

  it('findByServiceOrderId() returns null when not found', async () => {
    ddbMock.on(GetCommand).resolves({});
    const gateway = new ServiceOrderExecutionGatewayImpl();

    const result = await gateway.findByServiceOrderId(serviceOrderId);

    expect(result).toBeNull();
  });
});
