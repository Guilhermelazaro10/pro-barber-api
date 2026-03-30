import { Router } from 'express';
import { ensureAuthenticated } from '../../core/http/middlewares/ensure-authenticated.js';
import { ServiceController } from './service.controller.js';

const serviceController = new ServiceController();
const serviceRoutes = Router();

serviceRoutes.use(ensureAuthenticated);
serviceRoutes.get('/', serviceController.index);
serviceRoutes.get('/:id', serviceController.show);

export { serviceRoutes };
