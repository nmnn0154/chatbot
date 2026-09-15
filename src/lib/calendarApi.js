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

export const RMUTSV_DEFAULT_EVENTS = [
  {
    id: 'cal_rmutsv_1',
    title: 'เปิดรับคำขอกู้ยืมเงิน กยศ. ในระบบ DSL ภาคเรียนที่ 1/2568',
    description: 'นักศึกษาผู้กู้รายใหม่และรายเก่าย้ายสถานศึกษา เข้ายื่นคำขอกู้ยืมผ่านระบบ DSL หรือแอป กยศ. Connect',
    category: 'เปิดรับสมัคร',
    borrower_type: 'ทั้งหมด',
    start_date: '2026-05-01',
    end_date: '2026-06-30',
    location: 'ระบบออนไลน์ DSL (www.studentloan.or.th)',
    is_published: true,
  },
  {
    id: 'cal_rmutsv_2',
    title: 'ส่งเอกสารหลักฐานประกอบการขอกู้ยืม ณ กองพัฒนานักศึกษา',
    description: 'ส่งแบบคำขอกู้ยืม หนังสือรับรองรายได้ (กยศ.102) ทะเบียนบ้าน และสำเนาบัตรประชาชน ที่กองพัฒนานักศึกษา อาคาร 7 ชั้น 1',
    category: 'ส่งเอกสาร',
    borrower_type: 'รายใหม่',
    start_date: '2026-07-01',
    end_date: '2026-07-20',
    location: 'กองพัฒนานักศึกษา อาคาร 7 ชั้น 1 มทร.ศรีวิชัย สงขลา',
    is_published: true,
  },
  {
    id: 'cal_rmutsv_3',
    title: 'สัมภาษณ์คัดกรองคุณสมบัติผู้กู้ยืมเงิน กยศ. รายใหม่',
    description: 'เข้ารับการสัมภาษณ์กับคณะกรรมการพิจารณาเงินกู้ยืมเพื่อการศึกษา มทร.ศรีวิชัย ตามตารางนัดหมายของแต่ละคณะ',
    category: 'สัมภาษณ์',
    borrower_type: 'รายใหม่',
    start_date: '2026-07-21',
    end_date: '2026-07-25',
    location: 'ห้องประชุมกองพัฒนานักศึกษา อาคาร 7 ชั้น 2',
    is_published: true,
  },
  {
    id: 'cal_rmutsv_4',
    title: 'ประกาศรายชื่อผู้ผ่านการอนุมัติสิทธิ์กู้ยืมเงิน กยศ.',
    description: 'ตรวจสอบผลการอนุมัติสิทธิ์ผ่านระบบ DSL และบอร์ดประชาสัมพันธ์กองพัฒนานักศึกษา',
    category: 'ประกาศผล',
    borrower_type: 'ทั้งหมด',
    start_date: '2026-08-01',
    end_date: '2026-08-01',
    location: 'ระบบ DSL และเว็บไซต์ www.rmutsv.ac.th',
    is_published: true,
  },
  {
    id: 'cal_rmutsv_5',
    title: 'จัดทำสัญญากู้ยืมเงินและแบบยืนยันเบิกเงินค่าเล่าเรียน',
    description: 'จัดทำสัญญากู้ยืมเงินในระบบ DSL และพิมพ์แบบยืนยันเบิกเงินค่าเล่าเรียนนำส่งเจ้าหน้าที่',
    category: 'ทำสัญญา',
    borrower_type: 'ทั้งหมด',
    start_date: '2026-08-05',
    end_date: '2026-08-25',
    location: 'จุดบริการกองพัฒนานักศึกษา อาคาร 7 ชั้น 1',
    is_published: true,
  },
  {
    id: 'cal_rmutsv_6',
    title: 'กองทุน กยศ. โอนเงินค่าครองชีพงวดที่ 1 เข้าบัญชีนักศึกษา',
    description: 'เงินค่าครองชีพรายเดือน (3,000 บาท/เดือน) โอนเข้าบัญชีธนาคารกรุงไทย/อิสลาม/ธ.ก.ส. ของผู้กู้',
    category: 'เบิกเงิน',
    borrower_type: 'ทั้งหมด',
    start_date: '2026-09-15',
    end_date: '2026-09-15',
    location: 'บัญชีธนาคารของผู้กู้ยืม',
    is_published: true,
  },
  {
    id: 'cal_rmutsv_7',
    title: 'ส่งสมุดบันทึกกิจกรรมจิตอาสา กยศ. (36 ชั่วโมง/ปี)',
    description: 'นำส่งสมุดบันทึกชั่วโมงจิตอาสาที่ได้รับการลงนามรับรองครบถ้วน เพื่อใช้ประกอบการกู้ยืมในภาคเรียนถัดไป',
    category: 'จิตอาสา',
    borrower_type: 'ทั้งหมด',
    start_date: '2026-10-01',
    end_date: '2026-11-30',
    location: 'กองพัฒนานักศึกษา อาคาร 7 ชั้น 1',
    is_published: true,
  },
];

/** Published events, upcoming first (for the user-facing calendar page). */
export async function getPublishedEvents() {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('is_published', true)
      .order('start_date', { ascending: true });

    if (error || !data || data.length === 0) {
      return RMUTSV_DEFAULT_EVENTS;
    }
    return data;
  } catch (error) {
    console.warn('Using fallback RMUTSV calendar events:', error);
    return RMUTSV_DEFAULT_EVENTS;
  }
}

/** All events (admin). */
export async function getAllEvents() {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('start_date', { ascending: true });

    if (error || !data || data.length === 0) {
      return RMUTSV_DEFAULT_EVENTS;
    }
    return data;
  } catch (error) {
    console.warn('Using fallback RMUTSV all calendar events:', error);
    return RMUTSV_DEFAULT_EVENTS;
  }
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
