import mongoose from 'mongoose';

import { env } from './env.js';
import { logger } from './logger.js';

let connecting: Promise<typeof mongoose> | null = null;

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;

  mongoose.set('strictQuery', true);

  if (!connecting) {
    connecting = mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
      autoIndex: env.NODE_ENV !== 'production',
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
