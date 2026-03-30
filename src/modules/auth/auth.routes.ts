import rateLimit from 'express-rate-limit';
import { Router } from 'express';
import { AuthController } from './auth.controller.js';

const authController = new AuthController();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Muitas tentativas. Tente novamente em alguns minutos.',
  },
});

const authRoutes = Router();

authRoutes.post('/cadastro', authLimiter, authController.register);
authRoutes.post('/login', authLimiter, authController.login);

export { authRoutes };
