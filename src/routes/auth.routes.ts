import rateLimit from 'express-rate-limit';
import { Router } from 'express';
import { AuthController } from '../controllers/auth-controller.js';

const authRoutes = Router();
const controller = new AuthController();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Muitas tentativas. Tente novamente em alguns minutos.',
  },
});

authRoutes.use(authLimiter);
authRoutes.post('/cadastro', controller.register);
authRoutes.post('/login', controller.login);

export { authRoutes };
