export class ExecutionQueueAlreadyCompletedException extends Error {
  constructor(serviceOrderId: string) {
    super(`Execution queue for service order ${serviceOrderId} is already completed`);
    this.name = 'ExecutionQueueAlreadyCompletedException';
  }
}
