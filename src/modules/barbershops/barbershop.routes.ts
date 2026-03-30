import rateLimit from 'express-rate-limit';
import { Router } from 'express';
import { BarbershopController } from './barbershop.controller.js';

const publicBarbershopLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Muitas consultas publicas. Tente novamente em instantes.',
  },
});

const barbershopController = new BarbershopController();
const barbershopRoutes = Router();

barbershopRoutes.get('/:slug', publicBarbershopLimiter, barbershopController.show);

export { barbershopRoutes };
