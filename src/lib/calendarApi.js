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

export function isUuid(str) {
  if (typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export const LEGACY_CALENDAR_ID_MAP = {
  'cal_rmutsv_1': 'c0000000-0000-0000-0000-000000000001',
  'cal_rmutsv_2': 'c0000000-0000-0000-0000-000000000002',
  'cal_rmutsv_3': 'c0000000-0000-0000-0000-000000000003',
  'cal_rmutsv_4': 'c0000000-0000-0000-0000-000000000004',
  'cal_rmutsv_5': 'c0000000-0000-0000-0000-000000000005',
  'cal_rmutsv_6': 'c0000000-0000-0000-0000-000000000006',
  'cal_rmutsv_7': 'c0000000-0000-0000-0000-000000000007',
};

/** Published events, upcoming first (for user-facing calendar page). */
export async function getPublishedEvents() {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('is_published', true)
      .order('start_date', { ascending: true });

    if (!error && Array.isArray(data)) {
      return data;
    }
    if (error) {
      console.warn('Error fetching published calendar events from Supabase:', error);
    }
  } catch (error) {
    console.warn('Supabase getPublishedEvents error:', error);
  }

  return [];
}

/** All events (admin). */
export async function getAllEvents() {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('start_date', { ascending: true });

    if (!error && Array.isArray(data)) {
      return data;
    }
    if (error) {
      console.warn('Error fetching all calendar events from Supabase:', error);
    }
  } catch (error) {
    console.warn('Supabase getAllEvents error:', error);
  }

  return [];
}

export async function createEvent(payload) {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Failed to create calendar event:', error);
    throw error;
  }
  return data;
}

export async function updateEvent(id, payload) {
  const actualId = LEGACY_CALENDAR_ID_MAP[id] || id;

  const { data, error } = await supabase
    .from('calendar_events')
    .update(payload)
    .eq('id', actualId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update calendar event:', error);
    throw error;
  }
  return data;
}

export async function deleteEvent(id) {
  const actualId = LEGACY_CALENDAR_ID_MAP[id] || id;

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', actualId);

  if (error) {
    console.error('Failed to delete calendar event from Supabase:', error);
    throw error;
  }
  return true;
}
