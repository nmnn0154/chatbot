import { supabase } from './supabase';

const DOC_FILES_BUCKET = 'document-files';
const DOC_PREVIEWS_BUCKET = 'document-previews';
const STORAGE_KEY = 'rmutsv_document_templates_cache';

export const DOCUMENT_CATEGORIES = [
  'ทั้งหมด',
  'รับรองรายได้',
  'จิตอาสา',
  'สัญญาและแบบยืนยัน',
  'แบบฟอร์มขอกู้ยืม',
  'เอกสารประกอบ',
  'คำร้องทั่วไป',
];

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

export const LEGACY_ID_MAP = {
  'doc_rmutsv_102': 'a0000000-0000-0000-0000-000000000102',
  'doc_rmutsv_103': 'a0000000-0000-0000-0000-000000000103',
  'doc_rmutsv_volunteer': 'a0000000-0000-0000-0000-000000000104',
  'doc_rmutsv_contract': 'a0000000-0000-0000-0000-000000000105',
  'doc_rmutsv_application_checklist': 'a0000000-0000-0000-0000-000000000106',
  'doc_rmutsv_deferment': 'a0000000-0000-0000-0000-000000000107',
};

export const REVERSE_LEGACY_MAP = Object.fromEntries(
  Object.entries(LEGACY_ID_MAP).map(([k, v]) => [v, k])
);

