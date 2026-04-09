import { AppError } from '../../../shared/errors/AppError.js';

export class ExecutionQueueNotFoundException extends AppError {
  constructor(serviceOrderId: string) {
    super(`Execution queue not found for service order ${serviceOrderId}`, 404);
    this.name = 'ExecutionQueueNotFoundException';
  }
}
