import { supabase } from './supabase';

const BUCKET = 'news-images';

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

export const LEGACY_NEWS_ID_MAP = {
  'news_rmutsv_1': 'b0000000-0000-0000-0000-000000000001',
  'news_rmutsv_2': 'b0000000-0000-0000-0000-000000000002',
  'news_rmutsv_3': 'b0000000-0000-0000-0000-000000000003',
  'news_rmutsv_4': 'b0000000-0000-0000-0000-000000000004',
};

export const REVERSE_NEWS_ID_MAP = Object.fromEntries(
  Object.entries(LEGACY_NEWS_ID_MAP).map(([k, v]) => [v, k])
);

export const RMUTSV_DEFAULT_NEWS = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    title: 'ประกาศกำหนดการยื่นกู้ยืมเงิน กยศ. ภาคเรียนที่ 1/2568 มทร.ศรีวิชัย สงขลา',
    content: `กองพัฒนานักศึกษา มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย ประกาศกำหนดการดำเนินงานกองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.) ประจำภาคเรียนที่ 1 ปีการศึกษา 2568:

📌 **สำหรับผู้กู้ยืมรายใหม่ / รายเก่าย้ายสถานศึกษา:**
- ยื่นคำขอกู้ยืมในระบบ DSL: 1 เมษายน - 30 มิถุนายน 2568
- ส่งเอกสารหลักฐาน ณ กองพัฒนานักศึกษา อาคาร 7 ชั้น 1: 1 - 20 กรกฎาคม 2568
- สัมภาษณ์คัดกรองคุณสมบัติ: 21 - 25 กรกฎาคม 2568
- ประกาศผลการอนุมัติสิทธิ์: 1 สิงหาคม 2568

📌 **สำหรับผู้กู้ยืมรายเก่าเลื่อนชั้นปี มทร.ศรีวิชัย:**
- บันทึกคำขอกู้ยืมและยืนยันหลักสูตรในระบบ DSL: 1 พฤษภาคม - 15 กรกฎาคม 2568
- จัดทำแบบยืนยันการเบิกเงินค่าเล่าเรียน: ตามช่วงเวลาลงทะเบียนเรียนของมหาวิทยาลัย

⚠️ ให้นักศึกษาติดตามประกาศและส่งเอกสารให้ตรงตามกำหนดเวลาเพื่อรักษาสิทธิ์ของตนเอง`,
    is_published: true,
    image_url: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    title: 'โครงการบริจาคโลหิต ร่วมใจทำความดี นับชั่วโมงจิตอาสา กยศ. 6 ชั่วโมง',
    content: `งานแนะแนวและทุนการศึกษา กองพัฒนานักศึกษา มทร.ศรีวิชัย ร่วมกับ ภาคบริการโลหิตแห่งชาติที่ 12 จังหวัดสงขลา ขอเชิญชวนนักศึกษาและบุคลากร ร่วมบริจาคโลหิตเพื่อช่วยเหลือผู้ป่วย

🩸 **รายละเอียดกิจกรรม:**
- **วัน/เวลา:** วันพุธที่ 18 มิถุนายน 2568 เวลา 09.00 - 14.30 น.
- **สถานที่:** โถงชั้น 1 อาคารอเนกประสงค์ มทร.ศรีวิชัย (สงขลา)
- **สิทธิประโยชน์:** นักศึกษาผู้กู้ กยศ. สามารถนำใบรับรองการบริจาคโลหิตมาบันทึกเป็นชั่วโมงจิตอาสาได้ **6 ชั่วโมง / ครั้ง**

📝 กรุณานำบัตรประชาชนและสมุดบันทึกกิจกรรมจิตอาสามาด้วยในวันจัดกิจกรรม`,
    is_published: true,
    image_url: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    title: 'แจ้งเตือนการลงนามในแบบยืนยันการเบิกเงินกู้ยืม กยศ. ค่าเล่าเรียนและค่าครองชีพ',
    content: `แจ้งนักศึกษาผู้กู้ยืมเงิน กยศ. ทุกคณะ ทุกชั้นปี มทร.ศรีวิชัย:

ขณะนี้ระบบ DSL ได้เปิดให้บันทึก **แบบยืนยันการเบิกเงินกู้ยืม (ค่าเล่าเรียนและค่าครองชีพ)** แล้ว
1. ให้นักศึกษาเข้าระบบ DSL หรือแอป กยศ. Connect เพื่อตรวจสอบยอดเงินค่าเล่าเรียนตรงตามใบเสร็จลงทะเบียน
2. กดยืนยันเบิกเงินค่าเล่าเรียน และเลือกรับเงินค่าครองชีพรายเดือน (3,000 บาท/เดือน)
3. พิมพ์แบบยืนยันจำนวน 2 ฉบับ พร้อมลงลายมือชื่อด้วยปากกาสีน้ำเงิน
4. ส่งเอกสารที่จุดบริการกองพัฒนานักศึกษา อาคาร 7 ชั้น 1 ภายในวันที่กำหนด

*หากพ้นกำหนดเวลา กองทุนจะไม่สามารถโอนเงินค่าครองชีพและค่าเล่าเรียนให้แก่นักศึกษาได้*`,
    is_published: true,
    image_url: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000004',
    title: 'ประชาสัมพันธ์: กฎหมาย กยศ. ปรับปรุงใหม่ ลดเบี้ยปรับเหลือ 0.5% ต่อปี และยกเลิกผู้ค้ำประกัน',
    content: `กองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.) ร่วมกับ มทร.ศรีวิชัย ขอประชาสัมพันธ์สาระสำคัญของ พ.ร.บ. กองทุนเงินให้กู้ยืมเพื่อการศึกษา ฉบับปรับปรุงใหม่:

✨ **สิทธิประโยชน์และเงื่อนไขใหม่:**
1. **ลดเบี้ยปรับผิดนัดชำระหนี้:** จากเดิมร้อยละ 7.5 ต่อปี เหลือเพียง **ร้อยละ 0.5 ต่อปี**
2. **ยกเลิกผู้ค้ำประกัน:** สำหรับผู้กู้ยืมรายใหม่ทุกราย ไม่ต้องใช้บุคคลค้ำประกัน
3. **ปรับลำดับการตัดชำระหนี้:** ตัดเงินต้นก่อน > ดอกเบี้ย > เบี้ยปรับ
4. **โครงการปรับโครงสร้างหนี้:** เปิดให้ผู้กู้ที่ค้างชำระสามารถขยายเวลาผ่อนชำระได้นานสูงสุดถึงอายุ 65 ปี และปลดภาระผู้ค้ำประกันทันที

นักศึกษาสามารถศึกษารายละเอียดเพิ่มเติมได้ที่เมนู "องค์ความรู้ กยศ." บนเว็บไซต์ หรือสอบถามได้ที่กองพัฒนานักศึกษา`,
    is_published: true,
    image_url: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
];

