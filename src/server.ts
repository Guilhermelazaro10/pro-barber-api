import 'express-async-errors'; // Essencial para capturar erros em Services
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { authRoutes } from './routes/auth.routes.js';
import { appointmentRoutes } from './routes/appointment.routes.js';
import { errorHandler } from './middlewares/error-handler.js';

const app = express();

// Proteção contra Brute Force no Login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, 
  message: { success: false, error: "Muitas tentativas. Tente novamente mais tarde." }
});

app.use(cors());
app.use(express.json());

// Rotas Modulares
app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/agendamentos', appointmentRoutes);

// Handler Global (Sempre por último)
app.use(errorHandler);

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`🚀 ProBarber SaaS rodando na porta ${PORT}`));