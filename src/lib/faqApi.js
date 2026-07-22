import { supabase } from './supabase';

/**
 * Fetch all FAQs, ordered by usage statistics (most popular first)
 */
export async function getFaqs() {
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .order('usage_count', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get FAQs:', error);
    return [];
  }
  return data;
}

/**
 * Create a new FAQ (Admin only)
 */
export async function createFaq({ question, answer }) {
  const { data, error } = await supabase
    .from('faqs')
    .insert([{ question, answer }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing FAQ (Admin only)
 */
export async function updateFaq(id, { question, answer }) {
  const { data, error } = await supabase
    .from('faqs')
    .update({ question, answer })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete an FAQ (Admin only)
 */
export async function deleteFaq(id) {
  const { error } = await supabase
    .from('faqs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Increment usage_count when a user clicks to view an FAQ
 */
export async function incrementFaqUsage(id) {
  try {
    const { error } = await supabase.rpc('increment_faq_usage', { faq_id: id });
    if (error) {
      console.warn('Could not increment FAQ usage:', error);
    }
  } catch (err) {
    console.error('RPC Error:', err);
  }
}

/**
 * Bulk insert or update FAQs from Array (for Excel import)
 */
export async function bulkCreateOrUpdateFaqs(importedFaqs) {
  // get existing faqs
  const existingFaqs = await getFaqs();
  const existingMap = new Map();
  existingFaqs.forEach(f => {
    existingMap.set(f.question.trim().toLowerCase(), f);
  });

  const toInsert = [];
  let updateCount = 0;
  let insertCount = 0;
  
  for (const item of importedFaqs) {
    const q = item.question?.trim();
    const a = item.answer?.trim();
    if (!q || !a) continue;

    const lowerQ = q.toLowerCase();
    if (existingMap.has(lowerQ)) {
      // update
      const existingId = existingMap.get(lowerQ).id;
      await updateFaq(existingId, { question: q, answer: a });
      updateCount++;
    } else {
      // insert
      toInsert.push({ question: q, answer: a });
      insertCount++;
    }
  }

  // batch insert the new ones
  if (toInsert.length > 0) {
    const { error } = await supabase.from('faqs').insert(toInsert);
    if (error) throw error;
  }
  
  return { insertCount, updateCount };
}
