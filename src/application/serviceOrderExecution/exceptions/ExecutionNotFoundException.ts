import { AppError } from '../../../shared/errors/AppError.js';

export class ExecutionNotFoundException extends AppError {
  constructor(serviceOrderId: string) {
    super(`Execution not found for service order ${serviceOrderId}`, 404);
    this.name = 'ExecutionNotFoundException';
  }
}
