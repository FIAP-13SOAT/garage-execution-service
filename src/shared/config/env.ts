export const env = {
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  mongoUrl: process.env['MONGO_URL'] ?? '',
  rabbitmqUrl: process.env['RABBITMQ_URL'] ?? '',
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
