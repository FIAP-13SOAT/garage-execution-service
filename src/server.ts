import 'dotenv/config';
import './instrument.js';
import app from './app.js';
import { SQSBroker, sqsClient } from './adapters/outbound/messaging/SQSBroker.js';
import { env } from './shared/config/env.js';
import { Logger } from './shared/logger/Logger.js';
import { ExecutionQueueGatewayImpl } from './adapters/outbound/database/ExecutionQueueGateway.js';
import { EnqueueServiceOrderUseCase } from './application/executionQueue/EnqueueServiceOrderUseCase.js';
import { CancelExecutionUseCase } from './application/executionQueue/CancelExecutionUseCase.js';
import { StockCommandProducer } from './adapters/outbound/messaging/StockCommandProducer.js';
import { ExecutionReplyProducer } from './adapters/outbound/messaging/ExecutionReplyProducer.js';
import { ExecutionEventProducer } from './adapters/outbound/messaging/ExecutionEventProducer.js';
import { ExecutionCommandConsumer } from './adapters/inbound/messaging/ExecutionCommandConsumer.js';
import { StockReplyConsumer } from './adapters/inbound/messaging/StockReplyConsumer.js';
import { createServiceOrderExecutionRouter } from './adapters/inbound/rest/routes/serviceOrderExecutionResource.js';

const start = async (): Promise<void> => {
  const broker = new SQSBroker(sqsClient);

  const executionQueueGateway = new ExecutionQueueGatewayImpl();
  const stockProducer = new StockCommandProducer(broker);
  const replyProducer = new ExecutionReplyProducer(broker);
  const eventProducer = new ExecutionEventProducer(broker);

  await new ExecutionCommandConsumer(
    broker,
    new EnqueueServiceOrderUseCase(executionQueueGateway),
    new CancelExecutionUseCase(executionQueueGateway),
    stockProducer,
    replyProducer,
  ).start();

  await new StockReplyConsumer(broker, new CancelExecutionUseCase(executionQueueGateway), replyProducer).start();

  app.use('/service-orders', createServiceOrderExecutionRouter(eventProducer));

  const server = app.listen(env.port, () => {
    Logger.info(`garage-execution-service running on port ${env.port}`);
  });

  const shutdown = (): void => {
    broker.stop();
    server.close();
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
};

start().catch((err) => {
  Logger.error('Failed to start server', { err });
  process.exit(1);
});
