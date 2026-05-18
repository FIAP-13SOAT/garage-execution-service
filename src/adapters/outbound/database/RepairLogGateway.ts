import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { RepairLog } from '../../../domain/repairLog/RepairLog.js';
import { toUUID } from '../../../shared/types/UUID.js';
import type { UUID } from '../../../shared/types/UUID.js';
import { dynamoDb } from './connection.js';

export interface RepairLogGateway {
  save(log: RepairLog): Promise<void>;
  listByServiceOrderId(serviceOrderId: UUID): Promise<RepairLog[]>;
}

const TABLE = 'RepairLog';

export class RepairLogGatewayImpl implements RepairLogGateway {
  async save(log: RepairLog): Promise<void> {
    await dynamoDb.send(new PutCommand({
      TableName: TABLE,
      Item: {
        serviceOrderId: log.serviceOrderId,
        sk: `${log.timestamp.toISOString()}#${log.id}`,
        id: log.id,
        event: log.event,
        details: log.details,
        timestamp: log.timestamp.toISOString(),
      },
    }));
  }

  async listByServiceOrderId(serviceOrderId: UUID): Promise<RepairLog[]> {
    const result = await dynamoDb.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'serviceOrderId = :pk',
      ExpressionAttributeValues: { ':pk': serviceOrderId },
      ScanIndexForward: true,
    }));
    return (result.Items ?? []).map((item) => new RepairLog({
      id: toUUID(item['id'] as string),
      serviceOrderId: toUUID(item['serviceOrderId'] as string),
      event: item['event'] as string,
      details: (item['details'] as Record<string, unknown>) ?? {},
      timestamp: new Date(item['timestamp'] as string),
    }));
  }
}