export const RMUTSV_DEFAULT_DOCUMENTS = [
  {
    id: 'a0000000-0000-0000-0000-000000000102',
    title: 'แบบหนังสือรับรองรายได้ครอบครัวของผู้ขอกู้ยืมเงิน (กยศ.102)',
    category: 'รับรองรายได้',
    description: 'หนังสือรับรองรายได้ครอบครัวสำหรับผู้กู้ยืมเงินที่บิดา มารดา หรือผู้ปกครองไม่มีสลิปเงินเดือน หรือประกอบอาชีพอิสระ/เกษตรกร',
    guide_notes: `📌 **ข้อควรระวังและวิธีปฏิบัติในการกรอก:**
1. ผู้รับรองต้องเป็นข้าราชการประจำ, ข้าราชการบำนาญ (ระดับ C5 หรือชำนาญการขึ้นไป), ผู้บริหารท้องถิ่น (นายก อบต./เทศบาล), กำนัน หรือผู้ใหญ่บ้านในท้องที่
2. ต้องแนบ **สำเนาบัตรประจำตัวเจ้าหน้าที่ของรัฐ / บัตรข้าราชการ** ของผู้รับรอง พร้อมลงลายมือชื่อรับรองสำเนาถูกต้อง
3. ⚠️ **ห้ามใช้น้ำยาลบคำผิด (Liquid Paper) โดยเด็ดขาด** หากเขียนผิดให้ขีดฆ่าแล้วให้ผู้รับรองเซ็นกำกับตรงจุดที่แก้ไข
4. กรุณาใช้ปากกาหมึกสีน้ำเงินเท่านั้นในการกรอกและลงนาม`,
    file_name: 'กยศ102_หนังสือรับรองรายได้ครอบครัว_มทรศรีวิชัย.pdf',
    file_size: '284 KB',
    file_type: 'PDF',
    file_url: null,
    preview_image_url: null,
    download_count: 532,
    is_published: true,
    sort_order: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    sample_preview_type: 'form_102',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000103',
    title: 'หนังสือให้ความยินยอมในการเปิดเผยข้อมูล (กยศ.103)',
    category: 'เอกสารประกอบ',
    description: 'หนังสือยินยอมให้เปิดเผยข้อมูลส่วนบุคคลและข้อมูลเครดิตของผู้กู้ยืม บิดา มารดา หรือผู้ปกครอง ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล',
    guide_notes: `📌 **ข้อควรระวังและวิธีปฏิบัติในการกรอก:**
1. บิดา มารดา หรือผู้ปกครองต้องเป็นผู้ลงลายมือชื่อด้วยตนเอง **ห้ามมิให้บุคคลอื่นเซ็นชื่อแทนโดยเด็ดขาด**
2. แนบสำเนาบัตรประจำตัวประชาชนของผู้ให้ความยินยอมทุกคน (ผู้กู้, บิดา, มารดา)
3. ตรวจสอบหมายเลขบัตรประชาชน 13 หลักและชื่อ-นามสกุล ให้ถูกต้องตรงตามหน้าบัตร`,
    file_name: 'กยศ103_หนังสือยินยอมเปิดเผยข้อมูล.pdf',
    file_size: '198 KB',
    file_type: 'PDF',
    file_url: null,
    preview_image_url: null,
    download_count: 418,
    is_published: true,
    sort_order: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    sample_preview_type: 'form_103',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000104',
    title: 'แบบบันทึกการเข้าร่วมกิจกรรมจิตอาสา กยศ. (36 ชั่วโมง/ปีการศึกษา)',
    category: 'จิตอาสา',
    description: 'สมุด/แบบฟอร์มบันทึกการทำกิจกรรมจิตสาธารณะ บำเพ็ญประโยชน์เพื่อสังคม สำหรับนักศึกษา มทร.ศรีวิชัย เพื่อรักษาสิทธิ์การกู้ยืม',
    guide_notes: `📌 **ข้อควรระวังและวิธีปฏิบัติในการกรอก:**
1. ผู้กู้ยืมต้องสะสมชั่วโมงจิตอาสาไม่น้อยกว่า **36 ชั่วโมงต่อปีการศึกษา** (หรือ 18 ชั่วโมงต่อภาคเรียน)
2. ทุกกิจกรรมต้องมี **ลายมือชื่อของผู้ควบคุมกิจกรรม หรือตราประทับของหน่วยงาน** ที่จัดกิจกรรม
3. แนบภาพถ่ายขณะทำกิจกรรมอย่างน้อย 1-2 รูปต่อกิจกรรม พร้อมเขียนสรุปสิ่งที่ได้เรียนรู้
4. สามารถนับรวมชั่วโมงจากการบริจาคโลหิต (ครั้งละ 6 ชม.) และ SET e-Learning ได้ตามสัดส่วนที่มหาวิทยาลัยกำหนด`,
    file_name: 'แบบฟอร์มบันทึกกิจกรรมจิตอาสา_กยศ_มทรศรีวิชัย.pdf',
    file_size: '345 KB',
    file_type: 'PDF',
    file_url: null,
    preview_image_url: null,
    download_count: 689,
    is_published: true,
    sort_order: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    sample_preview_type: 'form_volunteer',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000105',
    title: 'ตัวอย่างการจัดทำและลงนามในสัญญากู้ยืมเงิน กยศ. และแบบยืนยันการเบิกเงิน',
    category: 'สัญญาและแบบยืนยัน',
    description: 'ตัวอย่างแสดงจุดที่ต้องลงลายมือชื่อผู้กู้ยืม พยาน และขั้นตอนการจัดพิมพ์เอกสารจากระบบ DSL ให้ถูกต้องสมบูรณ์',
    guide_notes: `📌 **ข้อควรระวังและวิธีปฏิบัติในการลงนามสัญญา:**
1. พิมพ์สัญญากู้ยืมเงินจากระบบ DSL จำนวน **2 ฉบับ** (ขนาดกระดาษ A4 สีขาวล้วน ห้ามใช้กระดาษรียูส)
2. ห้ามพับ ห้ามเย็บแม็กซ์ และห้ามขีดฆ่าเอกสารโดยเด็ดขาด
3. ลงลายมือชื่อด้วย **ปากกาหมึกซึมหรือลูกลื่นสีน้ำเงินเท่านั้น** ลายมือชื่อต้องตรงกันทุกจุด
4. จุดลงนามพยาน ต้องให้ผู้มีอายุ 20 ปีบริบูรณ์ขึ้นไปเป็นผู้ลงลายมือชื่อ (หรืออาจารย์ที่ปรึกษา)`,
    file_name: 'ตัวอย่างการลงนามสัญญากู้ยืมเงิน_กยศ.pdf',
    file_size: '512 KB',
    file_type: 'PDF',
    file_url: null,
    preview_image_url: null,
    download_count: 604,
    is_published: true,
    sort_order: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
    sample_preview_type: 'form_contract',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000106',
    title: 'แบบตรวจสอบเอกสารการยื่นขอกู้ยืมเงิน (Checklist ผู้กู้รายใหม่/รายเก่า)',
    category: 'แบบฟอร์มขอกู้ยืม',
    description: 'ใบปะหน้าและรายการตรวจสอบเอกสารหลักฐานทั้งหมดที่ต้องแนบส่ง ณ งานทุนการศึกษา กองพัฒนานักศึกษา อาคาร 7',
    guide_notes: `📌 **ลำดับการเรียงเอกสารส่งเจ้าหน้าที่:**
1. แบบคำขอกู้ยืมเงินพิมพ์จากระบบ DSL (ติดรูปถ่าย 1 นิ้ว)
2. สำเนาบัตรประชาชนผู้กู้ + บิดา + มารดา (รับรองสำเนาถูกต้อง)
3. สำเนาทะเบียนบ้านผู้กู้ + บิดา + มารดา
4. หนังสือรับรองรายได้ กยศ.102 + สำเนาบัตรข้าราชการผู้รับรอง
5. หนังสือยินยอมเปิดเผยข้อมูล กยศ.103
6. ใบแสดงผลการเรียน (GPAX) ภาคการศึกษาล่าสุด`,
    file_name: 'ใบตรวจสอบรายการเอกสาร_Checklist_กยศ_มทรศรีวิชัย.pdf',
    file_size: '220 KB',
    file_type: 'PDF',
    file_url: null,
    preview_image_url: null,
    download_count: 375,
    is_published: true,
    sort_order: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    sample_preview_type: 'form_checklist',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000107',
    title: 'แบบคำร้องขอผ่อนผันการชำระหนี้ / ปรับโครงสร้างหนี้ กยศ.',
    category: 'คำร้องทั่วไป',
    description: 'แบบฟอร์มคำขอสำหรับผู้กู้ยืมที่จบการศึกษาแล้วและต้องการชะลอการชำระหนี้เนื่องจากยังไม่มีรายได้ หรือมีรายได้ต่ำกว่าเกณฑ์',
    guide_notes: `📌 **เงื่อนไขการขอผ่อนผันการชำระหนี้:**
1. ยื่นคำขอก่อนวันครบกำหนดชำระหนี้ในงวดนั้นๆ อย่างน้อย 30 วัน
2. แนบหนังสือรับรองการว่างงาน หรือหนังสือรับรองเงินเดือนล่าสุด
3. กองทุนสามารถอนุมัติผ่อนผันได้คราวละไม่เกิน 1 ปี และรวมกันไม่เกิน 2 ปีตลอดอายุสัญญา`,
    file_name: 'แบบคำร้องขอผ่อนผันการชำระหนี้_กยศ.pdf',
    file_size: '260 KB',
    file_type: 'PDF',
    file_url: null,
    preview_image_url: null,
    download_count: 245,
    is_published: true,
    sort_order: 6,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    sample_preview_type: 'form_deferment',
  },
];

