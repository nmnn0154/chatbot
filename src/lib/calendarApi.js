import { supabase } from './supabase';

export const EVENT_CATEGORIES = [
  'เปิดรับสมัคร',
  'ส่งเอกสาร',
  'สัมภาษณ์',
  'ประกาศผล',
  'ทำสัญญา',
  'เบิกเงิน',
  'จิตอาสา',
  'ทั่วไป',
];

export const BORROWER_TYPES = ['ทั้งหมด', 'รายเก่า', 'รายใหม่'];

/** Published events, upcoming first (for the user-facing calendar page). */
export async function getPublishedEvents() {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('is_published', true)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Failed to fetch calendar events:', error);
    return [];
  }
  return data || [];
}

/** All events (admin). */
export async function getAllEvents() {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .order('start_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createEvent(payload) {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEvent(id, payload) {
  const { data, error } = await supabase
    .from('calendar_events')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEvent(id) {
  const { error } = await supabase.from('calendar_events').delete().eq('id', id);
  if (error) throw error;
}
