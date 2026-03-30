import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment-controller.js';
import { ensureAuthenticated } from '../middlewares/ensure-authenticated.js';
import { ensureRole } from '../middlewares/ensure-role.js';

const appointmentRoutes = Router();
const controller = new AppointmentController();

appointmentRoutes.get('/disponibilidade', controller.availability);

appointmentRoutes.use(ensureAuthenticated);
appointmentRoutes.post('/', controller.store);
appointmentRoutes.get('/meus', controller.index);
appointmentRoutes.patch('/:id/cancelar', controller.cancel);
appointmentRoutes.patch('/:id/concluir', ensureRole('ADMIN'), controller.complete);

export { appointmentRoutes };
