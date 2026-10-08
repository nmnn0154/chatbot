import { createClient } from '@supabase/supabase-js';
import { embedTexts } from './gemini.js';

/**
 * Server-side Retrieval-Augmented Generation (RAG) context lookup.
 *
 * Previously this ran in the browser (embedding + rpc call), which exposed the
 * raw query vector and forced an extra round-trip. It now runs on the server,
 * scoped to the caller's Supabase JWT so Row Level Security still applies.
 */

const MATCH_THRESHOLD = 0.15;
const MATCH_COUNT = 15;

// Read lazily — in dev, dotenv.config() runs after this module is imported.
const supabaseUrl = () => process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = () => process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

/**
 * Build a Supabase client that acts on behalf of the signed-in user.
 * @param {string} [accessToken] raw JWT from the client's `Authorization: Bearer` header
 */
function getUserClient(accessToken) {
  return createClient(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : {},
  });
}

/**
 * Anchor queries to the กยศ. domain so vector similarity and embeddings
 * consistently match relevant policy chunks (fixes query drift on queries like "เอกสารที่ต้องใช้เตรียมกู้รายใหม่").
 */
function enhanceQuery(query) {
  const q = query.trim();
  if (!q.includes('กยศ') && !q.includes('กองทุน')) {
    return `${q} กยศ. กองทุนเงินให้กู้ยืมเพื่อการศึกษา มทร.ศรีวิชัย`;
  }
  return q;
}

/**
 * Fetch published calendar events and categorize them based on the real current date.
 * The chatbot needs these to answer "ปฏิทินการดำเนินงาน" questions (ทั้งที่มีอยู่และที่หมดไปแล้ว).
 * @param {any} supabase
 * @param {string|Date|null} [clientDate]
 */
async function fetchCalendarContext(supabase, clientDate = null) {
  try {
    let now = new Date();
    if (clientDate) {
      const parsed = new Date(clientDate);
      if (!isNaN(parsed.getTime())) now = parsed;
    }
    const todayIso = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(now);
    const todayThai = now.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'long', year: 'numeric' });

    // Fetch published events
    const { data, error } = await supabase
      .from('calendar_events')
      .select('title, description, category, academic_year, term, borrower_type, start_date, end_date')
      .eq('is_published', true)
      .order('start_date', { ascending: true });

    if (!data || data.length === 0) return null;

    const fmt = (d) => (d ? new Date(d).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'long', year: 'numeric' }) : '');

    const upcoming = [];
    const past = [];

    for (const e of data) {
      const end = e.end_date || e.start_date;
      const isPast = end < todayIso;
      const range = e.end_date ? `${fmt(e.start_date)} – ${fmt(e.end_date)}` : fmt(e.start_date);
      const term = e.term ? ` ภาคเรียนที่ ${e.term}` : '';
      const year = e.academic_year ? `/${e.academic_year}` : '';
      const who = e.borrower_type && e.borrower_type !== 'ทั้งหมด' ? ` (ผู้กู้${e.borrower_type})` : '';
      const line = `- [${e.category}] ${e.title}${term}${year}${who}: ${range}${e.description ? ` — ${e.description}` : ''}`;

      if (isPast) {
        past.push(line);
      } else {
        upcoming.push(line);
      }
    }

    let result = `ปฏิทินการดำเนินงาน กยศ. มทร.ศรีวิชัย (คำนวณสถานะอิงจากวันที่ปัจจุบันจริง: ${todayThai} / ${todayIso}):\n`;
    if (upcoming.length > 0) {
      result += `\n[กำหนดการที่มีอยู่ / กำลังดำเนินการ / กำลังจะมาถึง]:\n${upcoming.join('\n')}\n`;
    } else {
      result += `\n[กำหนดการที่มีอยู่ / กำลังดำเนินการ / กำลังจะมาถึง]: ขณะนี้ไม่มีกำหนดการใหม่ที่เปิดรับ\n`;
    }
    if (past.length > 0) {
      result += `\n[กำหนดการที่หมดเขต / ผ่านพ้นไปแล้ว]:\n${past.join('\n')}\n`;
    }
    return result;
  } catch {
    return null;
  }
}

