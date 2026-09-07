import { createClient } from '@supabase/supabase-js';
import { embedTexts } from './gemini.js';

/**
 * Server-side Retrieval-Augmented Generation (RAG) context lookup.
 *
 * Previously this ran in the browser (embedding + rpc call), which exposed the
 * raw query vector and forced an extra round-trip. It now runs on the server,
 * scoped to the caller's Supabase JWT so Row Level Security still applies.
 */

const MATCH_THRESHOLD = 0.2;
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
 * Anchor very short / generic queries to the กยศ. domain so vector similarity
 * has something to grab onto (e.g. a bare "คุณสมบัติ").
 */
function enhanceQuery(query) {
  const q = query.trim();
  if (q.length < 30 && !q.includes('กยศ')) {
    return `${q} กยศ. กองทุนเงินให้กู้ยืมเพื่อการศึกษา`;
  }
  return q;
}

/**
 * Fetch upcoming published calendar events and render them as one context block.
 * The chatbot needs these to answer "ปฏิทินการดำเนินงาน" questions (scope 1.3.1).
 */
async function fetchCalendarContext(supabase) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('calendar_events')
      .select('title, description, category, academic_year, term, borrower_type, start_date, end_date')
      .eq('is_published', true)
      .or(`end_date.gte.${today},and(end_date.is.null,start_date.gte.${today})`)
      .order('start_date', { ascending: true })
      .limit(20);

    if (error || !data || data.length === 0) return null;

    const fmt = (d) => (d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
    const lines = data.map((e) => {
      const range = e.end_date ? `${fmt(e.start_date)} – ${fmt(e.end_date)}` : fmt(e.start_date);
      const term = e.term ? ` ภาคเรียนที่ ${e.term}` : '';
      const year = e.academic_year ? `/${e.academic_year}` : '';
      const who = e.borrower_type && e.borrower_type !== 'ทั้งหมด' ? ` (ผู้กู้${e.borrower_type})` : '';
      return `- [${e.category}] ${e.title}${term}${year}${who}: ${range}${e.description ? ` — ${e.description}` : ''}`;
    });
    return `ปฏิทินการดำเนินงาน กยศ. มทร.ศรีวิชัย (กำหนดการที่กำลังจะถึง):\n${lines.join('\n')}`;
  } catch {
    return null;
  }
}

/** Cheap keyword overlap score between a query and a piece of text. */
function keywordScore(query, text) {
  if (!text) return 0;
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  let score = 0;
  if (q.length >= 4 && t.includes(q)) score += 5;
  const tokens = q.split(/[\s,.?!/()"'“”）（]+/).filter((w) => w.length >= 3);
  for (const w of tokens) if (t.includes(w)) score += 1;
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
 * @returns {Promise<Array<{ document_id?: string, content: string, similarity?: number }>>}
 */
export async function retrieveContext(message, accessToken) {
  if (!supabaseUrl() || !supabaseAnonKey()) {
    console.warn('[retrieval] Supabase env not configured — skipping context lookup');
    return [];
  }

  const supabase = getUserClient(accessToken);
  const chunks = [];

  const [calendarText, curated] = await Promise.all([
    fetchCalendarContext(supabase),
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
