import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import {
  handleChat,
  handleEmbed,
  isRateLimited,
  readJsonBody,
  getBearerToken,
} from './api/_lib/handlers.js';

dotenv.config();

/**
 * Custom Vite plugin that mirrors the Vercel serverless functions during local
 * development. The actual logic lives in api/_lib/handlers.js so dev and prod
 * never drift apart.
 */
const apiPlugin = () => ({
  name: 'local-api',
  configureServer(server) {
    const json = (res, status, body) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(body));
    };

    server.middlewares.use('/api/chat', async (req, res, next) => {
      if (req.method !== 'POST') return next();
      const ip = req.socket?.remoteAddress || 'unknown';
      if (isRateLimited(ip)) {
        return json(res, 429, { error: 'คุณส่งข้อความเร็วเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง' });
      }
      const { message, history } = await readJsonBody(req);
      const { status, body } = await handleChat({ message, history, accessToken: getBearerToken(req) });
      json(res, status, body);
    });

    server.middlewares.use('/api/embed', async (req, res, next) => {
      if (req.method !== 'POST') return next();
      const { texts } = await readJsonBody(req);
      const { status, body } = await handleEmbed({ texts });
      json(res, status, body);
    });
  },
});

export default defineConfig({
  plugins: [react(), apiPlugin()],
  server: {
    port: 5173,
  },
});
