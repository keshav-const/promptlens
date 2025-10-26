import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { sendSuccess } from '../utils/response.js';
import { config } from '../config/env.js';

export const getHealth = (_req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    uptime: process.uptime(),
    database: {
      connected: mongoose.connection.readyState === 1,
      status: getMongoStatus(mongoose.connection.readyState),
    },
  };

  sendSuccess(res, health, 200);
};

const getMongoStatus = (readyState: number): string => {
  const states: { [key: number]: string } = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[readyState] || 'unknown';
};
