import pino from 'pino';

import { config } from './index.js';

export const logger = pino({
  level: config.log.level,
  transport: config.isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    service: 'kairos-api',
    env: config.nodeEnv,
  },
});
