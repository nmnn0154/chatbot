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

export function generateUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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

export const RMUTSV_DEFAULT_CALENDAR_EVENTS = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    title: 'เปิดระบบยื่นคำขอกู้ยืมเงิน ภาคเรียนที่ 1 (รายเก่าเลื่อนชั้นปี)',
    description: 'ผู้กู้ยืมรายเก่า มทร.ศรีวิชัย ยื่นแบบคำขอกู้ยืมเงินผ่านระบบ DSL หรือแอป กยศ. Connect โดยไม่ต้องผ่านระบบ Pre-Approve',
    category: 'เปิดรับสมัคร',
    academic_year: '2568',
    term: '1',
    borrower_type: 'รายเก่า',
    start_date: '2025-05-01',
    end_date: '2025-06-30',
    is_published: true,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    title: 'เปิดระบบลงทะเบียนยื่นความประสงค์ขอกู้ยืม Pre-Approve (รายใหม่/ย้ายสถานศึกษา)',
    description: 'ผู้กู้ยืมรายใหม่และรายเก่าย้ายสถานศึกษา ยื่นความประสงค์ Pre-Approve ผ่านระบบ DSL เพื่อตรวจสอบสิทธิ์เบื้องต้น',
    category: 'เปิดรับสมัคร',
    academic_year: '2568',
    term: '1',
    borrower_type: 'รายใหม่',
    start_date: '2025-05-15',
    end_date: '2025-07-15',
    is_published: true,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    title: 'กำหนดการส่งสมุดบันทึกกิจกรรมจิตอาสา 36 ชั่วโมง (ผู้กู้รายเก่า)',
    description: 'ผู้กู้ยืมรายเก่าส่งสมุดจิตอาสาที่ให้อาจารย์ที่ปรึกษาลงนามรับรองแล้ว ณ กองพัฒนานักศึกษา อาคาร 7 ชั้น 1',
    category: 'จิตอาสา',
    academic_year: '2568',
    term: '1',
    borrower_type: 'รายเก่า',
    start_date: '2025-06-01',
    end_date: '2025-07-15',
    is_published: true,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    title: 'ส่งเอกสารแบบคำขอกู้ยืม (กยศ.101) และหลักฐานรายได้ครอบครัว',
    description: 'นำส่งเอกสารตัวจริงพร้อมหลักฐานประกอบให้เจ้าหน้าที่กองพัฒนานักศึกษาหรือฝ่ายกิจการนักศึกษาคณะตรวจสอบ',
    category: 'ส่งเอกสาร',
    academic_year: '2568',
    term: '1',
    borrower_type: 'รายใหม่',
    start_date: '2025-06-15',
    end_date: '2025-07-31',
    is_published: true,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000005',
    title: 'ประกาศรายชื่อผู้ผ่านการคัดเลือกและมีสิทธิ์ทำสัญญา ภาคเรียนที่ 1',
    description: 'ตรวจสอบรายชื่อผู้ผ่านการอนุมัติผ่านระบบ DSL และเว็บไซต์กองพัฒนานักศึกษา https://dsd.rmutsv.ac.th/ruts/',
    category: 'ทั่วไป',
    academic_year: '2568',
    term: '1',
    borrower_type: 'ทั้งหมด',
    start_date: '2025-08-01',
    end_date: '2025-08-10',
    is_published: true,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000006',
    title: 'จัดทำสัญญากู้ยืมเงินและแบบยืนยันการเบิกเงินกู้ยืม ภาคเรียนที่ 1',
    description: 'จัดทำสัญญากู้ยืมและแบบยืนยันเบิกเงินในระบบ DSL พร้อมลงนามร่วมกับผู้แทนโดยชอบธรรมและพยาน 2 คน',
    category: 'ทำสัญญา',
    academic_year: '2568',
    term: '1',
    borrower_type: 'รายใหม่',
    start_date: '2025-08-11',
    end_date: '2025-08-31',
    is_published: true,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000007',
    title: 'ลงนามแบบยืนยันการเบิกเงินกู้ยืม ภาคเรียนที่ 1 (รายเก่าเลื่อนชั้นปี)',
    description: 'หลังลงทะเบียนเรียนเรียบร้อยแล้ว ให้เข้าไประบุยอดเงินในระบบ DSL และพิมพ์แบบยืนยัน 2 ชุด ส่งสถานศึกษา 1 ชุด',
    category: 'เบิกเงิน',
    academic_year: '2568',
    term: '1',
    borrower_type: 'รายเก่า',
    start_date: '2025-08-01',
    end_date: '2025-08-31',
    is_published: true,
  },
];

