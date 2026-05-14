import mongoose from 'mongoose';
import { env } from '../../shared/config/env.js';
import { Logger } from '../../shared/logger/Logger.js';

export const connectDatabase = async (): Promise<void> => {
  await mongoose.connect(env.mongoUrl);
  Logger.info('MongoDB connected');
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};