const NEWS_STORAGE_KEY = 'rmutsv_announcements_cache';
const NEWS_DELETED_IDS_KEY = 'rmutsv_announcements_deleted_ids';
const NEWS_SEEDED_KEY = 'rmutsv_announcements_seeded_v2';

export function getDeletedNewsIds() {
  try {
    const raw = localStorage.getItem(NEWS_DELETED_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markDeletedNewsId(id) {
  if (!id) return;
  try {
    const list = getDeletedNewsIds();
    const actualId = LEGACY_NEWS_ID_MAP[id] || id;
    const legacyId = REVERSE_NEWS_ID_MAP[id] || null;
    let changed = false;

    for (const item of [id, actualId, legacyId]) {
      if (item && !list.includes(item)) {
        list.push(item);
        changed = true;
      }
    }

    if (changed) {
      localStorage.setItem(NEWS_DELETED_IDS_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Failed to mark deleted news id:', e);
  }
}

export function filterOutDeletedNews(newsList) {
  if (!Array.isArray(newsList)) return [];
  const deleted = getDeletedNewsIds();
  if (deleted.length === 0) return newsList;
  return newsList.filter(
    (item) =>
      !deleted.includes(item.id) &&
      !deleted.includes(LEGACY_NEWS_ID_MAP[item.id]) &&
      !deleted.includes(REVERSE_NEWS_ID_MAP[item.id])
  );
}

function getCachedNews() {
  try {
    const raw = localStorage.getItem(NEWS_STORAGE_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    let modified = false;
    const migrated = parsed.map((item) => {
      if (LEGACY_NEWS_ID_MAP[item.id]) {
        modified = true;
        return { ...item, id: LEGACY_NEWS_ID_MAP[item.id] };
      }
      if (!isUuid(item.id)) {
        modified = true;
        return { ...item, id: generateUuid() };
      }
      return item;
    });

    const filtered = filterOutDeletedNews(migrated);
    if (modified || filtered.length !== parsed.length) {
      localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return null;
  }
}

function setCachedNews(newsList) {
  try {
    const clean = filterOutDeletedNews(newsList);
    localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(clean));
  } catch (e) {
    console.warn('Failed to cache news:', e);
  }
}

/**
 * Upload an image to Supabase Storage and return its public URL.
 */
export async function uploadNewsImage(file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
  } catch (error) {
    console.warn('Failed to upload image to Supabase storage, using data URL fallback:', error);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Delete an image from Supabase Storage by its public URL.
 */
export async function deleteNewsImage(publicUrl) {
  try {
    if (!publicUrl || typeof publicUrl !== 'string') return;
    const parts = publicUrl.split(`/storage/v1/object/public/${BUCKET}/`);
    if (parts.length < 2) return;
    const { error } = await supabase.storage.from(BUCKET).remove([parts[1]]);
    if (error) throw error;
  } catch (error) {
    console.warn('Failed to delete image from storage:', error);
  }
}

/**
 * Fetch all published news (for users)
 */
export async function getPublishedNews() {
  const all = await getAllNews();
  return all.filter((n) => n.is_published !== false);
}

/**
 * Fetch all news (for admins)
 */
export async function getAllNews() {
  const cached = getCachedNews();
  const isSeeded = localStorage.getItem(NEWS_SEEDED_KEY);

  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      if (data.length === 0 && !isSeeded && (!cached || cached.length === 0)) {
        // Initial auto-seed default items
        localStorage.setItem(NEWS_SEEDED_KEY, 'true');
        const toSeed = filterOutDeletedNews(RMUTSV_DEFAULT_NEWS);
        try {
          await supabase.from('announcements').insert(toSeed);
        } catch (e) {
          console.warn('Auto-seed news to Supabase skipped:', e);
        }
        setCachedNews(toSeed);
        return toSeed;
      }

      // Filter out deleted from remote data
      const cleanRemote = filterOutDeletedNews(data);

      // Merge with locally created/modified items so they are not wiped out
      if (cached && cached.length > 0) {
        const remoteIds = new Set(cleanRemote.map((r) => r.id));
        const localOnly = cached.filter((c) => !remoteIds.has(c.id));
        const merged = [...cleanRemote, ...localOnly];
        setCachedNews(merged);
        localStorage.setItem(NEWS_SEEDED_KEY, 'true');
        return merged;
      }

      setCachedNews(cleanRemote);
      localStorage.setItem(NEWS_SEEDED_KEY, 'true');
      return cleanRemote;
    }
  } catch (error) {
    console.warn('Using cached RMUTSV news:', error);
  }

  // Fallback to local cache if present
  if (cached !== null) {
    return filterOutDeletedNews(cached);
  }

  // First time initialization
  if (!isSeeded) {
    localStorage.setItem(NEWS_SEEDED_KEY, 'true');
    const defaults = filterOutDeletedNews(RMUTSV_DEFAULT_NEWS);
    setCachedNews(defaults);
    return defaults;
  }

  return [];
}

/**
 * Create a new announcement (with optional image)
 */
export async function createNews(title, content, isPublished = true, imageFile = null) {
  let image_url = null;
  if (imageFile) image_url = await uploadNewsImage(imageFile);

  const newNews = {
    id: generateUuid(),
    title: title.trim(),
    content: content.trim(),
    is_published: isPublished !== false,
    image_url,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('announcements')
      .insert([newNews])
      .select()
      .single();

    if (!error && data) {
      const current = getCachedNews() || [];
      setCachedNews([data, ...current]);
      return true;
    }
  } catch (error) {
    console.warn('Supabase createNews failed, saving locally:', error);
  }

  // Local fallback
  const current = getCachedNews() || [];
  setCachedNews([newNews, ...current]);
  return true;
}

/**
 * Update an announcement
 */
export async function updateNews(id, updates, imageFile = null, oldImageUrl = null, removeImage = false) {
  const actualId = LEGACY_NEWS_ID_MAP[id] || id;
  const payload = { ...updates };

  try {
    if (imageFile) {
      const newUrl = await uploadNewsImage(imageFile);
      if (newUrl) {
        payload.image_url = newUrl;
        if (oldImageUrl) await deleteNewsImage(oldImageUrl);
      }
    } else if (removeImage) {
      payload.image_url = null;
      if (oldImageUrl) await deleteNewsImage(oldImageUrl);
    }

    if (isUuid(actualId)) {
      const { data, error } = await supabase
        .from('announcements')
        .update(payload)
        .eq('id', actualId)
        .select()
        .single();

      if (!error && data) {
        const current = getCachedNews() || [];
        setCachedNews(current.map((n) => (n.id === id || n.id === actualId ? data : n)));
        return true;
      }
    }
  } catch (error) {
    console.warn('Supabase updateNews failed, updating local cache:', error);
  }

  // Local fallback
  const current = getCachedNews() || [];
  const updatedList = current.map((n) =>
    n.id === id || n.id === actualId ? { ...n, ...payload, id: actualId } : n
  );
  setCachedNews(updatedList);
  return true;
}

/**
 * Delete an announcement
 */
export async function deleteNews(id, imageUrl = null) {
  const actualId = LEGACY_NEWS_ID_MAP[id] || id;

  // 1. Mark permanently in deleted list
  markDeletedNewsId(id);
  markDeletedNewsId(actualId);
  localStorage.setItem(NEWS_SEEDED_KEY, 'true');

  // 2. Remove from local cache immediately
  const cached = getCachedNews();
  const current = cached !== null ? cached : filterOutDeletedNews(RMUTSV_DEFAULT_NEWS);
  const remaining = current.filter((n) => n.id !== id && n.id !== actualId);
  setCachedNews(remaining);

  // 3. Delete image and remote entry
  try {
    if (imageUrl) await deleteNewsImage(imageUrl);

    if (isUuid(actualId)) {
      const { error } = await supabase.from('announcements').delete().eq('id', actualId);
      if (error && error.code !== '22P02') {
        console.warn('Supabase deleteNews error:', error);
      }
    }
  } catch (error) {
    console.warn('Supabase deleteNews failed (continuing with local deletion):', error);
  }

  return true;
}
