import { Router } from 'express';
import { ensureAuthenticated } from '../../core/http/middlewares/ensure-authenticated.js';
import { ensureRole } from '../../core/http/middlewares/ensure-role.js';
import { UserController } from './user.controller.js';

const userController = new UserController();

const userRoutes = Router();

userRoutes.use(ensureAuthenticated);
userRoutes.get('/me', userController.me);
userRoutes.get('/', ensureRole('ADMIN'), userController.index);
userRoutes.post('/admins', ensureRole('ADMIN'), userController.createAdmin);

const userAuthAliasRoutes = Router();

userAuthAliasRoutes.use(ensureAuthenticated);
userAuthAliasRoutes.get('/me', userController.me);
userAuthAliasRoutes.post('/admins', ensureRole('ADMIN'), userController.createAdmin);

export { userAuthAliasRoutes, userRoutes };
