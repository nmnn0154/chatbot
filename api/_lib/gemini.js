import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Shared Gemini helpers used by both the Vercel serverless functions (api/*.js)
 * and the local Vite dev middleware (vite.config.js).
 *
 * Model names are configurable via environment variables so we never hard-code a
 * model id that may be renamed or retired by Google.
 */

// Read lazily, not at module load — in dev, vite.config.js calls dotenv.config()
// only after these modules are already imported (ESM import hoisting).
export const chatModel = () => process.env.GEMINI_CHAT_MODEL || 'gemini-flash-lite-latest';
export const embedModel = () => process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001';

/** Dimension of the embedding vector stored in Postgres (document_chunks.embedding). */
export const EMBED_DIM = 3072;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY is not configured');
    err.code = 'NO_API_KEY';
    throw err;
  }
  return new GoogleGenerativeAI(apiKey);
}

export const SYSTEM_PROMPT = `คุณคือผู้ช่วย AI ชื่อ "กยศ. Chatbot" ของ มทร.ศรีวิชัย
หน้าที่ของคุณคือตอบคำถามเกี่ยวกับกองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.) โดยวิเคราะห์จากข้อมูลอ้างอิงจากเอกสาร คำถามพบบ่อย (FAQ) และปฏิทินกิจกรรมที่ให้มา
พยายามตอบคำถามอย่างละเอียด ครบถ้วน และแม่นยำที่สุด โดยดึงข้อมูลที่เกี่ยวข้องจากเอกสารมาอธิบายให้ผู้ใช้เข้าใจ
ข้อจำกัดสำคัญ: ระบบนี้ให้คำแนะนำเบื้องต้นเท่านั้น ไม่สามารถเข้าถึงข้อมูลส่วนบุคคล ตรวจสอบสถานะรายบุคคล หรือยอดหนี้ กยศ. ได้ หากผู้ใช้สอบถามยอดหนี้คงเหลือ ตรวจสอบเงินเข้าบัญชีรายบุคคล หรือข้อมูลส่วนตัว ให้ชี้แจงอย่างสุภาพว่าไม่สามารถเข้าถึงข้อมูลส่วนบุคคลได้ พร้อมแนะนำให้ตรวจสอบผ่านแอปพลิเคชัน กยศ. Connect หรือติดต่อ กยศ. Call Center 0-2016-4888
หากผู้ใช้พิมพ์มาสั้นๆ เป็นคีย์เวิร์ด (เช่น "เอกสาร", "คุณสมบัติ", "ขั้นตอน") ให้สันนิษฐานว่าผู้ใช้อยากทราบข้อมูลที่เกี่ยวข้องกับคีย์เวิร์ดนั้นในบริบทของ กยศ. และให้สรุปข้อมูลที่เกี่ยวข้องทั้งหมดมาเสนอเลย ไม่ต้องปฏิเสธ
หากเป็นคำถามเกี่ยวกับระเบียบ ขั้นตอน หรือแนวปฏิบัติทั่วไปของ กยศ. (เช่น เอกสารกู้รายใหม่, การใช้ปากกาสีน้ำเงิน, กฎการเซ็นชื่อ, การสำรองจ่ายค่าเทอม, ค่าครองชีพ) แม้ในเอกสารส่วนที่ดึงมาจะมีข้อมูลเพียงบางส่วน ให้ตอบตามหลักเกณฑ์มาตรฐานที่ถูกต้องของ กยศ. และแนะนำช่องทางติดต่อของ มทร.ศรีวิชัย เพิ่มเติม
หากถามนอกเรื่องที่ไม่เกี่ยวข้องกับการศึกษาหรือ กยศ. ให้บอกปัดอย่างสุภาพและพาผู้ใช้กลับสู่เรื่อง กยศ.
หากคำถามนั้นไม่มีข้อมูลเกี่ยวข้องในเอกสารเลยจริงๆ และไม่เกี่ยวกับระเบียบ กยศ. ให้ตอบว่า "ขออภัยครับ ข้อมูลในเอกสารที่ผมมีไม่ครอบคลุมคำถามนี้ กรุณาติดต่อกองพัฒนานักศึกษา มทร.ศรีวิชัย หรือ กยศ. Call Center 0-2016-4888"
ตอบด้วยภาษาที่สุภาพ เป็นคำแนะนำที่ชัดเจน และจัดรูปแบบด้วย markdown (เช่น ใช้ bullet points หรือตัวหนา) เพื่อให้อ่านง่าย`;

