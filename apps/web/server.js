import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const port = Number(process.env.WEB_PORT || 5153);

async function createServer() {
  const app = express();
  let vite;

  if (!isProd) {
    const { createServer } = await import('vite');
    vite = await createServer({
      root: __dirname,
      server: { middlewareMode: true }
    });
    app.use(vite.middlewares);
  } else {
    app.use('/assets', express.static(path.resolve(__dirname, 'dist/client/assets')));
  }

  app.use('/api', (req, res) => {
    const target = `http://localhost:4000${req.originalUrl}`;
    res.redirect(307, target);
  });

  app.get('*', async (req, res, next) => {
    try {
      const url = req.originalUrl;
      let template;
      let render;

      if (!isProd) {
        template = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        ({ render } = await vite.ssrLoadModule('/src/entry-server.jsx'));
      } else {
        template = await fs.readFile(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8');
        ({ render } = await import('./dist/server/entry-server.js'));
      }

      const smsResponse = await fetch('http://localhost:4000/api/sms');
      const initialMessages = smsResponse.ok ? await smsResponse.json() : [];
      const appHtml = render(initialMessages);

      const html = template
        .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
        .replace(
          'window.__INITIAL_DATA__ = [];',
          `window.__INITIAL_DATA__ = ${JSON.stringify(initialMessages)};`
        );

      res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
    } catch (error) {
      if (vite) {
        vite.ssrFixStacktrace(error);
      }
      next(error);
    }
  });

  app.listen(port, () => {
    console.log(`[web] SSR server running at http://localhost:${port}`);
  });
}

createServer();
