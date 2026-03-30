import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { appointmentRoutes } from './appointment.routes.js';
import { FinanceController } from '../controllers/finance-controller.js';
import { ensureAuthenticated } from '../middlewares/ensure-authenticated.js';

const routes = Router();
const financeController = new FinanceController();

routes.use('/auth', authRoutes);
routes.use('/agendamentos', appointmentRoutes);

// Rota de Financeiro Protegida
routes.get('/financeiro/profissional/:id', ensureAuthenticated, financeController.getReport);

export { routes };