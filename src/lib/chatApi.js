import { supabase } from './supabase';

/**
 * Helper: Call the new `/api/embed` endpoint to get vector embeddings
 */
async function generateEmbeddings(texts) {
  try {
    const res = await fetch('/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts })
    });
    if (!res.ok) {
      throw new Error('Failed to generate embeddings');
    }
    const data = await res.json();
    return data.embeddings; // Array of vectors
  } catch (err) {
    console.error('Embedding error:', err);
    throw err;
  }
}

/**
 * Send a message to the Gemini-powered chatbot.
 *
 * Retrieval-Augmented Generation now happens entirely server-side in
 * `/api/chat` (see api/_lib/handlers.js). The client only forwards the message
 * plus the user's Supabase access token so RLS still applies during retrieval.
 */
/**
 * Send a message to the Gemini-powered chatbot.
 *
 * Retrieval-Augmented Generation happens server-side in
 * `/api/chat` (see api/_lib/handlers.js). The client forwards the message,
 * previous conversation history for multi-turn chat, plus user's Supabase access token.
 */
export async function sendChatMessage(message, userId, history = []) {
  try {
    // Attach the signed-in user's JWT so the server can query document_chunks
    // under Row Level Security.
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    let botResponse;
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ message, history }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      botResponse = data.response;
    } catch (apiError) {
      console.warn('Gemini API unavailable:', apiError.message);
      if (apiError.message.includes('โควต้า') || apiError.message.includes('429')) {
        // Calculate time until midnight (next quota reset)
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const diffMs = midnight - now;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const resetDate = midnight.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
        botResponse = `⚠️ **โควต้า API รายวันหมดแล้วครับ** (Free Tier จำกัด 20 ครั้ง/วัน)\n\n🕐 จะใช้งานได้อีกครั้งใน **${diffHrs} ชั่วโมง ${diffMins} นาที** (ประมาณเที่ยงคืนวันที่ ${resetDate})\n\nหากต้องการสอบถามข้อมูลเร่งด่วน กรุณาติดต่อกองพัฒนานักศึกษา มทร.ศรีวิชัย หรือ กยศ. Call Center **0-2016-4888** ครับ`;
      } else {
        botResponse = 'ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ AI กรุณาลองใหม่อีกครั้งในภายหลัง';
      }
    }

    // Save chat Q&A pair to Supabase (anonymous - for analytics & rating)
    let historyId = null;
    const saved = await saveChatHistory(message, botResponse);
    if (saved) {
      historyId = saved.id;
    }

    return { text: botResponse, id: historyId };
  } catch (error) {
    console.error('Chat error:', error);
    return { text: 'ขออภัยครับ เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่โดยตรง', id: null };
  }
}

/**
 * Save chat history to Supabase (Always anonymous - no user data stored)
 */
async function saveChatHistory(userMessage, botResponse) {
  try {
    const { data, error } = await supabase.from('chat_histories').insert({
      user_id: null,
      user_message: userMessage,
      bot_response: botResponse,
    }).select().single();

    if (error) {
      console.error('Failed to save chat history:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Save chat history error:', error);
    return null;
  }
}

/**
 * Rate a chatbot response (1-5 stars)
 */
export async function rateChatResponse(historyId, rating, userId = null) {
  if (!historyId || !rating) return false;
  
  try {
    // Goes through a SECURITY DEFINER function (migration 008) that only ever
    // touches the `rating` column of a not-yet-rated row.
    const { error } = await supabase.rpc('rate_chat_response', {
      p_id: historyId,
      p_rating: rating,
    });

    if (error) throw error;

    // Update local storage rating
    updateLocalChatRating(historyId, rating, userId);

    return true;
  } catch (error) {
    console.error('Failed to rate chat response:', error);
    return false;
  }
}

// ==========================================
// LOCAL STORAGE MANAGEMENT (Per-User Separation & Multi-turn Threads)
// ==========================================

const LOCAL_STORAGE_BASE = 'rmutsv_chatbot_history';
const LEGACY_STORAGE_BASE = 'kku_chatbot_history';

/**
 * Normalise legacy single Q&A items or multi-turn thread items
 */
export function normalizeThread(item) {
  if (!item || typeof item !== 'object') return null;
  if (Array.isArray(item.messages)) {
    return {
      id: String(item.id),
      title: item.title || item.messages[0]?.text?.substring(0, 40) || 'บทสนทนา',
      messages: item.messages,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || item.created_at || new Date().toISOString(),
    };
  }
  // Legacy single Q&A format
  const title = item.user_message || 'บทสนทนา';
  const createdAt = item.created_at || new Date().toISOString();
  return {
    id: String(item.id),
    title: title.length > 40 ? title.substring(0, 40) + '...' : title,
    messages: [
      {
        id: `${item.id}_u`,
        type: 'user',
        text: item.user_message || '',
        time: createdAt,
      },
      {
        id: `${item.id}_b`,
        type: 'bot',
        text: item.bot_response || '',
        time: createdAt,
        historyId: item.id,
        rating: item.rating || null,
      },
    ],
    created_at: createdAt,
    updated_at: createdAt,
  };
}

/**
 * Get localStorage key unique to each user
 */
function getStorageKey(userId) {
  return userId ? `${LOCAL_STORAGE_BASE}_${userId}` : LOCAL_STORAGE_BASE;
}

/**
 * Get chat history from localStorage (separated per user)
 */
export function getChatHistory(userId = null) {
  try {
    const key = getStorageKey(userId);
    let data = localStorage.getItem(key);
    // Legacy fallback migration
    if (!data && !userId) {
      data = localStorage.getItem(LEGACY_STORAGE_BASE);
    }
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeThread).filter(Boolean);
      }
    }
  } catch (err) {
    console.error('Failed to read local chat history', err);
  }
  return [];
}

