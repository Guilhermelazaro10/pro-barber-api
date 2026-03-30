import { Router } from 'express';
import { AuthController } from '../controllers/auth-controller.js';

const authRoutes = Router();
const controller = new AuthController();

authRoutes.post('/cadastro', controller.register);
authRoutes.post('/login', controller.login);

export { authRoutes };