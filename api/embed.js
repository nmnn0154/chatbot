import { handleEmbed } from './_lib/handlers.js';

/**
 * Vercel Serverless Function — POST /api/embed
 * Used by the admin Knowledge Base page to vectorise uploaded PDF chunks.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { texts } = req.body || {};
  const { status, body } = await handleEmbed({ texts });
  return res.status(status).json(body);
}