/**
 * Get specific chat by ID from localStorage
 */
export function getChatById(id, userId = null) {
  const history = getChatHistory(userId);
  return history.find(chat => chat.id === String(id)) || null;
}

/**
 * Save an entire multi-turn thread to localStorage (per-user key)
 */
export function saveThreadToLocal(userId, thread) {
  const key = getStorageKey(userId);
  const history = getChatHistory(userId);
  const existingIdx = history.findIndex(t => t.id === String(thread.id));

  const cleanThread = {
    id: String(thread.id),
    title: thread.title || thread.messages?.[0]?.text?.substring(0, 40) || 'บทสนทนา',
    created_at: thread.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    messages: thread.messages || [],
  };

  if (existingIdx !== -1) {
    // Keep original created_at
    cleanThread.created_at = history[existingIdx].created_at;
    history.splice(existingIdx, 1);
    history.unshift(cleanThread);
  } else {
    history.unshift(cleanThread);
  }

  if (history.length > 30) history.length = 30;
  localStorage.setItem(key, JSON.stringify(history));
  window.dispatchEvent(new Event('chatHistoryUpdated'));
}

/**
 * Backward-compatible saveChatToLocal
 */
export function saveChatToLocal(userId, chatItem) {
  if (chatItem.messages && Array.isArray(chatItem.messages)) {
    saveThreadToLocal(userId, chatItem);
  } else {
    const thread = normalizeThread(chatItem);
    if (thread) saveThreadToLocal(userId, thread);
  }
}

export function getLocalChatById(id) {
  return getChatById(id, null);
}

export function updateLocalChatRating(id, rating, userId = null) {
  const key = getStorageKey(userId);
  const history = getChatHistory(userId);
  let changed = false;

  for (const thread of history) {
    if (Array.isArray(thread.messages)) {
      for (const msg of thread.messages) {
        if (msg.historyId === id || msg.id === id) {
          msg.rating = rating;
          changed = true;
        }
      }
    }
  }

  if (changed) {
    localStorage.setItem(key, JSON.stringify(history));
    window.dispatchEvent(new Event('chatHistoryUpdated'));
  }
}

/**
 * Delete a specific chat item from localStorage
 */
export function deleteChatFromLocal(id, userId = null) {
  try {
    const key = getStorageKey(userId);
    const history = getChatHistory(userId);
    const updated = history.filter(chat => chat.id !== String(id));
    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new Event('chatHistoryUpdated'));
    return updated;
  } catch (err) {
    console.error('Failed to delete chat from local storage:', err);
    return [];
  }
}

/**
 * Clear all chat history from localStorage
 */
export function clearAllChatHistory(userId = null) {
  try {
    const key = getStorageKey(userId);
    localStorage.removeItem(key);
    if (!userId) {
      localStorage.removeItem(LEGACY_STORAGE_BASE);
    }
    window.dispatchEvent(new Event('chatHistoryUpdated'));
  } catch (err) {
    console.error('Failed to clear chat history:', err);
  }
}

