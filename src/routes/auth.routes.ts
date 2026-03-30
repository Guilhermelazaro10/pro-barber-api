import rateLimit from 'express-rate-limit';
import { Router } from 'express';
import { AuthController } from '../controllers/auth-controller.js';
import { ensureAuthenticated } from '../middlewares/ensure-authenticated.js';
import { ensureRole } from '../middlewares/ensure-role.js';

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

authRoutes.post('/cadastro', authLimiter, controller.register);
authRoutes.post('/login', authLimiter, controller.login);
authRoutes.get('/me', ensureAuthenticated, controller.me);
authRoutes.post(
  '/admins',
  ensureAuthenticated,
  ensureRole('ADMIN'),
  controller.createAdmin
);

export { authRoutes };
