import mongoose, { Schema, type HydratedDocument } from 'mongoose';
import { ExecutionQueue, type StockItem } from '../../../domain/executionQueue/ExecutionQueue.js';
import { ExecutionQueueStatus } from '../../../domain/executionQueue/ExecutionQueueStatus.js';
import { toUUID } from '../../../shared/types/UUID.js';
import type { UUID } from '../../../shared/types/UUID.js';

export interface ExecutionQueueGateway {
  save(queue: ExecutionQueue): Promise<void>;
  findByServiceOrderId(serviceOrderId: UUID): Promise<ExecutionQueue | null>;
}

interface StockItemDoc {
  stockId: string;
  quantity: number;
}

interface ExecutionQueueDoc {
  serviceOrderId: string;
  status: ExecutionQueueStatus;
  stockItems: StockItemDoc[];
}

const stockItemSchema = new Schema<StockItemDoc>(
  {
    stockId: { type: String, required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false },
);

const schema = new Schema<ExecutionQueueDoc>(
  {
    serviceOrderId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: Object.values(ExecutionQueueStatus),
      default: ExecutionQueueStatus.PENDING,
    },
    stockItems: { type: [stockItemSchema], default: [] },
  },
  { timestamps: true, collection: 'execution_queue' },
);

const ExecutionQueueModel = mongoose.model('ExecutionQueue', schema);

function toDomain(doc: HydratedDocument<ExecutionQueueDoc>): ExecutionQueue {
  return new ExecutionQueue({
    serviceOrderId: toUUID(doc.serviceOrderId),
    status: doc.status,
    stockItems: doc.stockItems.map(
      (i): StockItem => ({ stockId: toUUID(i.stockId), quantity: i.quantity }),
    ),
  });
}

export class ExecutionQueueGatewayImpl implements ExecutionQueueGateway {
  async save(queue: ExecutionQueue): Promise<void> {
    await ExecutionQueueModel.findOneAndUpdate(
      { serviceOrderId: queue.serviceOrderId },
      {
        serviceOrderId: queue.serviceOrderId,
        status: queue.status,
        stockItems: queue.stockItems,
      },
      { upsert: true },
    );
  }

  async findByServiceOrderId(serviceOrderId: UUID): Promise<ExecutionQueue | null> {
    const doc = await ExecutionQueueModel.findOne({ serviceOrderId });
    return doc ? toDomain(doc) : null;
  }
}
