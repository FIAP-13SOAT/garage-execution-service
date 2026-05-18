import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ServiceOrderExecution } from '../../../domain/serviceOrderExecution/ServiceOrderExecution.js';
import { toUUID } from '../../../shared/types/UUID.js';
import type { UUID } from '../../../shared/types/UUID.js';
import { dynamoDb } from './connection.js';

export interface ServiceOrderExecutionGateway {
  save(execution: ServiceOrderExecution): Promise<void>;
  findByServiceOrderId(serviceOrderId: UUID): Promise<ServiceOrderExecution | null>;
}

const TABLE = 'ServiceOrderExecution';

export class ServiceOrderExecutionGatewayImpl implements ServiceOrderExecutionGateway {
  async save(execution: ServiceOrderExecution): Promise<void> {
    await dynamoDb.send(new PutCommand({
      TableName: TABLE,
      Item: {
        serviceOrderId: execution.serviceOrderId,
        startDate: execution.startDate?.toISOString() ?? null,
        endDate: execution.endDate?.toISOString() ?? null,
        executionTimeMs: execution.executionTimeMs,
      },
    }));
  }

  async findByServiceOrderId(serviceOrderId: UUID): Promise<ServiceOrderExecution | null> {
    const result = await dynamoDb.send(new GetCommand({
      TableName: TABLE,
      Key: { serviceOrderId },
    }));
    if (!result.Item) return null;
    return new ServiceOrderExecution({
      serviceOrderId: toUUID(result.Item['serviceOrderId'] as string),
      startDate: result.Item['startDate'] ? new Date(result.Item['startDate'] as string) : undefined,
      endDate: result.Item['endDate'] ? new Date(result.Item['endDate'] as string) : undefined,
      executionTimeMs: result.Item['executionTimeMs'] as number,
    });
  }
}
