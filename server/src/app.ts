import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';

import { rateLimit } from './middleware/rateLimit.js';
import { askScriptureRouter } from './routes/askScripture.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    maxAge: 86400,
  }));
  app.use(express.json({ limit: '12kb', strict: true }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', rateLimit, askScriptureRouter);

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(JSON.stringify({ endpoint: 'unknown', status: 500, error: 'unhandled' }));
    res.status(500).json({ error: { code: 'server_error', message: 'Something went wrong while preparing your response.' } });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'not_found', message: 'Not found.' } });
  });

  return app;
}
