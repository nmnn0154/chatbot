import { generateChatResponse, embedTexts, isQuotaError } from './gemini.js';
import { retrieveContext } from './retrieval.js';

/**
 * Framework-agnostic request handlers shared by the Vercel serverless functions
 * (api/chat.js, api/embed.js) and the Vite dev middleware (vite.config.js).
 *
 * Each returns { status: number, body: object }.
 */

// ---- Basic in-memory IP rate limiting -------------------------------------
// NOTE: in-memory state does not persist across serverless instances. It is a
// best-effort guard only; a durable store (Upstash/DB) is the production answer.
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

export function isRateLimited(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) return true;
  record.count += 1;
  return false;
}

// ---- /api/chat ----------------------------------------------------------------

/**
 * @param {{ message: string, history?: Array<any>, accessToken?: string }} params
 */
export async function handleChat({ message, history = [], accessToken }) {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return { status: 400, body: { error: 'Message is required and must be a non-empty string' } };
  }
  if (message.length > 2000) {
    return { status: 400, body: { error: 'Message is too long (maximum 2,000 characters)' } };
  }

  try {
    // 1. Retrieve grounding context (server-side RAG)
    // If message is short or contextual (e.g. "แล้วข้อ 2 ล่ะ"), also append last user question to retrieval query
    let queryForRetrieval = message;
    if (message.length < 30 && Array.isArray(history) && history.length > 0) {
      const lastUser = [...history].reverse().find(h => (h.role === 'user' || h.type === 'user'));
      if (lastUser && lastUser.text) {
        queryForRetrieval = `${lastUser.text} ${message}`;
      }
    }

    const chunks = await retrieveContext(queryForRetrieval, accessToken);

    // 2. Generate the grounded answer with conversation history
    const response = await generateChatResponse(message, chunks, history);

    return {
      status: 200,
      body: {
        response,
        sources: chunks.map((c) => ({
          document_id: c.document_id,
          similarity: c.similarity,
          excerpt: String(c.content || '').slice(0, 200),
        })),
      },
    };
  } catch (error) {
    console.error('[handleChat] error:', error?.message || error);
    if (error?.code === 'NO_API_KEY') {
      return { status: 500, body: { error: 'Gemini API key not configured' } };
    }
    if (isQuotaError(error)) {
      return { status: 429, body: { error: 'โควต้า API รายวันหมดชั่วคราว กรุณาลองใหม่อีกครั้งในภายหลัง' } };
    }
    return { status: 500, body: { error: 'Failed to generate response' } };
  }
}

// ---- /api/embed -------------------------------------------------------------

/**
 * @param {{ texts: string[] }} params
 */
export async function handleEmbed({ texts }) {
  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    return { status: 400, body: { error: 'texts must be a non-empty array of strings' } };
  }
  if (texts.length > 50) {
    return { status: 400, body: { error: 'Maximum 50 texts per embedding request' } };
  }

  try {
    const embeddings = await embedTexts(texts);
    return { status: 200, body: { embeddings } };
  } catch (error) {
    console.error('[handleEmbed] error:', error?.message || error);
    if (error?.code === 'NO_API_KEY') {
      return { status: 500, body: { error: 'Gemini API key not configured' } };
    }
    if (isQuotaError(error)) {
      return { status: 429, body: { error: 'โควต้า API รายวันหมดชั่วคราว กรุณาลองใหม่อีกครั้งในภายหลัง' } };
    }
    return { status: 500, body: { error: 'Failed to generate embeddings' } };
  }
}

// ---- helpers for the raw-http (Vite) adapter ------------------------------

export function readJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

export function getBearerToken(req) {
  const h = req.headers?.authorization || req.headers?.Authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : undefined;
}
