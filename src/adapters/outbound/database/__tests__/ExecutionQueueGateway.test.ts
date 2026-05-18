import { describe, it, expect, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ExecutionQueueGatewayImpl } from '../ExecutionQueueGateway.js';
import { ExecutionQueue } from '../../../../domain/executionQueue/ExecutionQueue.js';
import { ExecutionQueueStatus } from '../../../../domain/executionQueue/ExecutionQueueStatus.js';
import { toUUID } from '../../../../shared/types/UUID.js';

const ddbMock = mockClient(DynamoDBDocumentClient);

const serviceOrderId = toUUID('order-1');
const stockId = toUUID('stock-1');

beforeEach(() => {
  ddbMock.reset();
});

describe('ExecutionQueueGatewayImpl', () => {
  it('save() sends PutCommand with correct item', async () => {
    ddbMock.on(PutCommand).resolves({});
    const gateway = new ExecutionQueueGatewayImpl();
    const queue = new ExecutionQueue({ serviceOrderId, stockItems: [{ stockId, quantity: 2 }] });

    await gateway.save(queue);

    const calls = ddbMock.commandCalls(PutCommand);
    expect(calls).toHaveLength(1);
    const item = calls[0]!.args[0].input.Item!;
    expect(item['serviceOrderId']).toBe(serviceOrderId);
    expect(item['status']).toBe(ExecutionQueueStatus.PENDING);
    expect(item['stockItems']).toEqual([{ stockId, quantity: 2 }]);
  });

  it('findByServiceOrderId() returns mapped ExecutionQueue', async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        serviceOrderId,
        status: ExecutionQueueStatus.PROCESSING,
        stockItems: [{ stockId, quantity: 3 }],
      },
    });
    const gateway = new ExecutionQueueGatewayImpl();

    const result = await gateway.findByServiceOrderId(serviceOrderId);

    expect(result).toBeInstanceOf(ExecutionQueue);
    expect(result!.status).toBe(ExecutionQueueStatus.PROCESSING);
    expect(result!.stockItems[0]!.quantity).toBe(3);
  });

  it('findByServiceOrderId() returns null when not found', async () => {
    ddbMock.on(GetCommand).resolves({});
    const gateway = new ExecutionQueueGatewayImpl();

    const result = await gateway.findByServiceOrderId(serviceOrderId);

    expect(result).toBeNull();
  });
});
