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
 * Search document chunks using vector similarity
 */
async function searchDocumentChunks(query) {
  try {
    // Enhance short queries with domain context to improve vector similarity matching
    // Words like "คุณสมบัติ" are too generic, so we anchor them to the domain context.
    let searchString = query.trim();
    if (searchString.length < 30 && !searchString.includes('กยศ')) {
       searchString = `${searchString} กยศ. กองทุนเงินให้กู้ยืมเพื่อการศึกษา`;
    }

    // 1. Generate embedding for the search query
    const embeddings = await generateEmbeddings([searchString]);
    if (!embeddings || embeddings.length === 0) return [];

    const queryEmbedding = embeddings[0];

    // 2. Call the RPC function in Supabase
    const { data, error } = await supabase.rpc('match_document_chunks', {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      match_threshold: 0.2, // lowered to catch more potential context matches
      match_count: 15 // top 15 most relevant chunks to provide detailed context
    });

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Vector search error:', error);
    return [];
  }
}

/**
 * Send a message to the Gemini-powered chatbot via server proxy.
 */
export async function sendChatMessage(message, userId) {
  try {
    // Step 1: Search PDF document chunks for relevant context (Semantic Search)
    const chunks = await searchDocumentChunks(message);

    // Map chunks to expected context format for chat.js
    const context = chunks.map(chunk => ({
      topic: 'เอกสารอ้างอิง',
      question: 'ข้อความในเอกสาร',
      answer: chunk.content
    }));

    // Step 2: Call Gemini via server proxy
    let botResponse;
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context, userId }),
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

    // Step 3: Save chat history (anonymous - no user data stored in DB)
    let historyId = null;
    const saved = await saveChatHistory(message, botResponse);
    if (saved) {
      historyId = saved.id;
      // Step 4: Save to Local Storage (per-user key for separation)
      saveChatToLocal(userId, {
        id: saved.id,
        user_message: saved.user_message,
        bot_response: saved.bot_response,
        created_at: saved.created_at,
        rating: null
      });
      // Dispatch event to update Sidebar
      window.dispatchEvent(new Event('chatHistoryUpdated'));
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
    const { error } = await supabase
      .from('chat_histories')
      .update({ rating })
      .eq('id', historyId);
      
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
// LOCAL STORAGE MANAGEMENT (Per-User Separation)
// ==========================================

const LOCAL_STORAGE_BASE = 'rmutsv_chatbot_history';
const LEGACY_STORAGE_BASE = 'kku_chatbot_history';

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
      return JSON.parse(data);
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
  return history.find(chat => chat.id === id) || null;
}

/**
 * Save a chat item to localStorage (per-user key)
 */
export function saveChatToLocal(userId, chatItem) {
  const key = getStorageKey(userId);
  const history = getChatHistory(userId);
  history.unshift(chatItem);
  if (history.length > 30) history.length = 30;
  localStorage.setItem(key, JSON.stringify(history));
}

export function getLocalChatById(id) {
  // Fallback for legacy usage
  return getChatById(id, null);
}

export function updateLocalChatRating(id, rating, userId = null) {
  const key = getStorageKey(userId);
  const history = getChatHistory(userId);
  const chatIndex = history.findIndex(chat => chat.id === id);
  if (chatIndex !== -1) {
    history[chatIndex].rating = rating;
    localStorage.setItem(key, JSON.stringify(history));
  }
}

/**
 * Get all document references (for admin)
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
  return data;
}

/**
 * Upload and process a document (metadata and chunks)
 */
export async function uploadDocument(filename, uploaderId, chunksData) {
  // 1. Insert Document record
  const { data: docData, error: docError } = await supabase
    .from('documents')
    .insert({ filename, uploaded_by: uploaderId })
    .select()
    .single();

  if (docError) throw docError;

  const docId = docData.id;

  // 2. Insert Chunks
  // Because generating embeddings takes time and can limit out, we process in small batches if necessary.
  
  // Actually, chunksData should already contain the vectors, or we generate embeddings here.
  // We assume chunksData is an array of strings.
  
  const chunks = [];
  const BATCH_SIZE = 5; // process 5 chunks per embedding request to avoid sending too large payload
  
  for (let i = 0; i < chunksData.length; i += BATCH_SIZE) {
    const batch = chunksData.slice(i, i + BATCH_SIZE);
    try {
      const embeddings = await generateEmbeddings(batch);
      for (let j = 0; j < batch.length; j++) {
        chunks.push({
          document_id: docId,
          content: batch[j],
          // Store vector array exactly as pgvector expects '[val, val, val]'
          embedding: `[${embeddings[j].join(',')}]` 
        });
      }
    } catch(err) {
      console.error("Batch embedding error", err);
      throw new Error("Failed to generate embeddings for document chunks");
    }
  }

  // 3. Insert into Supabase (document_chunks)
  const { error: chunkError } = await supabase
    .from('document_chunks')
    .insert(chunks);

  if (chunkError) {
    // rollback document creation
    await deleteDocument(docId);
    throw chunkError;
  }

  return docData;
}

/**
 * Delete a document and its chunks (cascade)
 */
export async function deleteDocument(id) {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) throw error;
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


