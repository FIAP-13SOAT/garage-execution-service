export const env = {
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  awsRegion: process.env['AWS_REGION'] ?? 'us-east-1',
  dynamoEndpoint: process.env['DYNAMODB_ENDPOINT'],
  sqsQueues: {
    executionCommands: process.env['SQS_EXECUTION_COMMANDS_URL'] ?? '',
    executionReplies: process.env['SQS_EXECUTION_REPLIES_URL'] ?? '',
    executionEvents: process.env['SQS_EXECUTION_EVENTS_URL'] ?? '',
    stockCommands: process.env['SQS_STOCK_COMMANDS_URL'] ?? '',
    stockReplies: process.env['SQS_STOCK_REPLIES_URL'] ?? '',
  },
  sqsEndpoint: process.env['SQS_ENDPOINT'],
  datadog: {
    apiKey: process.env['DD_API_KEY'] ?? '',
    appKey: process.env['DD_APP_KEY'] ?? '',
    service: process.env['DD_SERVICE'] ?? 'garage-execution-service',
    env: process.env['DD_ENV'] ?? 'development',
    version: process.env['DD_VERSION'] ?? '1.0.0',
    agentHost: process.env['DD_AGENT_HOST'] ?? 'localhost',
    traceEnabled: process.env['DD_TRACE_ENABLED'] !== 'false',
  },
};
