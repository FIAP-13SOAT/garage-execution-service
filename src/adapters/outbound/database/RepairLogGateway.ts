import mongoose, { Schema, type HydratedDocument } from 'mongoose';
import { RepairLog } from '../../../domain/repairLog/RepairLog.js';
import { toUUID } from '../../../shared/types/UUID.js';
import type { UUID } from '../../../shared/types/UUID.js';

export interface RepairLogGateway {
  save(log: RepairLog): Promise<void>;
  listByServiceOrderId(serviceOrderId: UUID): Promise<RepairLog[]>;
}

interface RepairLogDoc {
  id: string;
  serviceOrderId: string;
  event: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

const schema = new Schema<RepairLogDoc>(
  {
    id: { type: String, required: true, unique: true },
    serviceOrderId: { type: String, required: true, index: true },
    event: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, required: true },
  },
  { collection: 'repair_logs' },
);

const RepairLogModel = mongoose.model('RepairLog', schema);

function toDomain(doc: HydratedDocument<RepairLogDoc>): RepairLog {
  return new RepairLog({
    id: toUUID(doc.id),
    serviceOrderId: toUUID(doc.serviceOrderId),
    event: doc.event,
    details: doc.details,
    timestamp: doc.timestamp,
  });
}

export class RepairLogGatewayImpl implements RepairLogGateway {
  async save(log: RepairLog): Promise<void> {
    await RepairLogModel.create({
      id: log.id,
      serviceOrderId: log.serviceOrderId,
      event: log.event,
      details: log.details,
      timestamp: log.timestamp,
    });
  }

  async listByServiceOrderId(serviceOrderId: UUID): Promise<RepairLog[]> {
    const docs = await RepairLogModel.find({ serviceOrderId }).sort({ timestamp: 1 });
    return docs.map(toDomain);
  }
}
