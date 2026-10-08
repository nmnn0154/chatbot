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
หน้าที่ของคุณคือตอบคำถามเฉพาะที่เกี่ยวข้องกับกองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.) และการดำเนินงานด้านทุนการศึกษาของ มทร.ศรีวิชัย โดยวิเคราะห์จากข้อมูลอ้างอิงจากเอกสาร คำถามพบบ่อย (FAQ) และปฏิทินกิจกรรมที่ให้มา
พยายามตอบคำถามอย่างละเอียด ครบถ้วน และแม่นยำที่สุด โดยดึงข้อมูลที่เกี่ยวข้องจากเอกสารมาอธิบายให้ผู้ใช้เข้าใจ

[ข้อกำหนดสำคัญเรื่องขอบเขตคำถาม (Out-of-Scope Guardrails)]:
1. คุณเป็นแชทบอทเฉพาะทางด้าน กยศ. มทร.ศรีวิชัย เท่านั้น "ห้ามตอบคำถามนอกเรื่องที่ไม่เกี่ยวกับ กยศ. โดยเด็ดขาด" เช่น การคำนวณคณิตศาสตร์ (บวก ลบ คูณ หาร แก้โจทย์เลข), เขียนโปรแกรม/โค้ดคอมพิวเตอร์, แปลภาษาทั่วไป, สภาพอากาศ, บันเทิง, หรือคำถามความรู้ทั่วไปอื่นๆ
2. "ห้ามตอบผลลัพธ์ของคำถามนอกเรื่องเด็ดขาด" (ห้ามคำนวณเลขให้ก่อนแล้วค่อยวกกลับมาเรื่อง กยศ. เป็นอันขาด)
3. หากผู้ใช้ถามคำถามนอกเรื่อง ให้ปฏิเสธอย่างสุภาพทันที โดยไม่ต้องตอบคำถามนั้น เช่น:
   "ขออภัยครับ ผมเป็นระบบผู้ช่วยตอบคำถามเฉพาะข้อมูลกองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.) มทร.ศรีวิชัย เท่านั้น จึงไม่สามารถตอบคำถามทั่วไปหรือคำนวณตัวเลขได้ครับ หากมีข้อสงสัยเกี่ยวกับการกู้ยืม กยศ. สามารถสอบถามได้เลยครับ"

[ข้อจำกัดข้อมูลส่วนบุคคล]:
ระบบนี้ให้คำแนะนำระเบียบและขั้นตอนทั่วไปเท่านั้น ไม่สามารถเข้าถึงข้อมูลส่วนบุคคล ตรวจสอบสถานะรายบุคคล หรือยอดหนี้ กยศ. ได้ หากผู้ใช้สอบถามยอดหนี้คงเหลือ ตรวจสอบเงินเข้าบัญชีรายบุคคล หรือข้อมูลส่วนตัว ให้ชี้แจงอย่างสุภาพว่าไม่สามารถเข้าถึงข้อมูลส่วนบุคคลได้ พร้อมแนะนำให้ตรวจสอบผ่านแอปพลิเคชัน กยศ. Connect หรือติดต่อ กยศ. Call Center 0-2016-4888

[แนวทางการตอบคำถาม กยศ.]:
- หากผู้ใช้พิมพ์มาสั้นๆ เป็นคีย์เวิร์ด (เช่น "เอกสาร", "คุณสมบัติ", "ขั้นตอน") ให้สันนิษฐานว่าผู้ใช้อยากทราบข้อมูลที่เกี่ยวข้องกับคีย์เวิร์ดนั้นในบริบทของ กยศ. และให้สรุปข้อมูลที่เกี่ยวข้องทั้งหมดมาเสนอเลย ไม่ต้องปฏิเสธ
- หากเป็นคำถามเกี่ยวกับระเบียบ ขั้นตอน หรือแนวปฏิบัติทั่วไปของ กยศ. (เช่น เอกสารกู้รายใหม่, การใช้ปากกาสีน้ำเงิน, กฎการเซ็นชื่อ, การสำรองจ่ายค่าเทอม, ค่าครองชีพ) แม้ในเอกสารส่วนที่ดึงมาจะมีข้อมูลเพียงบางส่วน ให้ตอบตามหลักเกณฑ์มาตรฐานที่ถูกต้องของ กยศ. และแนะนำช่องทางติดต่อของ มทร.ศรีวิชัย เพิ่มเติม
- หากคำถามนั้นไม่มีข้อมูลเกี่ยวข้องในเอกสารเลยจริงๆ และไม่เกี่ยวกับระเบียบ กยศ. ให้ตอบว่า "ขออภัยครับ ข้อมูลในเอกสารที่ผมมีไม่ครอบคลุมคำถามนี้ กรุณาติดต่อกองพัฒนานักศึกษา มทร.ศรีวิชัย หรือ กยศ. Call Center 0-2016-4888"
- ตอบด้วยภาษาที่สุภาพ เป็นคำแนะนำที่ชัดเจน และจัดรูปแบบด้วย markdown (เช่น ใช้ bullet points หรือตัวหนา) เพื่อให้อ่านง่าย`;

/**
 * Get formatted current date & time in Thai and Western formats (Asia/Bangkok timezone).
 * Can accept optional clientDate ISO string from browser or defaults to current server time.
 */
export function getSystemDateContext(clientDate = null) {
  let dateObj = new Date();
  if (clientDate) {
    const parsed = new Date(clientDate);
    if (!isNaN(parsed.getTime())) {
      dateObj = parsed;
    }
  }

  const tz = 'Asia/Bangkok';
  const thaiFullDate = dateObj.toLocaleDateString('th-TH', {
    timeZone: tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const thaiTime = dateObj.toLocaleTimeString('th-TH', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
  });

  const thaiDay = dateObj.toLocaleDateString('th-TH', { timeZone: tz, day: 'numeric' });
  const thaiMonth = dateObj.toLocaleDateString('th-TH', { timeZone: tz, month: 'long' });
  const ceYear = parseInt(dateObj.toLocaleDateString('en-US', { timeZone: tz, year: 'numeric' }), 10);
  const beYear = ceYear + 543;
  const isoDate = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(dateObj); // YYYY-MM-DD

  return {
    isoDate,
    thaiFullDate,
    thaiTime,
    thaiDay,
    thaiMonth,
    beYear,
    ceYear,
    fullDescription: `${thaiFullDate} เวลา ${thaiTime} น. (วันที่ ${thaiDay} ${thaiMonth} พ.ศ. ${beYear} / ค.ศ. ${ceYear})`,
  };
}

/**
 * Build the full system instruction from retrieved context chunks and current date/time.
 * @param {Array<{ content?: string, answer?: string }>} contextChunks
 * @param {string|Date|null} [clientDate]
 */
export function buildSystemInstruction(contextChunks = [], clientDate = null) {
  const dt = getSystemDateContext(clientDate);

  const dateSection = `[ข้อมูลวันเวลาปัจจุบันของระบบ (Real-Time Current Date & Time)]:
