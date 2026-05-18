import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { env } from '../../../shared/config/env.js';

const clientConfig = env.dynamoEndpoint
  ? { region: env.awsRegion, endpoint: env.dynamoEndpoint, credentials: { accessKeyId: 'local', secretAccessKey: 'local' } }
  : { region: env.awsRegion };

const rawClient = new DynamoDBClient(clientConfig);

export const dynamoDb = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: { removeUndefinedValues: true },
});
