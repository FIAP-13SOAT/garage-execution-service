export class ExecutionQueueAlreadyCancelledException extends Error {
  constructor(serviceOrderId: string) {
    super(`Execution queue for service order ${serviceOrderId} is already cancelled`);
    this.name = 'ExecutionQueueAlreadyCancelledException';
  }
}
