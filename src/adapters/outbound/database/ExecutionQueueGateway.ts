import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ExecutionQueue, type StockItem } from '../../../domain/executionQueue/ExecutionQueue.js';
import { ExecutionQueueStatus } from '../../../domain/executionQueue/ExecutionQueueStatus.js';
import { toUUID } from '../../../shared/types/UUID.js';
import type { UUID } from '../../../shared/types/UUID.js';
import { dynamoDb } from './connection.js';

export interface ExecutionQueueGateway {
  save(queue: ExecutionQueue): Promise<void>;
  findByServiceOrderId(serviceOrderId: UUID): Promise<ExecutionQueue | null>;
}

const TABLE = 'ExecutionQueue';

export class ExecutionQueueGatewayImpl implements ExecutionQueueGateway {
  async save(queue: ExecutionQueue): Promise<void> {
    await dynamoDb.send(new PutCommand({
      TableName: TABLE,
      Item: {
        serviceOrderId: queue.serviceOrderId,
        status: queue.status,
        stockItems: queue.stockItems,
      },
    }));
  }

  async findByServiceOrderId(serviceOrderId: UUID): Promise<ExecutionQueue | null> {
    const result = await dynamoDb.send(new GetCommand({
      TableName: TABLE,
      Key: { serviceOrderId },
    }));
    if (!result.Item) return null;
    return new ExecutionQueue({
      serviceOrderId: toUUID(result.Item['serviceOrderId'] as string),
      status: result.Item['status'] as ExecutionQueueStatus,
      stockItems: (result.Item['stockItems'] as Array<{ stockId: string; quantity: number }>).map(
        (i): StockItem => ({ stockId: toUUID(i.stockId), quantity: i.quantity }),
      ),
    });
  }
}
