import type { Request, Response, NextFunction } from 'express';
import type { StartExecutionUseCase } from '../../../../application/serviceOrderExecution/StartExecutionUseCase.js';
import type { FinishExecutionUseCase } from '../../../../application/serviceOrderExecution/FinishExecutionUseCase.js';
import type { GetExecutionUseCase } from '../../../../application/serviceOrderExecution/GetExecutionUseCase.js';
import type { ServiceOrderExecutionPresenter } from '../presenters/ServiceOrderExecutionPresenter.js';
import { toUUID } from '../../../../shared/types/UUID.js';

export class ServiceOrderExecutionController {
  constructor(
    private readonly startUseCase: StartExecutionUseCase,
    private readonly finishUseCase: FinishExecutionUseCase,
    private readonly getUseCase: GetExecutionUseCase,
    private readonly presenter: ServiceOrderExecutionPresenter,
  ) {}

  async start(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const execution = await this.startUseCase.execute({
        serviceOrderId: toUUID(req.params['serviceOrderId'] as string),
      });
      res.status(201).json(this.presenter.toResponse(execution));
    } catch (err) {
      next(err);
    }
  }

  async finish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const execution = await this.finishUseCase.execute({
        serviceOrderId: toUUID(req.params['serviceOrderId'] as string),
      });
      res.json(this.presenter.toResponse(execution));
    } catch (err) {
      next(err);
    }
  }

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const execution = await this.getUseCase.execute({
        serviceOrderId: toUUID(req.params['serviceOrderId'] as string),
      });
      res.json(this.presenter.toResponse(execution));
    } catch (err) {
      next(err);
    }
  }
}
