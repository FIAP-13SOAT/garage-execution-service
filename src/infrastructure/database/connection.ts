import mongoose from 'mongoose';
import { env } from '../../shared/config/env.js';

export const connectDatabase = async (): Promise<void> => {
  await mongoose.connect(env.mongoUrl);
  console.log('MongoDB connected');
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};