/** 
 * Improved keyword overlap score for Thai queries and text.
 * Generates sliding substrings (n-grams) when whitespace is absent.
 */
function keywordScore(query, text) {
  if (!text || !query) return 0;
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  let score = 0;

  // Exact substring match
  if (q.length >= 3 && t.includes(q)) score += 8;

  // Split tokens by space/punctuation
  const tokens = q.split(/[\s,.?!/()"'“”）（]+/).filter((w) => w.length >= 3);
  for (const w of tokens) {
    if (t.includes(w)) score += 3;
  }

  // Also check 3-char to 6-char sliding window for continuous Thai text
  const cleanQ = q.replace(/[\s,.?!/()"'“”）（]+/g, '');
  if (cleanQ.length >= 4) {
    for (let len = 4; len <= Math.min(8, cleanQ.length); len++) {
      for (let i = 0; i <= cleanQ.length - len; i += 2) {
        const sub = cleanQ.substring(i, i + len);
        if (t.includes(sub)) score += 1;
      }
    }
  }

  return score;
}

/**
 * Pull the most relevant rows from the curated knowledge_base + faqs tables.
 * These are small hand-written Q&A sets, so we fetch all and rank in memory —
 * this lets the chatbot answer from seed/FAQ content even before any PDF is
 * uploaded to the vector store.
 */
async function fetchCuratedContext(supabase, message) {
  try {
    const [kb, faq] = await Promise.all([
      supabase.from('knowledge_base').select('topic, question, answer').limit(300),
      supabase.from('faqs').select('question, answer').limit(300),
    ]);

    const rows = [];
    (kb.data || []).forEach((r) => rows.push({ q: `${r.topic} ${r.question}`, a: r.answer }));
    (faq.data || []).forEach((r) => rows.push({ q: r.question, a: r.answer }));
    if (rows.length === 0) return [];

    const ranked = rows
      .map((r) => ({ r, s: keywordScore(message, r.q) * 2 + keywordScore(message, r.a) }))
      .sort((a, b) => b.s - a.s);

    // Take scoring matches; if nothing matched, still seed a few baseline entries.
    let picked = ranked.filter((x) => x.s > 0).slice(0, 8);
    if (picked.length === 0) picked = ranked.slice(0, 4);

    return picked.map((x) => ({
      content: `คำถาม: ${x.r.q}\nคำตอบ: ${x.r.a}`,
      similarity: x.s > 0 ? undefined : 0,
      document_id: 'curated',
    }));
  } catch {
    return [];
  }
}

/**
 * Retrieve grounding context for a user message: upcoming calendar events,
 * curated knowledge_base/faqs rows, and the most relevant PDF chunks.
 * Never throws — returns [] on any failure so the chat can still respond.
 *
 * @param {string} message
 * @param {string} [accessToken]
 * @param {string|Date|null} [clientDate]
 * @returns {Promise<Array<{ document_id?: string, content: string, similarity?: number }>>}
 */
export async function retrieveContext(message, accessToken, clientDate = null) {
  if (!supabaseUrl() || !supabaseAnonKey()) {
    console.warn('[retrieval] Supabase env not configured — skipping context lookup');
    return [];
  }

  const supabase = getUserClient(accessToken);
  const chunks = [];

  const [calendarText, curated] = await Promise.all([
    fetchCalendarContext(supabase, clientDate),
    fetchCuratedContext(supabase, message),
  ]);
  if (calendarText) {
    chunks.push({ content: calendarText, similarity: 1, document_id: 'calendar' });
  }
  chunks.push(...curated);

  try {
    const [queryEmbedding] = await embedTexts([enhanceQuery(message)]);
    if (queryEmbedding && queryEmbedding.length > 0) {
      const { data, error } = await supabase.rpc('match_document_chunks', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        match_threshold: MATCH_THRESHOLD,
        match_count: MATCH_COUNT,
      });
      if (error) console.error('[retrieval] rpc error:', error.message);
      else if (data) chunks.push(...data);
    }
  } catch (error) {
    console.error('[retrieval] failed:', error?.message || error);
  }

  return chunks;
}
