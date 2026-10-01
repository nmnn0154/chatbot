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

export const REVERSE_CALENDAR_ID_MAP = Object.fromEntries(
  Object.entries(LEGACY_CALENDAR_ID_MAP).map(([k, v]) => [v, k])
);

export const RMUTSV_DEFAULT_EVENTS = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    title: 'เปิดรับคำขอกู้ยืมเงิน กยศ. ในระบบ DSL ภาคเรียนที่ 1/2568',
    description: 'นักศึกษาผู้กู้รายใหม่และรายเก่าย้ายสถานศึกษา เข้ายื่นคำขอกู้ยืมผ่านระบบ DSL หรือแอป กยศ. Connect',
    category: 'เปิดรับสมัคร',
    borrower_type: 'ทั้งหมด',
    academic_year: '2568',
    term: '1',
    start_date: '2026-05-01',
    end_date: '2026-06-30',
    location: 'ระบบออนไลน์ DSL (www.studentloan.or.th)',
    is_published: true,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    title: 'ส่งเอกสารหลักฐานประกอบการขอกู้ยืม ณ กองพัฒนานักศึกษา',
    description: 'ส่งแบบคำขอกู้ยืม หนังสือรับรองรายได้ (กยศ.102) ทะเบียนบ้าน และสำเนาบัตรประชาชน ที่กองพัฒนานักศึกษา อาคาร 7 ชั้น 1',
    category: 'ส่งเอกสาร',
    borrower_type: 'รายใหม่',
    academic_year: '2568',
    term: '1',
    start_date: '2026-07-01',
    end_date: '2026-07-20',
    location: 'กองพัฒนานักศึกษา อาคาร 7 ชั้น 1 มทร.ศรีวิชัย สงขลา',
    is_published: true,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    title: 'สัมภาษณ์คัดกรองคุณสมบัติผู้กู้ยืมเงิน กยศ. รายใหม่',
    description: 'เข้ารับการสัมภาษณ์กับคณะกรรมการพิจารณาเงินกู้ยืมเพื่อการศึกษา มทร.ศรีวิชัย ตามตารางนัดหมายของแต่ละคณะ',
    category: 'สัมภาษณ์',
    borrower_type: 'รายใหม่',
    academic_year: '2568',
    term: '1',
    start_date: '2026-07-21',
    end_date: '2026-07-25',
    location: 'ห้องประชุมกองพัฒนานักศึกษา อาคาร 7 ชั้น 2',
    is_published: true,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    title: 'ประกาศรายชื่อผู้ผ่านการอนุมัติสิทธิ์กู้ยืมเงิน กยศ.',
    description: 'ตรวจสอบผลการอนุมัติสิทธิ์ผ่านระบบ DSL และบอร์ดประชาสัมพันธ์กองพัฒนานักศึกษา',
    category: 'ประกาศผล',
    borrower_type: 'ทั้งหมด',
    academic_year: '2568',
    term: '1',
    start_date: '2026-08-01',
    end_date: '2026-08-01',
    location: 'ระบบ DSL และเว็บไซต์ www.rmutsv.ac.th',
    is_published: true,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000005',
    title: 'จัดทำสัญญากู้ยืมเงินและแบบยืนยันเบิกเงินค่าเล่าเรียน',
    description: 'จัดทำสัญญากู้ยืมเงินในระบบ DSL และพิมพ์แบบยืนยันเบิกเงินค่าเล่าเรียนนำส่งเจ้าหน้าที่',
    category: 'ทำสัญญา',
    borrower_type: 'ทั้งหมด',
    academic_year: '2568',
    term: '1',
    start_date: '2026-08-05',
    end_date: '2026-08-25',
    location: 'จุดบริการกองพัฒนานักศึกษา อาคาร 7 ชั้น 1',
    is_published: true,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000006',
    title: 'กองทุน กยศ. โอนเงินค่าครองชีพงวดที่ 1 เข้าบัญชีนักศึกษา',
    description: 'เงินค่าครองชีพรายเดือน (3,000 บาท/เดือน) โอนเข้าบัญชีธนาคารกรุงไทย/อิสลาม/ธ.ก.ส. ของผู้กู้',
    category: 'เบิกเงิน',
    borrower_type: 'ทั้งหมด',
    academic_year: '2568',
    term: '1',
    start_date: '2026-09-15',
    end_date: '2026-09-15',
    location: 'บัญชีธนาคารของผู้กู้ยืม',
    is_published: true,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000007',
    title: 'ส่งสมุดบันทึกกิจกรรมจิตอาสา กยศ. (36 ชั่วโมง/ปี)',
    description: 'นำส่งสมุดบันทึกชั่วโมงจิตอาสาที่ได้รับการลงนามรับรองครบถ้วน เพื่อใช้ประกอบการกู้ยืมในภาคเรียนถัดไป',
    category: 'จิตอาสา',
    borrower_type: 'ทั้งหมด',
    academic_year: '2568',
    term: '1',
    start_date: '2026-10-01',
    end_date: '2026-11-30',
    location: 'กองพัฒนานักศึกษา อาคาร 7 ชั้น 1',
    is_published: true,
  },
];