// ==========================================
// KNOWLEDGE BASE DOCUMENTS & PDF MANAGEMENT
// ==========================================

const DOC_STORAGE_BUCKET = 'document-files';
const KNOWLEDGE_META_STORAGE_KEY = 'rmutsv_knowledge_doc_meta';

function getDocMetaFallbacks() {
  try {
    const raw = localStorage.getItem(KNOWLEDGE_META_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDocMetaFallback(docId, meta) {
  try {
    if (!docId || !meta) return;
    const current = getDocMetaFallbacks();
    current[docId] = {
      ...current[docId],
      file_url: meta.publicUrl || meta.fileUrl || meta.file_url || null,
      file_size: meta.fileSize || meta.file_size || null,
      file_type: meta.fileType || meta.file_type || 'PDF',
    };
    localStorage.setItem(KNOWLEDGE_META_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Failed to save document metadata fallback:', e);
  }
}

function removeDocMetaFallback(docId) {
  try {
    const current = getDocMetaFallbacks();
    if (current[docId]) {
      delete current[docId];
      localStorage.setItem(KNOWLEDGE_META_STORAGE_KEY, JSON.stringify(current));
    }
  } catch (e) {
    console.warn('Failed to remove document metadata fallback:', e);
  }
}

export function formatDocFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Upload a PDF or document file to Supabase Storage (document-files bucket)
 */
export async function uploadKnowledgeFileToStorage(file) {
  try {
    const fileExt = (file.name.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf';
    // Storage keys must be ASCII only. Remove non-ASCII characters (such as Thai script) to avoid "Invalid key" error
    const rawBase = file.name.replace(/\.[^/.]+$/, '');
    const asciiOnly = rawBase.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').slice(0, 30);
    const safeBase = asciiOnly.replace(/^_+|_+$/g, '') || 'doc';
    const fileName = `knowledge_${Date.now()}_${safeBase}.${fileExt}`;
    const contentType = file.type || (fileExt === 'pdf' ? 'application/pdf' : 'application/octet-stream');

    const { error: uploadError } = await supabase.storage
      .from(DOC_STORAGE_BUCKET)
      .upload(fileName, file, { contentType, cacheControl: '3600', upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(DOC_STORAGE_BUCKET).getPublicUrl(fileName);
    return {
      publicUrl: data.publicUrl,
      fileName: file.name,
      fileSize: formatDocFileSize(file.size),
      fileType: fileExt.toUpperCase(),
      storagePath: fileName,
    };
  } catch (error) {
    console.warn('Knowledge file storage upload failed:', error);
    // Return metadata without crashing; publicUrl is null so large base64 strings do not cause HTTP 500 in Postgres
    return {
      publicUrl: null,
      fileName: file.name,
      fileSize: formatDocFileSize(file.size),
      fileType: (file.name.split('.').pop() || 'PDF').toUpperCase(),
      storagePath: null,
    };
  }
}

/**
 * Get all document references (for admin) with metadata enrichment
 */
export async function getDocuments(searchQuery = '') {
  let query = supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (searchQuery) {
    query = query.ilike('filename', `%${searchQuery}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Enrich with local cache in case file_url column was just added or offline
  const metaCache = getDocMetaFallbacks();
  const enriched = (data || []).map((doc) => {
    const cached = metaCache[doc.id] || {};
    return {
      ...doc,
      file_url: doc.file_url || cached.file_url || null,
      file_size: doc.file_size || cached.file_size || null,
      file_type: doc.file_type || cached.file_type || (doc.filename?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'TEXT'),
    };
  });

  return enriched;
}

/**
 * Get chunks of a specific document for previewing AI indexing
 */
export async function getDocumentChunks(documentId) {
  try {
    const { data, error } = await supabase
      .from('document_chunks')
      .select('id, content, created_at')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to get document chunks:', err);
    return [];
  }
}

/**
 * Upload and process a document (metadata, optional PDF storage, and vector chunks)
 */
export async function uploadDocument(filename, uploaderId, chunksData, meta = {}) {
  // 1. Insert Document record with file metadata (supports migration 011 and graceful fallback)
  let docData;
  const insertPayload = {
    filename,
    uploaded_by: uploaderId,
  };

  const fileUrl = meta.publicUrl || meta.file_url;
  if (fileUrl && typeof fileUrl === 'string' && fileUrl.startsWith('http')) {
    insertPayload.file_url = fileUrl;
  }
  if (meta.fileSize || meta.file_size) {
    insertPayload.file_size = String(meta.fileSize || meta.file_size);
  }
  if (meta.fileType || meta.file_type) {
    insertPayload.file_type = String(meta.fileType || meta.file_type);
  }

  const { data, error: docError } = await supabase
    .from('documents')
    .insert(insertPayload)
    .select()
    .single();

  if (docError) {
    console.warn('documents insert with metadata had an issue, falling back to base insert:', docError.message || docError);
    const fallbackRes = await supabase
      .from('documents')
      .insert({ filename, uploaded_by: uploaderId })
      .select()
      .single();

    if (fallbackRes.error) {
      console.error('Document insert fallback error:', fallbackRes.error);
      throw new Error(fallbackRes.error.message || 'ไม่สามารถบันทึกเอกสารลงฐานข้อมูลได้');
    }
    docData = fallbackRes.data;
  } else {
    docData = data;
  }

  const docId = docData.id;

  // Cache metadata locally as redundancy
  if (meta && (meta.publicUrl || meta.file_url || meta.fileSize)) {
    saveDocMetaFallback(docId, {
      fileUrl: meta.publicUrl || meta.file_url,
      fileSize: meta.fileSize || meta.file_size,
      fileType: meta.fileType || meta.file_type || 'PDF',
    });
  }

  // 2. Insert Chunks and vectors
  const chunks = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < chunksData.length; i += BATCH_SIZE) {
    const batch = chunksData.slice(i, i + BATCH_SIZE);
    try {
      const embeddings = await generateEmbeddings(batch);
      for (let j = 0; j < batch.length; j++) {
        chunks.push({
          document_id: docId,
          content: batch[j],
          embedding: `[${embeddings[j].join(',')}]`,
        });
      }
    } catch (err) {
      console.error('Batch embedding error', err);
      throw new Error('Failed to generate embeddings for document chunks');
    }
  }

  // 3. Insert into Supabase (document_chunks)
  const { error: chunkError } = await supabase
    .from('document_chunks')
    .insert(chunks);

  if (chunkError) {
    await deleteDocument(docId);
    throw chunkError;
  }

  return {
    ...docData,
    file_url: docData.file_url || meta.publicUrl || meta.file_url || null,
    file_size: docData.file_size || meta.fileSize || meta.file_size || null,
    file_type: docData.file_type || meta.fileType || meta.file_type || 'PDF',
  };
}

/**
 * Delete a document, its chunks, and its storage file
 */
export async function deleteDocument(id, fileUrl = null) {
  // 1. Delete storage file if present
  if (fileUrl && fileUrl.includes(`/storage/v1/object/public/${DOC_STORAGE_BUCKET}/`)) {
    try {
      const parts = fileUrl.split(`/storage/v1/object/public/${DOC_STORAGE_BUCKET}/`);
      if (parts[1]) {
        await supabase.storage.from(DOC_STORAGE_BUCKET).remove([parts[1]]);
      }
    } catch (storageErr) {
      console.warn('Storage file cleanup warning:', storageErr);
    }
  }

  // 2. Delete database record (chunks cascade delete)
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) throw error;

  // 3. Clear local cache
  removeDocMetaFallback(id);
}

/**
 * Download a PDF document file or trigger official printable view
 */
export async function downloadKnowledgePdf(doc) {
  if (doc.file_url) {
    // If it's a data URL or blob
    if (doc.file_url.startsWith('data:') || doc.file_url.startsWith('blob:')) {
      const a = document.createElement('a');
      a.href = doc.file_url;
      a.download = doc.filename.toLowerCase().endsWith('.pdf') ? doc.filename : `${doc.filename}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    try {
      const response = await fetch(doc.file_url);
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = doc.filename.toLowerCase().endsWith('.pdf') ? doc.filename : `${doc.filename}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      return;
    } catch (err) {
      console.warn('Blob download fallback, opening file directly:', err);
      const a = document.createElement('a');
      a.href = doc.file_url;
      a.target = '_blank';
      a.download = doc.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
  }

  // If no file_url, fetch chunks and open printable/PDF view
  const chunks = await getDocumentChunks(doc.id);
  printOrSaveKnowledgeAsPdf(doc, chunks);
}

/**
 * Print or Save as PDF for document text chunks
 */
export function printOrSaveKnowledgeAsPdf(doc, chunks = []) {
  const sanitize = (str) =>
    String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const contentHtml = chunks.length > 0
    ? chunks
        .map(
          (c, idx) => `
        <div style="margin-bottom: 20px; padding: 14px 18px; background: #f8fafc; border-left: 4px solid #0284c7; border-radius: 6px; page-break-inside: avoid;">
          <div style="font-weight: 700; font-size: 13px; color: #0284c7; margin-bottom: 6px;">ส่วนที่ ${idx + 1}</div>
          <div style="font-size: 14px; line-height: 1.8; color: #1e293b; white-space: pre-wrap;">${sanitize(c.content)}</div>
        </div>
      `
        )
        .join('')
    : '<div style="padding: 20px; text-align: center; color: #64748b;">ไม่มีข้อมูลเนื้อหาในเอกสารนี้</div>';

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('กรุณาอนุญาตป๊อปอัป (Popup) เพื่อดูตัวอย่างพิมพ์และบันทึก PDF');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="utf-8">
      <title>${sanitize(doc.filename)} - กยศ. มทร.ศรีวิชัย</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 32px;
          color: #0f172a;
          margin: 0 auto;
          max-width: 900px;
          background: #ffffff;
        }
        .header-bar {
          text-align: center;
          border-bottom: 2px solid #0284c7;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .inst-title {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .inst-sub {
          font-size: 13px;
          color: #475569;
        }
        .title-card {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          padding: 18px 20px;
          margin-bottom: 24px;
        }
        .doc-title {
          font-size: 18px;
          font-weight: 700;
          color: #0369a1;
          margin: 0 0 8px 0;
        }
        .doc-meta {
          font-size: 12px;
          color: #64748b;
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }
        .action-bar {
          display: flex;
          gap: 10px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
        }
        .btn {
          padding: 8px 16px;
          font-size: 13px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-primary { background: #0284c7; color: white; }
        .btn-primary:hover { background: #0369a1; }
        .btn-secondary { background: #e2e8f0; color: #1e293b; }
        .footer-note {
          margin-top: 32px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          font-size: 11px;
          color: #94a3b8;
          text-align: center;
        }
        @media print {
          .action-bar { display: none !important; }
          body { padding: 0; }
          .title-card { border: 1px solid #cbd5e1; }
        }
      </style>
    </head>
    <body>
      <div class="action-bar">
        <button class="btn btn-primary" onclick="window.print()">
          🖨️ พิมพ์ / บันทึกเป็น PDF (Save as PDF)
        </button>
        <button class="btn btn-secondary" onclick="window.close()">
          ปิดหน้าต่าง
        </button>
      </div>

      <div class="header-bar">
        <div class="inst-title">มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย (สงขลา)</div>
        <div class="inst-sub">งานแนะแนวและทุนการศึกษา กองพัฒนานักศึกษา | ระบบฐานข้อมูลองค์ความรู้ AI (กยศ.)</div>
      </div>

      <div class="title-card">
        <h1 class="doc-title">${sanitize(doc.filename)}</h1>
        <div class="doc-meta">
          <span>📅 วันที่นำเข้าสู่ระบบ: ${new Date(doc.created_at || Date.now()).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span>📑 จำนวนส่วนข้อมูล AI: ${chunks.length} ส่วน</span>
          <span>🔒 สถานะ: ใช้งานในฐานข้อมูล AI แชทบอท</span>
        </div>
      </div>

      <div>${contentHtml}</div>

      <div class="footer-note">
        * เอกสารนี้จัดทำขึ้นโดยระบบสารสนเทศกองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.) มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย *
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Get chat histories (for admin)
 */
export async function getChatHistories(page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: chatData, error, count } = await supabase
    .from('chat_histories')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  if (!chatData || chatData.length === 0) return { data: [], count: count || 0 };

  // Manually join profiles data since PostgREST cannot infer relationship via auth.users
  const userIds = [...new Set(chatData.map(c => c.user_id).filter(Boolean))];
  if (userIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    if (profilesData) {
      const profileMap = profilesData.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
      chatData.forEach(chat => {
        if (chat.user_id) {
          chat.profiles = profileMap[chat.user_id] || null;
        }
      });
    }
  }

  return { data: chatData, count };
}


