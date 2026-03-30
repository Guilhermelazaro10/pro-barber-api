import 'express-async-errors';
import { existsSync, readFileSync } from 'node:fs';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { corsOrigins, env } from './core/config/env.js';
import { errorHandler } from './core/http/middlewares/error-handler.js';
import { requestContext } from './core/http/middlewares/request-context.js';
import { securityHeaders } from './core/http/middlewares/security-headers.js';
import { ApiResponse } from './core/http/presenters/api-response.js';
import { routes } from './core/http/routes/index.js';

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

const corsOrigin: CorsOptions['origin'] = (origin, callback) => {
  if (!origin) {
    callback(null, true);
    return;
  }

  if (env.NODE_ENV !== 'production' && corsOrigins.length === 0) {
    callback(null, true);
    return;
  }

  callback(null, corsOrigins.includes(origin));
};

export const app = express();

app.disable('x-powered-by');
app.use(requestContext);
app.use(securityHeaders);
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  return res.json(
    ApiResponse.success(
      {
        status: 'ok',
        service: 'probarber-api',
        environment: env.NODE_ENV,
      },
      undefined,
      res.getHeader('x-request-id')?.toString()
    )
  );
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api', routes);
app.use((req, res) => {
  return res
    .status(404)
    .json(ApiResponse.error('Rota nao encontrada.', undefined, req.requestId));
});
app.use(errorHandler);
