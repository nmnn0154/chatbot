-- =============================================
-- Migration: 010_document_templates
-- Description: สร้างตาราง document_templates สำหรับจัดเก็บตัวอย่างเอกสารและแบบฟอร์มดาวน์โหลด กยศ.
-- =============================================

CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'แบบฟอร์มทั่วไป',
  description TEXT,
  guide_notes TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size TEXT,
  file_type TEXT DEFAULT 'pdf',
  preview_image_url TEXT,
  preview_images TEXT[] DEFAULT '{}',
  download_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure preview_images column exists if table was already created
ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS preview_images TEXT[] DEFAULT '{}';

-- Index for searching and filtering
CREATE INDEX IF NOT EXISTS idx_doc_templates_published ON public.document_templates(is_published);
CREATE INDEX IF NOT EXISTS idx_doc_templates_category ON public.document_templates(category);

-- RLS
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- 1. ผู้ใช้ทุกคน (ทั้งที่ล็อกอินและบุคคลทั่วไป) ดูเอกสารที่เผยแพร่แล้วได้
DROP POLICY IF EXISTS "Anyone can view published document templates" ON public.document_templates;
CREATE POLICY "Anyone can view published document templates"
  ON public.document_templates FOR SELECT
  TO authenticated, anon
  USING (is_published = true);

-- 2. แอดมินสามารถจัดการได้ทั้งหมด (เพิ่ม แก้ไข ลบ ดูทั้งหมด)
DROP POLICY IF EXISTS "Admins can manage document templates" ON public.document_templates;
CREATE POLICY "Admins can manage document templates"
  ON public.document_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 3. RPC Function เพิ่มยอดดาวน์โหลดแบบ atomic
