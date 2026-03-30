import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment-controller.js';
import { ensureAuthenticated } from '../middlewares/ensure-authenticated.js';

const appointmentRoutes = Router();
const controller = new AppointmentController();

// Rotas Privadas
appointmentRoutes.use(ensureAuthenticated);

appointmentRoutes.post('/', controller.store);
appointmentRoutes.get('/meus', controller.index);
appointmentRoutes.patch('/:id/cancelar', controller.cancel);

export { appointmentRoutes };