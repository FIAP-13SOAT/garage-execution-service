import type { ServiceOrderExecution } from '../../../../domain/serviceOrderExecution/ServiceOrderExecution.js';

export interface ServiceOrderExecutionResponse {
  serviceOrderId: string;
  startDate: string | null;
  endDate: string | null;
  executionTimeMs: number;
  isRunning: boolean;
  isFinished: boolean;
}

export class ServiceOrderExecutionPresenter {
  toResponse(execution: ServiceOrderExecution): ServiceOrderExecutionResponse {
    return {
      serviceOrderId: execution.serviceOrderId,
      startDate: execution.startDate?.toISOString() ?? null,
      endDate: execution.endDate?.toISOString() ?? null,
      executionTimeMs: execution.executionTimeMs,
      isRunning: execution.isRunning(),
      isFinished: execution.isFinished(),
    };
  }
}
