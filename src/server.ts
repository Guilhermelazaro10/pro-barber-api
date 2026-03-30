import { env } from './core/config/env.js';
import { prisma } from './core/database/prisma.js';
import { app } from './app.js';

const server = app.listen(env.PORT, () => {
  console.log(
    JSON.stringify({
      level: 'info',
      event: 'server_started',
      port: env.PORT,
      environment: env.NODE_ENV,
    })
  );
});

const shutdown = (signal: NodeJS.Signals) => {
  console.log(
    JSON.stringify({
      level: 'info',
      event: 'server_stopping',
      signal,
    })
  );

  server.close(async (error) => {
    if (error) {
      console.error(
        JSON.stringify({
          level: 'error',
          event: 'server_stop_failed',
          signal,
          message: error.message,
        })
      );
      process.exit(1);
      return;
    }

    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
