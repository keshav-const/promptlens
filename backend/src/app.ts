import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import routes from './routes/index.js';

export const createApp = (): Express => {
  const app = express();

  app.use(helmet());

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman)
        if (!origin) return callback(null, true);

        // Allow all chrome-extension:// origins
        if (origin.startsWith('chrome-extension://')) {
          return callback(null, true);
        }

        const isAllowed = config.ALLOWED_ORIGINS.some((allowedOrigin) => {
          if (allowedOrigin.includes('*')) {
            const pattern = allowedOrigin.replace(/\*/g, '.*');
            return new RegExp(`^${pattern}$`).test(origin);
          }
          return allowedOrigin === origin;
        });

        if (isAllowed) {
          callback(null, true);
        } else {
          console.error(`❌ CORS blocked origin: ${origin}`);
          console.error(`   Allowed origins: ${config.ALLOWED_ORIGINS.join(', ')}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        if (req.url?.startsWith('/api/upgrade')) {
          (req as { rawBody?: Buffer }).rawBody = buf;
        }
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  if (config.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  app.use('/api', apiLimiter);

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
