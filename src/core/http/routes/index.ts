import { Router } from 'express';
import { appointmentRoutes } from '../../../modules/appointments/appointment.routes.js';
import { authRoutes } from '../../../modules/auth/auth.routes.js';
import { barbershopRoutes } from '../../../modules/barbershops/barbershop.routes.js';
import { financeRoutes } from '../../../modules/finance/finance.routes.js';
import { professionalRoutes } from '../../../modules/professionals/professional.routes.js';
import { serviceRoutes } from '../../../modules/services/service.routes.js';
import {
  userAuthAliasRoutes,
  userRoutes,
} from '../../../modules/users/user.routes.js';

const routes = Router();

routes.use('/auth', authRoutes);
routes.use('/auth', userAuthAliasRoutes);
routes.use('/usuarios', userRoutes);
routes.use('/barbearias', barbershopRoutes);
routes.use('/profissionais', professionalRoutes);
routes.use('/servicos', serviceRoutes);
routes.use('/agendamentos', appointmentRoutes);
routes.use('/financeiro', financeRoutes);

export { routes };
