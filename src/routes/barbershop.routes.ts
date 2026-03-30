import { Router } from 'express';
import { BarbershopController } from '../controllers/barbershop-controller.js';

const barbershopRoutes = Router();
const controller = new BarbershopController();

barbershopRoutes.get('/:slug', controller.show);

export { barbershopRoutes };
