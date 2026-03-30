import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import { routes } from './routes/index.js';
import { errorHandler } from './middlewares/error-handler.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', routes); // Prefixo global opcional, mas recomendado

app.use(errorHandler);

app.listen(3333, () => console.log("🚀 ProBarber SaaS Online"));