import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { attachPlaygroundWS } from './ws/playground-exec.js';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  const app        = createApp();
  const httpServer = createServer(app);

  // WebSocket server for interactive playground execution
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/playground' });
  attachPlaygroundWS(wss);

  const server = httpServer.listen(env.API_PORT, () => {
    logger.info(
      { port: env.API_PORT, env: env.NODE_ENV },
      `🚀 Kairos API listening on ${env.API_BASE_URL}`,
    );
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down gracefully…');
    server.close(() => logger.info('HTTP server closed'));
    await disconnectDatabase();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception');
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled rejection');
    process.exit(1);
  });
}

bootstrap().catch((err: unknown) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
