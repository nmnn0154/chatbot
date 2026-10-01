-- =============================================
-- Migration: 011_add_file_url_to_documents
-- Description: เพิ่มคอลัมน์ file_url, file_size, file_type ในตาราง documents สำหรับดูและดาวน์โหลดไฟล์ PDF ในฐานข้อมูล AI
-- =============================================

-- เพิ่มคอลัมน์เก็บ URL ของไฟล์ PDF/เอกสารต้นฉบับ
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_url TEXT;

-- เพิ่มคอลัมน์เก็บขนาดไฟล์ (เช่น 250 KB, 1.2 MB)
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_size TEXT;

-- เพิ่มคอลัมน์เก็บประเภทไฟล์ (เช่น PDF, TXT, MD)
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'PDF';

-- สร้าง Index เพื่อเพิ่มความเร็วในการค้นหา
CREATE INDEX IF NOT EXISTS idx_documents_file_url ON public.documents(file_url);

-- ให้แน่ใจว่า storage bucket 'document-files' รองรับ PDF
-- (bucket 'document-files' มีอยู่แล้วในระบบ และรองรับ application/pdf)
