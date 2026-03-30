import { Router } from 'express';
import { FinanceController } from '../controllers/finance-controller.js';
import { ensureAuthenticated } from '../middlewares/ensure-authenticated.js';
import { ensureRole } from '../middlewares/ensure-role.js';
import { authRoutes } from './auth.routes.js';
import { appointmentRoutes } from './appointment.routes.js';
import { barbershopRoutes } from './barbershop.routes.js';

const routes = Router();
const financeController = new FinanceController();

routes.use('/auth', authRoutes);
routes.use('/barbearias', barbershopRoutes);
routes.use('/agendamentos', appointmentRoutes);
routes.get(
  '/financeiro/profissional/:id',
  ensureAuthenticated,
  ensureRole('ADMIN'),
  financeController.getReport
);
routes.get(
  '/financeiro/profissional/:id/top-servicos',
  ensureAuthenticated,
  ensureRole('ADMIN'),
  financeController.getTopServices
);

export { routes };
