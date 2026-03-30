import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __probarber_prisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__probarber_prisma__ ??
  new PrismaClient({
    log: envLogLevels(),
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__probarber_prisma__ = prisma;
}

function envLogLevels(): ('error' | 'warn' | 'query')[] {
  if (process.env.NODE_ENV === 'development') {
    return ['error', 'warn'];
  }

  return ['error'];
}
