-- =============================================
-- Migration: 005_add_announcements
-- Description: สร้างตาราง announcements + Storage bucket สำหรับรูปภาพข่าวสาร
-- =============================================

-- 1. สร้างตาราง
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. เปิด RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 3. ผู้ใช้ทั่วไปดูได้เฉพาะข่าวที่เปิดให้แสดงผล
CREATE POLICY "Anyone can view published announcements"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (is_published = true);

-- 4. แอดมินจัดการได้ทั้งหมด (เพิ่ม แก้ไข ลบ)
CREATE POLICY "Admins can do everything with announcements"
  ON public.announcements FOR ALL
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

-- =============================================
-- 5. สร้าง Storage Bucket และ Policy สำหรับรูปข่าวสาร
-- =============================================
-- หมายเหตุ: คำสั่งสร้าง bucket โดยตรงผ่าน SQL อาจต้องใช้สิทธิ์ superuser 
-- แต่สามารถสร้าง policy ผ่าน SQL ได้เลยหากสร้าง bucket ชื่อ 'news-images' ไว้แล้ว
-- 
-- สมมติว่าได้สร้าง bucket ไปแล้วที่เมนู Storage -> New Bucket ชื่อ "news-images" และติ๊ก Public
-- สามารถรันคำสั่ง SQL ด้านล่างนี้เพื่อสร้าง Policy ได้เลย:

-- 5.1 ให้ผู้ใช้ในระบบทุกคนสามารถดูรูปภาพได้
CREATE POLICY "Anyone can view news images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'news-images');

-- 5.2 ให้เฉพาะแอดมินจัดการรูปภาพได้ (อัปโหลด แก้ไข ลบ)
CREATE POLICY "Admins can manage news images"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'news-images' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'news-images' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