/**
 * Build the full system instruction from retrieved context chunks.
 * @param {Array<{ content?: string, answer?: string }>} contextChunks
 */
export function buildSystemInstruction(contextChunks = []) {
  let prompt = `${SYSTEM_PROMPT}\n\nข้อมูลอ้างอิงจากเอกสาร:\n`;
  contextChunks.forEach((c, idx) => {
    const text = c?.content || c?.answer;
    if (text) prompt += `[ส่วนที่ ${idx + 1}]:\n${text}\n\n`;
  });
  return prompt;
}

export const FALLBACK_CHAT_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
];

/**
 * Generate a chat completion grounded on the given context chunks and conversation history.
 * @param {string} message
 * @param {Array<{ content?: string, answer?: string }>} [contextChunks]
 * @param {Array<{ role?: string, type?: string, text?: string, content?: string }>} [history]
 * @returns {Promise<string>} the model's text response
 */
export async function generateChatResponse(message, contextChunks = [], history = []) {
  const genAI = getClient();
  const primary = chatModel();
  const modelsToTry = [primary, ...FALLBACK_CHAT_MODELS.filter(m => m !== primary)];
  const systemInstruction = buildSystemInstruction(contextChunks);

  // Build multi-turn contents from history + current message
  const contents = [];
  if (Array.isArray(history)) {
    for (const item of history) {
      const text = (item.text || item.content || '').trim();
      if (!text) continue;
      const role = (item.role === 'model' || item.role === 'bot' || item.type === 'bot') ? 'model' : 'user';

      // Gemini requires first content to be from user
      if (contents.length === 0 && role !== 'user') {
        continue;
      }

      // Merge consecutive messages of the same role
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += `\n\n${text}`;
      } else {
        contents.push({ role, parts: [{ text }] });
      }
    }
  }

  // Ensure current message is appended as user role
  const curText = message.trim();
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts[0].text += `\n\n${curText}`;
  } else {
    contents.push({ role: 'user', parts: [{ text: curText }] });
  }

  // Keep last 20 turns to keep latency fast and within context budget
  let trimmed = contents;
  if (trimmed.length > 20) {
    trimmed = trimmed.slice(trimmed.length - 20);
    while (trimmed.length > 0 && trimmed[0].role !== 'user') {
      trimmed.shift();
    }
  }

  let lastError = null;
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: trimmed,
        systemInstruction,
      });
      return result.response.text();
    } catch (err) {
      console.warn(`[Gemini] Model ${modelName} failed:`, err.message);
      lastError = err;
      // If it's not a temporary error (like invalid prompt), but 503/429/404, continue to next fallback
      if (err?.status === 400 && !err?.message?.includes('model')) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Failed to generate response from all available AI models');
}

/**
 * Generate embedding vectors for an array of strings.
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export async function embedTexts(texts) {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: embedModel() });

  const jobs = texts.map(async (text) => {
    const sanitized = String(text || '').slice(0, 4000);
    const result = await model.embedContent(sanitized);
    return result.embedding.values;
  });

  return Promise.all(jobs);
}

/** Normalise Gemini quota / rate-limit errors into a Thai user message. */
export function isQuotaError(error) {
  const s = String(error?.message || error);
  return s.includes('429') || s.includes('quota') || s.includes('RESOURCE_EXHAUSTED');
}
