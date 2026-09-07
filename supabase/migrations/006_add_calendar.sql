-- =====================================================
-- Migration 006: ปฏิทินการดำเนินงาน กยศ. ประจำปีการศึกษา
-- (ขอบเขต 1.3.1 — กำหนดการเปิด-ปิดรับสมัคร ส่งเอกสาร ทำสัญญา ฯลฯ)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  -- หมวด เช่น: เปิดรับสมัคร, ส่งเอกสาร, สัมภาษณ์, ทำสัญญา, เบิกเงิน, จิตอาสา
  category TEXT NOT NULL DEFAULT 'ทั่วไป',
  academic_year TEXT,                 -- เช่น '2568'
  term TEXT,                          -- เช่น '1', '2', 'ฤดูร้อน'
  borrower_type TEXT NOT NULL DEFAULT 'ทั้งหมด'
    CHECK (borrower_type IN ('ทั้งหมด', 'รายเก่า', 'รายใหม่')),
  start_date DATE NOT NULL,
  end_date DATE,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS calendar_events_start_date_idx
  ON public.calendar_events (start_date);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- ผู้ใช้ที่ล็อกอินอ่านได้เฉพาะรายการที่เผยแพร่
CREATE POLICY "Anyone can view published calendar events"
  ON public.calendar_events FOR SELECT
  TO authenticated
  USING (is_published = true);

-- แอดมินจัดการได้ทั้งหมด
CREATE POLICY "Admins can manage calendar events"
  ON public.calendar_events FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- keep updated_at fresh
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calendar_events_touch ON public.calendar_events;
CREATE TRIGGER calendar_events_touch
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================================================
-- ตัวอย่างข้อมูล (แก้ไขวันที่จริงจากประกาศมหาวิทยาลัยผ่านหน้าแอดมิน)
-- =====================================================
INSERT INTO public.calendar_events
  (title, description, category, academic_year, term, borrower_type, start_date, end_date) VALUES
('เปิดระบบยื่นกู้ ภาคเรียนที่ 1/2568 (รายเก่า)',
 'ผู้กู้ยืมรายเก่าของ มทร.ศรีวิชัย ยื่นคำขอกู้ยืมผ่านระบบ DSL',
 'เปิดรับสมัคร', '2568', '1', 'รายเก่า', '2025-05-01', '2025-06-30'),
('เปิดระบบยื่นกู้ ภาคเรียนที่ 1/2568 (รายใหม่)',
 'ผู้กู้ยืมรายใหม่ยื่นแบบคำขอกู้ยืมและแนบเอกสารในระบบ DSL',
 'เปิดรับสมัคร', '2568', '1', 'รายใหม่', '2025-05-15', '2025-07-15'),
('ส่งเอกสารประกอบการกู้ยืมที่กองพัฒนานักศึกษา',
 'ส่งแบบคำขอกู้ยืม (กยศ.101) และเอกสารรับรองรายได้ครอบครัว',
 'ส่งเอกสาร', '2568', '1', 'ทั้งหมด', '2025-06-01', '2025-07-31'),
('ลงนามแบบยืนยันการเบิกเงินกู้ยืม ภาคเรียนที่ 1/2568',
 'ผู้กู้ยืมลงนามแบบยืนยันการเบิกเงินกู้ยืมในระบบ DSL',
 'ทำสัญญา', '2568', '1', 'ทั้งหมด', '2025-08-01', '2025-08-31');
