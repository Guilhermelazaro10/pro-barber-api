import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL nao configurada.'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET precisa ter pelo menos 16 caracteres.'),
  PORT: z.coerce.number().int().positive().default(3333),
  CORS_ORIGIN: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    'Variaveis de ambiente invalidas:',
    parsedEnv.error.flatten().fieldErrors
  );
  throw new Error('Falha ao validar as variaveis de ambiente.');
}

export const env = parsedEnv.data;

export const corsOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : undefined;
