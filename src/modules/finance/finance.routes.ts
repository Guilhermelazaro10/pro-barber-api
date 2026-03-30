import { Router } from 'express';
import { ensureAuthenticated } from '../../core/http/middlewares/ensure-authenticated.js';
import { ensureRole } from '../../core/http/middlewares/ensure-role.js';
import { FinanceController } from './finance.controller.js';

const financeController = new FinanceController();
const financeRoutes = Router();

financeRoutes.use(ensureAuthenticated, ensureRole('ADMIN'));
financeRoutes.get('/profissional/:id', financeController.getReport);
financeRoutes.get(
  '/profissional/:id/top-servicos',
  financeController.getTopServices
);

export { financeRoutes };
