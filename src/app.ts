import 'express-async-errors';
import { existsSync, readFileSync } from 'node:fs';
import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { corsOrigins } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.js';
import { requestContext } from './middlewares/request-context.js';
import { securityHeaders } from './middlewares/security-headers.js';
import { routes } from './routes/index.js';

const swaggerFile = [
  new URL('./swagger.json', import.meta.url),
  new URL('../swagger.json', import.meta.url),
  new URL('../../src/swagger.json', import.meta.url),
].find((candidate) => existsSync(candidate));

if (!swaggerFile) {
  throw new Error('Arquivo swagger.json nao encontrado.');
}

const swaggerDocument = JSON.parse(
  readFileSync(swaggerFile, 'utf-8').replace(/^\uFEFF/, '')
);

export const app = express();

app.disable('x-powered-by');
app.use(requestContext);
app.use(securityHeaders);
app.use(
  cors({
    origin: corsOrigins ?? true,
  })
);
app.use(express.json());

app.get('/health', (_req, res) => {
  return res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'probarber-api',
      environment: process.env.NODE_ENV ?? 'development',
    },
  });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api', routes);
app.use(errorHandler);
