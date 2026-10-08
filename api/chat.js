import { handleChat, isRateLimited, getBearerToken } from './_lib/handlers.js';

/**
 * Vercel Serverless Function — POST /api/chat
 * Runs server-side RAG retrieval + Gemini generation. See api/_lib/handlers.js.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      error: 'คุณส่งข้อความเร็วเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง',
    });
  }

  const { message, history, clientDate } = req.body || {};
  const accessToken = getBearerToken(req);

  const { status, body } = await handleChat({ message, history, accessToken, clientDate });
  return res.status(status).json(body);
}