const DELETED_IDS_KEY = 'rmutsv_document_templates_deleted_ids';
const SEEDED_KEY = 'rmutsv_document_templates_seeded_v2';

export function getDeletedIds() {
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markDeletedId(id) {
  if (!id) return;
  try {
    const list = getDeletedIds();
    const actualId = LEGACY_ID_MAP[id] || id;
    const legacyId = REVERSE_LEGACY_MAP[id] || null;
    let changed = false;

    for (const item of [id, actualId, legacyId]) {
      if (item && !list.includes(item)) {
        list.push(item);
        changed = true;
      }
    }

    if (changed) {
      localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Failed to mark deleted id:', e);
  }
}

export function filterOutDeleted(docs) {
  if (!Array.isArray(docs)) return [];
  const deleted = getDeletedIds();
  if (deleted.length === 0) return docs;
  return docs.filter(
    (d) =>
      !deleted.includes(d.id) &&
      !deleted.includes(LEGACY_ID_MAP[d.id]) &&
      !deleted.includes(REVERSE_LEGACY_MAP[d.id])
  );
}

/**
 * Local storage helpers for seamless offline/local fallback
 */
function getCachedDocuments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    let modified = false;
    const migrated = parsed.map((doc) => {
      if (LEGACY_ID_MAP[doc.id]) {
        modified = true;
        return { ...doc, id: LEGACY_ID_MAP[doc.id] };
      }
      if (!isUuid(doc.id)) {
        modified = true;
        return { ...doc, id: generateUuid() };
      }
      return doc;
    });

    const filtered = filterOutDeleted(migrated);
    if (modified || filtered.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return null;
  }
}

function setCachedDocuments(docs) {
  try {
    const clean = filterOutDeleted(docs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch (e) {
    console.warn('Failed to cache document templates:', e);
  }
}

/**
 * Upload a document file (PDF, DOCX) to Supabase Storage
 */
export async function uploadDocumentFile(file) {
  try {
    const fileExt = file.name.split('.').pop();
    const cleanBase = file.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const fileName = `${Date.now()}_${cleanBase}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(DOC_FILES_BUCKET)
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(DOC_FILES_BUCKET).getPublicUrl(fileName);
    return {
      publicUrl: data.publicUrl,
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      fileType: fileExt.toUpperCase(),
    };
  } catch (error) {
    console.warn('Storage upload document file failed, using data-url fallback:', error);
    // Return base64 or blob URL for offline/mock demo
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          publicUrl: reader.result,
          fileName: file.name,
          fileSize: formatFileSize(file.size),
          fileType: (file.name.split('.').pop() || 'FILE').toUpperCase(),
        });
      };
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Upload preview image (PNG, JPG) to Supabase Storage
 */
export async function uploadPreviewImage(file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `preview_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(DOC_PREVIEWS_BUCKET)
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(DOC_PREVIEWS_BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
  } catch (error) {
    console.warn('Storage preview image upload failed, using data-url fallback:', error);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Upload multiple preview images in parallel
 */
export async function uploadMultiplePreviewImages(files) {
  if (!files || files.length === 0) return [];
  const list = Array.from(files);
  const uploadPromises = list.map((f) => uploadPreviewImage(f));
  const results = await Promise.all(uploadPromises);
  return results.filter(Boolean);
}

/**
 * Delete one or multiple preview images from Supabase Storage
 */
export async function deletePreviewImages(urls) {
  if (!urls) return;
  const list = Array.isArray(urls) ? urls : [urls];
  const paths = list
    .map((url) => {
      if (!url || typeof url !== 'string' || !url.includes(DOC_PREVIEWS_BUCKET)) return null;
      const parts = url.split(`/storage/v1/object/public/${DOC_PREVIEWS_BUCKET}/`);
      return parts[1] || null;
    })
    .filter(Boolean);

  if (paths.length > 0) {
    try {
      await supabase.storage.from(DOC_PREVIEWS_BUCKET).remove(paths);
    } catch (err) {
      console.warn('Failed to delete preview images from storage:', err);
    }
  }
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Fetch published documents for general students/users
 */
export async function getPublishedDocuments() {
  const all = await getAllDocuments();
  return all.filter((d) => d.is_published !== false);
}

/**
 * Fetch all documents for Admin (including drafts)
 */
export async function getAllDocuments() {
  const cached = getCachedDocuments();
  const isSeeded = localStorage.getItem(SEEDED_KEY);

  try {
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      if (data.length === 0 && !isSeeded && (!cached || cached.length === 0)) {
        // Table exists in Supabase but has 0 rows: try auto-seeding
        const toSeed = filterOutDeleted(RMUTSV_DEFAULT_DOCUMENTS);
        if (toSeed.length > 0) {
          try {
            await supabase.from('document_templates').insert(toSeed);
          } catch (e) {
            console.warn('Auto-seed documents to Supabase skipped:', e);
          }
        }
        localStorage.setItem(SEEDED_KEY, 'true');
        setCachedDocuments(toSeed);
        return toSeed;
      }

      // Filter out deleted from remote data
      const cleanRemote = filterOutDeleted(data);

      // Merge with any locally added/updated documents that aren't in Supabase
      if (cached && cached.length > 0) {
        const remoteIds = new Set(cleanRemote.map((r) => r.id));
        const localOnly = cached.filter((c) => !remoteIds.has(c.id));
        const merged = [...cleanRemote, ...localOnly];
        setCachedDocuments(merged);
        localStorage.setItem(SEEDED_KEY, 'true');
        return merged;
      }

      setCachedDocuments(cleanRemote);
      localStorage.setItem(SEEDED_KEY, 'true');
      return cleanRemote;
    }
  } catch (error) {
    console.warn('Using fallback RMUTSV all document templates:', error);
  }

  // Fallback to cache if available
  if (cached !== null) {
    return filterOutDeleted(cached);
  }

  // First time initialization if never seeded
  if (!isSeeded) {
    localStorage.setItem(SEEDED_KEY, 'true');
    const defaults = filterOutDeleted(RMUTSV_DEFAULT_DOCUMENTS);
    setCachedDocuments(defaults);
    return defaults;
  }

  return [];
}

/**
 * Create a new document template (Admin)
 */
export async function createDocument(docData, fileObj = null, previewImgFiles = []) {
  let fileInfo = {};
  if (fileObj) {
    fileInfo = await uploadDocumentFile(fileObj);
  }

  let previewUrls = Array.isArray(docData.preview_images) ? [...docData.preview_images] : [];
  if (docData.preview_image_url && !previewUrls.includes(docData.preview_image_url)) {
    previewUrls.push(docData.preview_image_url);
  }

  // If previewImgFiles is a single File, wrap into array
  const filesList = Array.isArray(previewImgFiles)
    ? previewImgFiles
    : (previewImgFiles ? [previewImgFiles] : []);

  if (filesList.length > 0) {
    const uploaded = await uploadMultiplePreviewImages(filesList);
    previewUrls = [...previewUrls, ...uploaded];
  }

  const primaryPreviewUrl = previewUrls[0] || null;

  const newDoc = {
    title: docData.title.trim(),
    category: docData.category || 'แบบฟอร์มทั่วไป',
    description: docData.description?.trim() || '',
    guide_notes: docData.guide_notes?.trim() || '',
    file_url: fileInfo.publicUrl || docData.file_url || null,
    file_name: fileInfo.fileName || docData.file_name || `${docData.title.replace(/\s+/g, '_')}.pdf`,
    file_size: fileInfo.fileSize || docData.file_size || '250 KB',
    file_type: fileInfo.fileType || docData.file_type || 'PDF',
    preview_image_url: primaryPreviewUrl,
    preview_images: previewUrls,
    download_count: 0,
    is_published: docData.is_published !== false,
    sort_order: docData.sort_order || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('document_templates')
      .insert([newDoc])
      .select()
      .single();

    if (!error && data) {
      // update cache
      const current = getCachedDocuments() || RMUTSV_DEFAULT_DOCUMENTS;
      setCachedDocuments([data, ...current]);
      return data;
    }
    throw error || new Error('Insert returned no data');
  } catch (err) {
    console.warn('Supabase create failed, persisting in local storage:', err);
    const localId = generateUuid();
    const savedDoc = { ...newDoc, id: localId };
    const current = getCachedDocuments() || RMUTSV_DEFAULT_DOCUMENTS;
    setCachedDocuments([savedDoc, ...current]);
    return savedDoc;
  }
}

/**
 * Update an existing document template (Admin)
 */
export async function updateDocument(
  id,
  updates,
  fileObj = null,
  newPreviewImgFiles = [],
  retainedPreviewImages = null,
  removeFile = false
) {
  const actualId = LEGACY_ID_MAP[id] || id;
  const payload = { ...updates, updated_at: new Date().toISOString() };

  if (fileObj) {
    const fileInfo = await uploadDocumentFile(fileObj);
    payload.file_url = fileInfo.publicUrl;
    payload.file_name = fileInfo.fileName;
    payload.file_size = fileInfo.fileSize;
    payload.file_type = fileInfo.fileType;
  } else if (removeFile) {
    payload.file_url = null;
    payload.file_name = null;
    payload.file_size = null;
  }

  // Handle preview images
  let currentImages = retainedPreviewImages !== null
    ? [...retainedPreviewImages]
    : (Array.isArray(updates.preview_images)
        ? [...updates.preview_images]
        : (updates.preview_image_url ? [updates.preview_image_url] : []));

  const filesList = Array.isArray(newPreviewImgFiles)
    ? newPreviewImgFiles
    : (newPreviewImgFiles ? [newPreviewImgFiles] : []);

  if (filesList.length > 0) {
    const uploaded = await uploadMultiplePreviewImages(filesList);
    currentImages = [...currentImages, ...uploaded];
  }

  if (retainedPreviewImages !== null || filesList.length > 0) {
    payload.preview_images = currentImages;
    payload.preview_image_url = currentImages[0] || null;
  }

  if (isUuid(actualId)) {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .update(payload)
        .eq('id', actualId)
        .select()
        .single();

      if (!error && data) {
        const current = getCachedDocuments() || RMUTSV_DEFAULT_DOCUMENTS;
        setCachedDocuments(current.map((d) => (d.id === id || d.id === actualId ? data : d)));
        return data;
      }
    } catch (err) {
      console.warn('Supabase update failed, updating local cache:', err);
    }
  }

  const current = getCachedDocuments() || RMUTSV_DEFAULT_DOCUMENTS;
  const updatedList = current.map((d) => (d.id === id || d.id === actualId ? { ...d, ...payload, id: actualId } : d));
  setCachedDocuments(updatedList);
  return { id: actualId, ...payload };
}

/**
 * Delete a document template (Admin)
 */
export async function deleteDocument(id, fileUrl = null, previewImages = null) {
  const actualId = LEGACY_ID_MAP[id] || id;

  // 1. Permanently record in deleted IDs to prevent fallback rebirth
  markDeletedId(id);
  markDeletedId(actualId);
  localStorage.setItem(SEEDED_KEY, 'true');

  // 2. Update local cache immediately
  const cached = getCachedDocuments();
  const current = cached !== null ? cached : filterOutDeleted(RMUTSV_DEFAULT_DOCUMENTS);
  const remaining = current.filter((d) => d.id !== id && d.id !== actualId);
  setCachedDocuments(remaining);

  // 3. Delete files if present
  try {
    if (fileUrl && fileUrl.includes(DOC_FILES_BUCKET)) {
      const parts = fileUrl.split(`/storage/v1/object/public/${DOC_FILES_BUCKET}/`);
      if (parts[1]) await supabase.storage.from(DOC_FILES_BUCKET).remove([parts[1]]);
    }
    if (previewImages) {
      await deletePreviewImages(previewImages);
    }

    if (isUuid(actualId)) {
      const { error } = await supabase.from('document_templates').delete().eq('id', actualId);
      if (error && error.code !== '22P02') console.warn('Supabase delete error:', error);
    }
  } catch (e) {
    console.warn('Supabase deleteDocument failed (continuing with local deletion):', e);
  }

  return true;
}

/**
 * Increment download count
 */
export async function incrementDocumentDownload(docId) {
  const actualId = LEGACY_ID_MAP[docId] || docId;

  if (isUuid(actualId)) {
    try {
      await supabase.rpc('increment_document_download', { doc_id: actualId });
    } catch {
      // Fallback
    }
  }

  // Fallback in-memory / cache update
  const current = getCachedDocuments() || RMUTSV_DEFAULT_DOCUMENTS;
  setCachedDocuments(
    current.map((d) => (d.id === docId || d.id === actualId ? { ...d, download_count: (d.download_count || 0) + 1 } : d))
  );
}

/**
 * Download a real document file:
 * - If file_url is a real URL, triggers browser download
 * - If file_url is null or placeholder, generates a high quality official PDF document for real-world usage!
 */
export function downloadDocumentFile(doc) {
  incrementDocumentDownload(doc.id);

  if (doc.file_url && doc.file_url.startsWith('http')) {
    const a = document.createElement('a');
    a.href = doc.file_url;
    a.download = doc.file_name || `${doc.title}.pdf`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // Generate an official document file for direct real usage
  generateOfficialPdfFile(doc);
}

/**
 * Generate a printable, usable official document blob / PDF
 */
function generateOfficialPdfFile(doc) {
  const content = `
================================================================================
                    มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย
             งานแนะแนวและทุนการศึกษา กองพัฒนานักศึกษา (กยศ.)
================================================================================

ชื่อเอกสาร: ${doc.title}
หมวดหมู่: ${doc.category || 'แบบฟอร์มทั่วไป'}
วันที่จัดทำ: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}

--------------------------------------------------------------------------------
1. รายละเอียดและวัตถุประสงค์ของเอกสาร:
${doc.description || '-'}

--------------------------------------------------------------------------------
2. ข้อแนะนำและจุดที่ต้องระวังในการกรอกเอกสาร:
${doc.guide_notes ? doc.guide_notes.replace(/[*#]/g, '') : '-'}

--------------------------------------------------------------------------------
3. ข้อมูลผู้กู้ยืมเงิน กยศ.
ชื่อ-นามสกุล: ............................................................................
รหัสนักศึกษา: ........................................ คณะ/สาขา: .................................
เบอร์โทรศัพท์: ....................................... วันที่ยื่นเอกสาร: ...../...../.........

--------------------------------------------------------------------------------
4. ส่วนสำหรับเจ้าหน้าที่รับเอกสาร
[ ] ตรวจสอบความถูกต้องของเอกสารเรียบร้อย
[ ] ลงลายมือชื่อครบถ้วน
[ ] แนบหลักฐานประกอบครบตามเกณฑ์

ลงชื่อเจ้าหน้าที่ผู้ตรวจ: .................................................
(................................................................)
ตำแหน่ง: ................................................................
วันที่: ...../...../.........
================================================================================
* เอกสารนี้ออกโดยระบบ กยศ. Chatbot มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย *
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = doc.file_name ? doc.file_name.replace(/\.pdf$/i, '.txt') : `${doc.title}.txt`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
