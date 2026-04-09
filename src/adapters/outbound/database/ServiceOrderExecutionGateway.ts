import mongoose, { Schema, type HydratedDocument } from 'mongoose';
import { ServiceOrderExecution } from '../../../domain/serviceOrderExecution/ServiceOrderExecution.js';
import { toUUID } from '../../../shared/types/UUID.js';
import type { UUID } from '../../../shared/types/UUID.js';

export interface ServiceOrderExecutionGateway {
  save(execution: ServiceOrderExecution): Promise<void>;
  findByServiceOrderId(serviceOrderId: UUID): Promise<ServiceOrderExecution | null>;
}

interface ServiceOrderExecutionDoc {
  serviceOrderId: string;
  startDate: Date | null;
  endDate: Date | null;
  executionTimeMs: number;
}

const schema = new Schema<ServiceOrderExecutionDoc>(
  {
    serviceOrderId: { type: String, required: true, unique: true },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    executionTimeMs: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'service_order_executions' },
);

const ServiceOrderExecutionModel = mongoose.model(
  'ServiceOrderExecution',
  schema,
);

function toDomain(doc: HydratedDocument<ServiceOrderExecutionDoc>): ServiceOrderExecution {
  return new ServiceOrderExecution({
    serviceOrderId: toUUID(doc.serviceOrderId),
    startDate: doc.startDate ?? undefined,
    endDate: doc.endDate ?? undefined,
    executionTimeMs: doc.executionTimeMs,
  });
}

export class ServiceOrderExecutionGatewayImpl implements ServiceOrderExecutionGateway {
  async save(execution: ServiceOrderExecution): Promise<void> {
    await ServiceOrderExecutionModel.findOneAndUpdate(
      { serviceOrderId: execution.serviceOrderId },
      {
        serviceOrderId: execution.serviceOrderId,
        startDate: execution.startDate,
        endDate: execution.endDate,
        executionTimeMs: execution.executionTimeMs,
      },
      { upsert: true },
    );
  }

  async findByServiceOrderId(serviceOrderId: UUID): Promise<ServiceOrderExecution | null> {
    const doc = await ServiceOrderExecutionModel.findOne({ serviceOrderId });
    return doc ? toDomain(doc) : null;
  }
}
