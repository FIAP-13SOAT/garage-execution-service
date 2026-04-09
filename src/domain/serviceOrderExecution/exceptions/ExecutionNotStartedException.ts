export class ExecutionNotStartedException extends Error {
  constructor(serviceOrderId: string) {
    super(
      `Cannot finish execution for service order ${serviceOrderId}: execution not started`,
    );
    this.name = 'ExecutionNotStartedException';
  }
}
