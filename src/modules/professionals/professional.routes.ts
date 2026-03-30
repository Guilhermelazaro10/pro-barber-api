import { Router } from 'express';
import { ensureAuthenticated } from '../../core/http/middlewares/ensure-authenticated.js';
import { ProfessionalController } from './professional.controller.js';

const professionalController = new ProfessionalController();
const professionalRoutes = Router();

professionalRoutes.use(ensureAuthenticated);
professionalRoutes.get('/', professionalController.index);
professionalRoutes.get('/:id', professionalController.show);

export { professionalRoutes };