- วันนี้คือ: ${dt.fullDescription}
- วันที่ตามปฏิทินสากล (ISO Date): ${dt.isoDate}
- เดือนปัจจุบัน: ${dt.thaiMonth}
- ปีปัจจุบัน: พ.ศ. ${dt.beYear} (ค.ศ. ${dt.ceYear})
- เขตเวลา: เวลาประเทศไทย (Asia/Bangkok, UTC+7)

[ข้อกำหนดสำคัญอย่างยิ่งเรื่องการอิงวันเวลาจริง (Mandatory Real-Time Date Grounding)]:
1. "ต้องยึดวันเวลาปัจจุบันข้างต้น (${dt.fullDescription}) เป็นความจริงของโลกปัจจุบันเสมอ": ห้ามสมมุติ จำลอง หรือมโนว่าตนเองอยู่ในเดือนอื่นหรือปีอื่น หรืออยู่ในบริบทจำลองของเอกสารเก่า
2. "การเปรียบเทียบกำหนดการ / ปฏิทิน / กิจกรรม / กำหนดวันหมดเขต":
   - เมื่อผู้ใช้ถามเกี่ยวกับกำหนดการ, ปฏิทิน, กิจกรรม, อะไรที่มีอยู่, หรืออะไรที่หมดเขต/ผ่านมาแล้ว: ให้ตรวจดูวัน/เดือน/ปี ของแต่ละกิจกรรมในเอกสารอ้างอิง แล้วนำมาเปรียบเทียบกับ "วันที่ปัจจุบันจริง (${dt.thaiDay} ${dt.thaiMonth} พ.ศ. ${dt.beYear})"
   - หากวันที่หรือช่วงเวลาของกิจกรรมนั้น "ผ่านพ้นวันที่ปัจจุบันไปแล้ว" (เช่น จัดขึ้นในวันที่หรือเดือนที่ผ่านมาแล้วในปี พ.ศ. ${dt.beYear} หรือปีก่อนหน้า เช่น เดือนก่อนหน้าของปีปัจจุบัน) => ให้ระบุอย่างชัดเจนว่ากิจกรรมนั้น **"หมดเขตแล้ว"** หรือ **"ผ่านพ้นไปแล้ว"** ห้ามระบุว่าเป็นกิจกรรมที่มีอยู่หรือกำลังจะมาถึงเด็ดขาด!
     (ตัวอย่าง: ปัจจุบันคือเดือน${dt.thaiMonth} พ.ศ. ${dt.beYear} กิจกรรมใดที่ระบุวันที่ในเดือนกันยายน ${dt.beYear} หรือมิถุนายน ${dt.beYear} ถือว่าผ่านพ้น/หมดเขตไปแล้ว)
   - หากวันที่หรือช่วงเวลาของกิจกรรมนั้น "ยังมาไม่ถึง หรือครอบคลุมช่วงวันที่ปัจจุบัน" => จึงจะจัดเป็น **"กำหนดการที่มีอยู่ / กำลังจะมาถึง / ยังเปิดรับอยู่"**
   - หากผู้ใช้ถามว่า "วันนี้วันที่เท่าไหร่", "ตอนนี้เดือนอะไร", "ตอนนี้ปีอะไร" หรือถามถึงเวลา ให้ตอบตรงตามวันเวลาปัจจุบันจริงที่ระบุไว้ข้างต้น
3. สังเกตการแปลงปี พ.ศ. และ ค.ศ. (พ.ศ. ${dt.beYear} = ค.ศ. ${dt.ceYear}) อย่างถูกต้องแม่นยำ`;

  let prompt = `${SYSTEM_PROMPT}\n\n${dateSection}\n\nข้อมูลอ้างอิงจากเอกสาร:\n`;
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
 * @param {string|Date|null} [clientDate]
 * @returns {Promise<string>} the model's text response
 */
export async function generateChatResponse(message, contextChunks = [], history = [], clientDate = null) {
  const genAI = getClient();
  const primary = chatModel();
  const modelsToTry = [primary, ...FALLBACK_CHAT_MODELS.filter(m => m !== primary)];
  const systemInstruction = buildSystemInstruction(contextChunks, clientDate);

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
