import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { config, describeConfig } from './config/index.js';
import { logger } from './config/logger.js';
import { attachPlaygroundWS } from './ws/playground-exec.js';

const SEPARATOR = '─'.repeat(48);

async function bootstrap(): Promise<void> {
  await connectDatabase();
  const app = createApp();
  const httpServer = createServer(app);

  // WebSocket server for interactive playground execution
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/playground' });
  attachPlaygroundWS(wss);

  const server = httpServer.listen(config.api.port, () => {
    logger.info(
      { port: config.api.port, env: config.nodeEnv },
      `🚀 Kairos API listening on ${config.api.baseUrl}`,
    );

    // Startup diagnostics banner: non-secret config summary + dependency health.
    logger.info(SEPARATOR);
    for (const line of describeConfig()) logger.info(line);
    logger.info('MongoDB Connected ✓');
    logger.info('LLM Provider Loaded ✓');
    logger.info(SEPARATOR);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logger.fatal(
        { port: config.api.port, err },
        `Port ${config.api.port} is already in use. Run "npm run predev" or stop the other process, then retry.`,
      );
      process.exit(1);
    }
    logger.fatal({ err }, 'HTTP server failed to start');
    process.exit(1);
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
