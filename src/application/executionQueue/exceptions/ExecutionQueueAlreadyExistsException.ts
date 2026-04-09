import { AppError } from '../../../shared/errors/AppError.js';

export class ExecutionQueueAlreadyExistsException extends AppError {
  constructor(serviceOrderId: string) {
    super(
      `Execution queue already exists for service order ${serviceOrderId}`,
      409,
    );
    this.name = 'ExecutionQueueAlreadyExistsException';
  }
}
