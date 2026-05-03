import { Router } from 'express';
import { ServiceOrderExecutionGatewayImpl } from '../../../outbound/database/ServiceOrderExecutionGateway.js';
import { StartExecutionUseCase } from '../../../../application/serviceOrderExecution/StartExecutionUseCase.js';
import { FinishExecutionUseCase } from '../../../../application/serviceOrderExecution/FinishExecutionUseCase.js';
import { GetExecutionUseCase } from '../../../../application/serviceOrderExecution/GetExecutionUseCase.js';
import { ServiceOrderExecutionPresenter } from '../presenters/ServiceOrderExecutionPresenter.js';
import { ServiceOrderExecutionController } from '../controllers/ServiceOrderExecutionController.js';
import { requireRole } from '../middlewares/requireRole.js';
import { UserRole } from '../../../../shared/types/UserRole.js';

const gateway = new ServiceOrderExecutionGatewayImpl();
const presenter = new ServiceOrderExecutionPresenter();
const controller = new ServiceOrderExecutionController(
  new StartExecutionUseCase(gateway),
  new FinishExecutionUseCase(gateway),
  new GetExecutionUseCase(gateway),
  presenter,
);

const router = Router();

router.post('/:serviceOrderId/start-execution', requireRole(UserRole.ADMIN, UserRole.MECHANIC), controller.start.bind(controller));
router.post('/:serviceOrderId/finish-execution', requireRole(UserRole.ADMIN, UserRole.MECHANIC), controller.finish.bind(controller));
router.get('/:serviceOrderId/execution', requireRole(UserRole.ADMIN, UserRole.MECHANIC, UserRole.CLERK), controller.get.bind(controller));

export default router;
