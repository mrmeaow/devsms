import cors from 'cors';
import express from 'express';
import { insertSms, listSms, markQueuedAsDelivered } from './db/repository.js';
import { getProvider, listProviders } from './providers/index.js';
import { broadcastSmsNew, registerSseClient } from './sse/broker.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: '*' }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true, providers: listProviders() });
  });

  app.get('/api/sms', (req, res) => {
    const messages = listSms({ provider: req.query.provider, limit: req.query.limit });
    res.json(messages);
  });

  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.write(`event: ready\\ndata: ${JSON.stringify({ ok: true })}\\n\\n`);
    registerSseClient(res);
  });

  app.post('/api/sms/send/:provider', async (req, res) => {
    const provider = getProvider(req.params.provider);
    if (!provider) {
      return res.status(404).json({
        error: `Unknown provider '${req.params.provider}'`,
        supportedProviders: listProviders()
      });
    }

    try {
      const normalized = await provider.send(req.body);
      const stored = insertSms(normalized);
      broadcastSmsNew(stored);
      return res.status(201).json(stored);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/sms/simulate-delivery', (_req, res) => {
    const updated = markQueuedAsDelivered();
    res.json({ updated });
  });

  return app;
}
