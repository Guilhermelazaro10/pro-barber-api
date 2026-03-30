import rateLimit from 'express-rate-limit';
import { Router } from 'express';
import { ensureAuthenticated } from '../../core/http/middlewares/ensure-authenticated.js';
import { ensureRole } from '../../core/http/middlewares/ensure-role.js';
import { AppointmentController } from './appointment.controller.js';

const appointmentController = new AppointmentController();

const publicAvailabilityLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Muitas consultas de disponibilidade. Tente novamente em instantes.',
  },
});

const appointmentRoutes = Router();

appointmentRoutes.get(
  '/disponibilidade',
  publicAvailabilityLimiter,
  appointmentController.availability
);

appointmentRoutes.use(ensureAuthenticated);
appointmentRoutes.post('/', appointmentController.store);
appointmentRoutes.get('/meus', appointmentController.index);
appointmentRoutes.patch('/:id/cancelar', appointmentController.cancel);
appointmentRoutes.patch(
  '/:id/concluir',
  ensureRole('ADMIN'),
  appointmentController.complete
);

export { appointmentRoutes };
