import 'dotenv/config';
import './instrument.js';
import app from './app.js';
import { connectDatabase } from './adapters/outbound/database/connection.js';
import { getRabbitMQChannel } from './adapters/outbound/messaging/rabbitmq.js';
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
  await connectDatabase();

  const channel = await getRabbitMQChannel();

  const executionQueueGateway = new ExecutionQueueGatewayImpl();
  const stockProducer = new StockCommandProducer(channel);
  const replyProducer = new ExecutionReplyProducer(channel);
  const eventProducer = new ExecutionEventProducer(channel);

  const consumer = new ExecutionCommandConsumer(
    channel,
    new EnqueueServiceOrderUseCase(executionQueueGateway),
    new CancelExecutionUseCase(executionQueueGateway),
    stockProducer,
    replyProducer,
  );

  await consumer.start();

  const stockReplyConsumer = new StockReplyConsumer(
    channel,
    new CancelExecutionUseCase(executionQueueGateway),
    replyProducer,
  );
  await stockReplyConsumer.start();

  app.use('/service-orders', createServiceOrderExecutionRouter(eventProducer));

  app.listen(env.port, () => {
    Logger.info(`garage-execution-service running on port ${env.port}`);
  });
};

start().catch((err) => {
  Logger.error('Failed to start server', { err });
  process.exit(1);
});
