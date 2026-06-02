import mongoose from 'mongoose';

import { config } from './index.js';
import { logger } from './logger.js';

let connecting: Promise<typeof mongoose> | null = null;

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;

  mongoose.set('strictQuery', true);

  if (!connecting) {
    connecting = mongoose.connect(config.mongo.uri, {
      serverSelectionTimeoutMS: 10_000,
      autoIndex: !config.isProduction,
    });
  }

  await connecting;
  logger.info({ db: mongoose.connection.name }, 'MongoDB connected');
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  }
  connecting = null;
}