CREATE OR REPLACE FUNCTION public.increment_document_download(doc_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.document_templates
  SET download_count = download_count + 1
  WHERE id = doc_id;
END;
$$;

-- 4. ข้อมูลเอกสารและแบบฟอร์มเริ่มต้น (Initial Seed)
INSERT INTO public.document_templates 
  (id, title, category, description, guide_notes, file_name, file_size, file_type, download_count, is_published, sort_order)
VALUES
  (
    'a0000000-0000-0000-0000-000000000102',
    'แบบหนังสือรับรองรายได้ครอบครัวของผู้ขอกู้ยืมเงิน (กยศ.102)',
    'รับรองรายได้',
    'หนังสือรับรองรายได้ครอบครัวสำหรับผู้กู้ยืมเงินที่บิดา มารดา หรือผู้ปกครองไม่มีสลิปเงินเดือน หรือประกอบอาชีพอิสระ/เกษตรกร',
    '📌 ข้อควรระวังและวิธีปฏิบัติในการกรอก:
1. ผู้รับรองต้องเป็นข้าราชการประจำ, ข้าราชการบำนาญ (ระดับ C5 หรือชำนาญการขึ้นไป), ผู้บริหารท้องถิ่น (นายก อบต./เทศบาล), กำนัน หรือผู้ใหญ่บ้านในท้องที่
2. ต้องแนบ สำเนาบัตรประจำตัวเจ้าหน้าที่ของรัฐ / บัตรข้าราชการ ของผู้รับรอง พร้อมลงลายมือชื่อรับรองสำเนาถูกต้อง
3. ⚠️ ห้ามใช้น้ำยาลบคำผิด (Liquid Paper) โดยเด็ดขาด หากเขียนผิดให้ขีดฆ่าแล้วให้ผู้รับรองเซ็นกำกับตรงจุดที่แก้ไข
4. กรุณาใช้ปากกาหมึกสีน้ำเงินเท่านั้นในการกรอกและลงนาม',
    'กยศ102_หนังสือรับรองรายได้ครอบครัว_มทรศรีวิชัย.pdf',
    '284 KB',
    'PDF',
    532,
    true,
    1
  ),
  (
    'a0000000-0000-0000-0000-000000000103',
    'หนังสือให้ความยินยอมในการเปิดเผยข้อมูล (กยศ.103)',
    'เอกสารประกอบ',
    'หนังสือยินยอมให้เปิดเผยข้อมูลส่วนบุคคลและข้อมูลเครดิตของผู้กู้ยืม บิดา มารดา หรือผู้ปกครอง ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล',
    '📌 ข้อควรระวังและวิธีปฏิบัติในการกรอก:
1. บิดา มารดา หรือผู้ปกครองต้องเป็นผู้ลงลายมือชื่อด้วยตนเอง ห้ามมิให้บุคคลอื่นเซ็นชื่อแทนโดยเด็ดขาด
2. แนบสำเนาบัตรประจำตัวประชาชนของผู้ให้ความยินยอมทุกคน (ผู้กู้, บิดา, มารดา)
3. ตรวจสอบหมายเลขบัตรประชาชน 13 หลักและชื่อ-นามสกุล ให้ถูกต้องตรงตามหน้าบัตร',
    'กยศ103_หนังสือยินยอมเปิดเผยข้อมูล.pdf',
    '198 KB',
    'PDF',
    418,
    true,
    2
  ),
  (
    'a0000000-0000-0000-0000-000000000104',
    'แบบบันทึกการเข้าร่วมกิจกรรมจิตอาสา กยศ. (36 ชั่วโมง/ปีการศึกษา)',
    'จิตอาสา',
    'สมุด/แบบฟอร์มบันทึกการทำกิจกรรมจิตสาธารณะ บำเพ็ญประโยชน์เพื่อสังคม สำหรับนักศึกษา มทร.ศรีวิชัย เพื่อรักษาสิทธิ์การกู้ยืม',
    '📌 ข้อควรระวังและวิธีปฏิบัติในการกรอก:
1. ผู้กู้ยืมต้องสะสมชั่วโมงจิตอาสาไม่น้อยกว่า 36 ชั่วโมงต่อปีการศึกษา (หรือ 18 ชั่วโมงต่อภาคเรียน)
2. ทุกกิจกรรมต้องมี ลายมือชื่อของผู้ควบคุมกิจกรรม หรือตราประทับของหน่วยงาน ที่จัดกิจกรรม
3. แนบภาพถ่ายขณะทำกิจกรรมอย่างน้อย 1-2 รูปต่อกิจกรรม พร้อมเขียนสรุปสิ่งที่ได้เรียนรู้
4. สามารถนับรวมชั่วโมงจากการบริจาคโลหิต (ครั้งละ 6 ชม.) และ SET e-Learning ได้ตามสัดส่วนที่มหาวิทยาลัยกำหนด',
    'แบบฟอร์มบันทึกกิจกรรมจิตอาสา_กยศ_มทรศรีวิชัย.pdf',
    '345 KB',
    'PDF',
    689,
    true,
    3
  ),
  (
    'a0000000-0000-0000-0000-000000000105',
    'ตัวอย่างการจัดทำและลงนามในสัญญากู้ยืมเงิน กยศ. และแบบยืนยันการเบิกเงิน',
    'สัญญาและแบบยืนยัน',
    'ตัวอย่างแสดงจุดที่ต้องลงลายมือชื่อผู้กู้ยืม พยาน และขั้นตอนการจัดพิมพ์เอกสารจากระบบ DSL ให้ถูกต้องสมบูรณ์',
    '📌 ข้อควรระวังและวิธีปฏิบัติในการลงนามสัญญา:
1. พิมพ์สัญญากู้ยืมเงินจากระบบ DSL จำนวน 2 ฉบับ (ขนาดกระดาษ A4 สีขาวล้วน ห้ามใช้กระดาษรียูส)
2. ห้ามพับ ห้ามเย็บแม็กซ์ และห้ามขีดฆ่าเอกสารโดยเด็ดขาด
3. ลงลายมือชื่อด้วย ปากกาหมึกซึมหรือลูกลื่นสีน้ำเงินเท่านั้น ลายมือชื่อต้องตรงกันทุกจุด
4. จุดลงนามพยาน ต้องให้ผู้มีอายุ 20 ปีบริบูรณ์ขึ้นไปเป็นผู้ลงลายมือชื่อ (หรืออาจารย์ที่ปรึกษา)',
    'ตัวอย่างการลงนามสัญญากู้ยืมเงิน_กยศ.pdf',
    '512 KB',
    'PDF',
    604,
    true,
    4
  ),
  (
    'a0000000-0000-0000-0000-000000000106',
    'แบบตรวจสอบเอกสารการยื่นขอกู้ยืมเงิน (Checklist ผู้กู้รายใหม่/รายเก่า)',
    'แบบฟอร์มขอกู้ยืม',
    'ใบปะหน้าและรายการตรวจสอบเอกสารหลักฐานทั้งหมดที่ต้องแนบส่ง ณ งานทุนการศึกษา กองพัฒนานักศึกษา อาคาร 7',
    '📌 ลำดับการเรียงเอกสารส่งเจ้าหน้าที่:
1. แบบคำขอกู้ยืมเงินพิมพ์จากระบบ DSL (ติดรูปถ่าย 1 นิ้ว)
2. สำเนาบัตรประชาชนผู้กู้ + บิดา + มารดา (รับรองสำเนาถูกต้อง)
3. สำเนาทะเบียนบ้านผู้กู้ + บิดา + มารดา
4. หนังสือรับรองรายได้ กยศ.102 + สำเนาบัตรข้าราชการผู้รับรอง
5. หนังสือยินยอมเปิดเผยข้อมูล กยศ.103
6. ใบแสดงผลการเรียน (GPAX) ภาคการศึกษาล่าสุด',
    'ใบตรวจสอบรายการเอกสาร_Checklist_กยศ_มทรศรีวิชัย.pdf',
    '220 KB',
    'PDF',
    375,
    true,
    5
  ),
  (
    'a0000000-0000-0000-0000-000000000107',
    'แบบคำร้องขอผ่อนผันการชำระหนี้ / ปรับโครงสร้างหนี้ กยศ.',
    'คำร้องทั่วไป',
    'แบบฟอร์มคำขอสำหรับผู้กู้ยืมที่จบการศึกษาแล้วและต้องการชะลอการชำระหนี้เนื่องจากยังไม่มีรายได้ หรือมีรายได้ต่ำกว่าเกณฑ์',
    '📌 เงื่อนไขการขอผ่อนผันการชำระหนี้:
1. ยื่นคำขอก่อนวันครบกำหนดชำระหนี้ในงวดนั้นๆ อย่างน้อย 30 วัน
2. แนบหนังสือรับรองการว่างงาน หรือหนังสือรับรองเงินเดือนล่าสุด
3. กองทุนสามารถอนุมัติผ่อนผันได้คราวละไม่เกิน 1 ปี และรวมกันไม่เกิน 2 ปีตลอดอายุสัญญา',
    'แบบคำร้องขอผ่อนผันการชำระหนี้_กยศ.pdf',
    '260 KB',
    'PDF',
    245,
    true,
    6
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 5. สร้าง Storage Buckets สำหรับไฟล์และรูปภาพตัวอย่าง
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'document-files',
    'document-files',
    true,
    52428800, -- 50MB
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  ),
  (
    'document-previews',
    'document-previews',
    true,
    20971520, -- 20MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
  )
ON CONFLICT (id) DO UPDATE 
SET public = true;

-- 5.1 อนุญาตให้ทุกคนเปิดดูและดาวน์โหลดไฟล์ได้ (Public SELECT)
DROP POLICY IF EXISTS "Public Access document-files" ON storage.objects;
CREATE POLICY "Public Access document-files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'document-files');

DROP POLICY IF EXISTS "Public Access document-previews" ON storage.objects;
CREATE POLICY "Public Access document-previews"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'document-previews');

-- 5.2 อนุญาตให้อัปโหลดไฟล์และรูปภาพ (INSERT)
DROP POLICY IF EXISTS "Anyone can upload document-files" ON storage.objects;
CREATE POLICY "Anyone can upload document-files"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'document-files');

DROP POLICY IF EXISTS "Anyone can upload document-previews" ON storage.objects;
CREATE POLICY "Anyone can upload document-previews"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'document-previews');

-- 5.3 อนุญาตให้อัปเดตไฟล์ (UPDATE)
DROP POLICY IF EXISTS "Anyone can update document-files" ON storage.objects;
CREATE POLICY "Anyone can update document-files"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'document-files');

DROP POLICY IF EXISTS "Anyone can update document-previews" ON storage.objects;
CREATE POLICY "Anyone can update document-previews"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'document-previews');

-- 5.4 อนุญาตให้ลบไฟล์ (DELETE)
DROP POLICY IF EXISTS "Anyone can delete document-files" ON storage.objects;
CREATE POLICY "Anyone can delete document-files"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'document-files');

DROP POLICY IF EXISTS "Anyone can delete document-previews" ON storage.objects;
CREATE POLICY "Anyone can delete document-previews"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'document-previews');