const CALENDAR_STORAGE_KEY = 'rmutsv_calendar_events_cache';
const CALENDAR_DELETED_IDS_KEY = 'rmutsv_calendar_events_deleted_ids';
const CALENDAR_SEEDED_KEY = 'rmutsv_calendar_events_seeded_v2';

export function getDeletedCalendarIds() {
  try {
    const raw = localStorage.getItem(CALENDAR_DELETED_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markDeletedCalendarId(id) {
  if (!id) return;
  try {
    const list = getDeletedCalendarIds();
    const actualId = LEGACY_CALENDAR_ID_MAP[id] || id;
    const legacyId = REVERSE_CALENDAR_ID_MAP[id] || null;
    let changed = false;

    for (const item of [id, actualId, legacyId]) {
      if (item && !list.includes(item)) {
        list.push(item);
        changed = true;
      }
    }

    if (changed) {
      localStorage.setItem(CALENDAR_DELETED_IDS_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Failed to mark deleted calendar id:', e);
  }
}

export function filterOutDeletedCalendar(events) {
  if (!Array.isArray(events)) return [];
  const deleted = getDeletedCalendarIds();
  if (deleted.length === 0) return events;
  return events.filter(
    (ev) =>
      !deleted.includes(ev.id) &&
      !deleted.includes(LEGACY_CALENDAR_ID_MAP[ev.id]) &&
      !deleted.includes(REVERSE_CALENDAR_ID_MAP[ev.id])
  );
}

function getCachedCalendarEvents() {
  try {
    const raw = localStorage.getItem(CALENDAR_STORAGE_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    let modified = false;
    const migrated = parsed.map((ev) => {
      if (LEGACY_CALENDAR_ID_MAP[ev.id]) {
        modified = true;
        return { ...ev, id: LEGACY_CALENDAR_ID_MAP[ev.id] };
      }
      if (!isUuid(ev.id)) {
        modified = true;
        return { ...ev, id: generateUuid() };
      }
      return ev;
    });

    const filtered = filterOutDeletedCalendar(migrated);
    if (modified || filtered.length !== parsed.length) {
      localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return null;
  }
}

function setCachedCalendarEvents(events) {
  try {
    const clean = filterOutDeletedCalendar(events);
    localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(clean));
  } catch (e) {
    console.warn('Failed to cache calendar events:', e);
  }
}

/** Published events, upcoming first (for user-facing calendar page). */
export async function getPublishedEvents() {
  const all = await getAllEvents();
  return all.filter((e) => e.is_published !== false);
}

/** All events (admin). */
export async function getAllEvents() {
  const cached = getCachedCalendarEvents();
  const isSeeded = localStorage.getItem(CALENDAR_SEEDED_KEY);

  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('start_date', { ascending: true });

    if (!error && Array.isArray(data)) {
      if (data.length === 0 && !isSeeded && (!cached || cached.length === 0)) {
        // Initial auto-seed default items
        localStorage.setItem(CALENDAR_SEEDED_KEY, 'true');
        const toSeed = filterOutDeletedCalendar(RMUTSV_DEFAULT_EVENTS);
        try {
          await supabase.from('calendar_events').insert(toSeed);
        } catch (e) {
          console.warn('Auto-seed calendar events to Supabase skipped:', e);
        }
        setCachedCalendarEvents(toSeed);
        return toSeed;
      }

      // Filter out deleted from remote data
      const cleanRemote = filterOutDeletedCalendar(data);

      // Merge with locally created/modified items so they are not wiped out
      if (cached && cached.length > 0) {
        const remoteIds = new Set(cleanRemote.map((r) => r.id));
        const localOnly = cached.filter((c) => !remoteIds.has(c.id));
        const merged = [...cleanRemote, ...localOnly];
        setCachedCalendarEvents(merged);
        localStorage.setItem(CALENDAR_SEEDED_KEY, 'true');
        return merged;
      }

      setCachedCalendarEvents(cleanRemote);
      localStorage.setItem(CALENDAR_SEEDED_KEY, 'true');
      return cleanRemote;
    }
  } catch (error) {
    console.warn('Using cached calendar events:', error);
  }

  // Fallback to local cache if present
  if (cached !== null) {
    return filterOutDeletedCalendar(cached);
  }

  // First time initialization
  if (!isSeeded) {
    localStorage.setItem(CALENDAR_SEEDED_KEY, 'true');
    const defaults = filterOutDeletedCalendar(RMUTSV_DEFAULT_EVENTS);
    setCachedCalendarEvents(defaults);
    return defaults;
  }

  return [];
}

export async function createEvent(payload) {
  const newEvent = {
    id: generateUuid(),
    ...payload,
    is_published: payload.is_published !== false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert([newEvent])
      .select()
      .single();

    if (!error && data) {
      const current = getCachedCalendarEvents() || [];
      setCachedCalendarEvents([data, ...current]);
      return data;
    }
  } catch (err) {
    console.warn('Supabase createEvent failed, saving to local cache:', err);
  }

  // Local fallback
  const current = getCachedCalendarEvents() || [];
  setCachedCalendarEvents([newEvent, ...current]);
  return newEvent;
}

export async function updateEvent(id, payload) {
  const actualId = LEGACY_CALENDAR_ID_MAP[id] || id;
  const updateData = { ...payload, updated_at: new Date().toISOString() };

  if (isUuid(actualId)) {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', actualId)
        .select()
        .single();

      if (!error && data) {
        const current = getCachedCalendarEvents() || [];
        setCachedCalendarEvents(
          current.map((e) => (e.id === id || e.id === actualId ? data : e))
        );
        return data;
      }
    } catch (err) {
      console.warn('Supabase updateEvent failed, updating local cache:', err);
    }
  }

  const current = getCachedCalendarEvents() || [];
  const updatedList = current.map((e) =>
    e.id === id || e.id === actualId ? { ...e, ...updateData, id: actualId } : e
  );
  setCachedCalendarEvents(updatedList);
  return { id: actualId, ...updateData };
}

export async function deleteEvent(id) {
  const actualId = LEGACY_CALENDAR_ID_MAP[id] || id;

  // 1. Mark permanently in deleted list
  markDeletedCalendarId(id);
  markDeletedCalendarId(actualId);
  localStorage.setItem(CALENDAR_SEEDED_KEY, 'true');

  // 2. Remove from local cache immediately
  const cached = getCachedCalendarEvents();
  const current = cached !== null ? cached : filterOutDeletedCalendar(RMUTSV_DEFAULT_EVENTS);
  const remaining = current.filter((ev) => ev.id !== id && ev.id !== actualId);
  setCachedCalendarEvents(remaining);

  // 3. Try deleting from Supabase
  try {
    if (isUuid(actualId)) {
      const { error } = await supabase.from('calendar_events').delete().eq('id', actualId);
      if (error && error.code !== '22P02') {
        console.warn('Supabase calendar delete error:', error);
      }
    }
  } catch (e) {
    console.warn('Supabase deleteEvent failed (continuing with local deletion):', e);
  }

  return true;
}
