import cors from 'cors';
import express from 'express';

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

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'not_found', message: 'Not found.' } });
  });

  return app;
}
