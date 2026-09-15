import { supabase } from './supabase';

const BUCKET = 'news-images';

export const RMUTSV_DEFAULT_NEWS = [
  {
    id: 'news_rmutsv_1',
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
    id: 'news_rmutsv_2',
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
    id: 'news_rmutsv_3',
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
    id: 'news_rmutsv_4',
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
    console.error('Failed to upload image:', error);
    return null;
  }
}

/**
 * Delete an image from Supabase Storage by its public URL.
 */
export async function deleteNewsImage(publicUrl) {
  try {
    if (!publicUrl) return;
    const parts = publicUrl.split(`/storage/v1/object/public/${BUCKET}/`);
    if (parts.length < 2) return;
    const { error } = await supabase.storage.from(BUCKET).remove([parts[1]]);
    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete image:', error);
  }
}

/**
 * Fetch all published news (for users)
 */
export async function getPublishedNews() {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return RMUTSV_DEFAULT_NEWS;
    }
    return data;
  } catch (error) {
    console.warn('Using fallback RMUTSV news:', error);
    return RMUTSV_DEFAULT_NEWS;
  }
}

/**
 * Fetch all news (for admins)
 */
export async function getAllNews() {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return RMUTSV_DEFAULT_NEWS;
    }
    return data;
  } catch (error) {
    console.warn('Using fallback RMUTSV all news:', error);
    return RMUTSV_DEFAULT_NEWS;
  }
}

/**
 * Create a new announcement (with optional image)
 */
export async function createNews(title, content, isPublished = true, imageFile = null) {
  try {
    let image_url = null;
    if (imageFile) image_url = await uploadNewsImage(imageFile);

    const { error } = await supabase
      .from('announcements')
      .insert({ title, content, is_published: isPublished, image_url });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to create news:', error);
    return false;
  }
}

/**
 * Update an announcement
 */
export async function updateNews(id, updates, imageFile = null, oldImageUrl = null, removeImage = false) {
  try {
    if (imageFile) {
      const newUrl = await uploadNewsImage(imageFile);
      if (newUrl) {
        updates.image_url = newUrl;
        if (oldImageUrl) await deleteNewsImage(oldImageUrl);
      }
    } else if (removeImage) {
      updates.image_url = null;
      if (oldImageUrl) await deleteNewsImage(oldImageUrl);
    }

    const { error } = await supabase.from('announcements').update(updates).eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to update news:', error);
    return false;
  }
}

/**
 * Delete an announcement
 */
export async function deleteNews(id, imageUrl = null) {
  try {
    if (imageUrl) await deleteNewsImage(imageUrl);

    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to delete news:', error);
    return false;
  }
}
