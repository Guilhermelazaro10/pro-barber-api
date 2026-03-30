import 'express-async-errors'; // Importante para capturar erros em async sem try/catch
import express from 'express';
import cors from 'cors';
import { appointmentRoutes } from './routes/appointment.routes';
import { authRoutes } from './routes/auth.routes';
import { errorHandler } from './middlewares/error-handler';
import rateLimit from 'express-rate-limit';

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: "Muitas requisições, tente novamente mais tarde." }
});

app.use(cors());
app.use(express.json());
app.use(limiter);

// Rotas
app.use('/auth', authRoutes);
app.use('/appointments', appointmentRoutes);

// Middleware de Erro (Sempre por último)
app.use(errorHandler);

app.listen(3333, () => console.log("🔥 ProBarber SaaS Online em http://localhost:3333"));