const CALENDAR_STORAGE_KEY = 'rmutsv_calendar_events';
const CALENDAR_DELETED_KEY = 'rmutsv_deleted_calendar_ids';

function getDeletedIds() {
  try {
    const raw = localStorage.getItem(CALENDAR_DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function markDeletedId(id) {
  try {
    const list = getDeletedIds();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(CALENDAR_DELETED_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Failed to mark deleted id:', e);
  }
}

function filterOutDeleted(list) {
  if (!Array.isArray(list)) return [];
  const deleted = getDeletedIds();
  if (deleted.length === 0) return list;
  return list.filter((item) => !deleted.includes(item.id));
}

function getCachedEvents() {
  try {
    const raw = localStorage.getItem(CALENDAR_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? filterOutDeleted(parsed) : null;
  } catch {
    return null;
  }
}

function setCachedEvents(events) {
  try {
    const clean = filterOutDeleted(events);
    localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(clean));
  } catch (e) {
    console.warn('Failed to cache calendar events:', e);
  }
}

/** Published events, upcoming first (for user-facing calendar page). */
export async function getPublishedEvents() {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('is_published', true)
      .order('start_date', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      setCachedEvents(data);
      return data;
    }
    if (error) {
      console.warn('Error fetching published calendar events from Supabase:', error);
    }
  } catch (error) {
    console.warn('Supabase getPublishedEvents error:', error);
  }

  // Fallback to local cache or defaults
  const cached = getCachedEvents();
  if (cached && cached.length > 0) {
    return cached.filter((e) => e.is_published);
  }
  return RMUTSV_DEFAULT_CALENDAR_EVENTS.filter((e) => e.is_published);
}

/** All events (admin). */
export async function getAllEvents() {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('start_date', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      setCachedEvents(data);
      return data;
    }
    if (error) {
      console.warn('Error fetching all calendar events from Supabase:', error);
    }
  } catch (error) {
    console.warn('Supabase getAllEvents error:', error);
  }

  // Fallback to local cache or defaults
  const cached = getCachedEvents();
  if (cached && cached.length > 0) {
    return cached;
  }
  return RMUTSV_DEFAULT_CALENDAR_EVENTS;
}

export async function createEvent(payload) {
  const newEvent = {
    ...payload,
    id: generateUuid(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert([payload])
      .select()
      .single();

    if (!error && data) {
      const current = getCachedEvents() || RMUTSV_DEFAULT_CALENDAR_EVENTS;
      setCachedEvents([data, ...current.filter((e) => e.id !== data.id)]);
      return data;
    }
    if (error) {
      console.warn('Supabase createEvent failed (RLS/Auth), saving to local storage:', error.message || error);
    }
  } catch (error) {
    console.warn('Supabase createEvent network error, saving to local storage:', error);
  }

  // Local fallback (ensures localhost dev works without RLS crash)
  const current = getCachedEvents() || RMUTSV_DEFAULT_CALENDAR_EVENTS;
  setCachedEvents([newEvent, ...current]);
  return newEvent;
}

export async function updateEvent(id, payload) {
  const actualId = LEGACY_CALENDAR_ID_MAP[id] || id;

  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .update(payload)
      .eq('id', actualId)
      .select()
      .single();

    if (!error && data) {
      const current = getCachedEvents() || RMUTSV_DEFAULT_CALENDAR_EVENTS;
      setCachedEvents(current.map((e) => (e.id === actualId ? data : e)));
      return data;
    }
    if (error) {
      console.warn('Supabase updateEvent failed (RLS/Auth), updating locally:', error.message || error);
    }
  } catch (error) {
    console.warn('Supabase updateEvent network error, updating locally:', error);
  }

  // Local fallback
  const current = getCachedEvents() || RMUTSV_DEFAULT_CALENDAR_EVENTS;
  const updated = current.map((e) => (e.id === actualId ? { ...e, ...payload } : e));
  setCachedEvents(updated);
  return { id: actualId, ...payload };
}

export async function deleteEvent(id) {
  const actualId = LEGACY_CALENDAR_ID_MAP[id] || id;
  markDeletedId(actualId);

  try {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', actualId);

    if (error) {
      console.warn('Supabase deleteEvent warning (RLS/Auth), removing locally:', error.message || error);
    }
  } catch (error) {
    console.warn('Supabase deleteEvent network error, removing locally:', error);
  }

  // Local fallback
  const current = getCachedEvents() || RMUTSV_DEFAULT_CALENDAR_EVENTS;
  setCachedEvents(current.filter((e) => e.id !== actualId));
  return true;
}
