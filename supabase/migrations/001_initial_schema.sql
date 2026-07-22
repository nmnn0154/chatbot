-- =====================================================
-- กยศ. Chatbot — Database Schema for Supabase
-- Rajamangala University of Technology Srivijaya
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE
-- Linked to auth.users, stores role and display info
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. KNOWLEDGE_BASE TABLE
-- Stores FAQs, rules, and documents for RAG
-- =====================================================
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'ทั่วไป',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CHAT_HISTORIES TABLE
-- Stores user chat logs for admin review
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chat_histories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chat_histories ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. HELPER FUNCTION: is_admin()
-- SECURITY DEFINER to avoid infinite RLS loops
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. AUTO-CREATE PROFILE ON SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'ผู้ใช้'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: create profile when new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- ---- PROFILES ----
-- Anyone authenticated can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((SELECT public.is_admin()));

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update all profiles (e.g., change roles)
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- ---- KNOWLEDGE_BASE ----
-- All authenticated users can read knowledge base
CREATE POLICY "Anyone can read knowledge base"
  ON public.knowledge_base FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert knowledge base entries
CREATE POLICY "Admins can insert knowledge base"
  ON public.knowledge_base FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

-- Only admins can update knowledge base entries
CREATE POLICY "Admins can update knowledge base"
  ON public.knowledge_base FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- Only admins can delete knowledge base entries
CREATE POLICY "Admins can delete knowledge base"
  ON public.knowledge_base FOR DELETE
  TO authenticated
  USING ((SELECT public.is_admin()));

-- ---- CHAT_HISTORIES ----
-- Users can read their own chat history
CREATE POLICY "Users can read own chat history"
  ON public.chat_histories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all chat histories
CREATE POLICY "Admins can read all chat histories"
  ON public.chat_histories FOR SELECT
  TO authenticated
  USING ((SELECT public.is_admin()));

-- Users can insert their own chat history
CREATE POLICY "Users can insert own chat history"
  ON public.chat_histories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can insert chat history (for system messages)
CREATE POLICY "Admins can insert chat history"
  ON public.chat_histories FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

-- =====================================================
-- 7. SEED DATA: Knowledge Base (กยศ. FAQs)
-- =====================================================
INSERT INTO public.knowledge_base (topic, category, question, answer) VALUES

-- คุณสมบัติผู้กู้
('คุณสมบัติผู้กู้ กยศ.', 'คุณสมบัติ',
 'คุณสมบัติของผู้กู้ยืม กยศ. มีอะไรบ้าง?',
 'คุณสมบัติผู้กู้ยืม กยศ. ได้แก่:
1. มีสัญชาติไทย
2. ศึกษาหรือได้รับการตอบรับให้เข้าศึกษาในสถานศึกษาที่ร่วมโครงการกับกองทุน
3. เป็นผู้ที่มีความประพฤติดี ไม่ฝ่าฝืนระเบียบของสถานศึกษาอย่างร้ายแรง
4. มีผลการเรียนดีหรือผ่านเกณฑ์การวัดผลของสถานศึกษา
5. เป็นผู้กู้ยืมเงินเพียงแห่งเดียวในภาคการศึกษาเดียวกัน
6. รายได้ครอบครัวไม่เกิน 360,000 บาท/ปี (สำหรับลักษณะผู้ขาดแคลนทุนทรัพย์)'),

('อายุผู้กู้', 'คุณสมบัติ',
 'ผู้กู้ กยศ. ต้องมีอายุเท่าไร?',
 'ผู้กู้ยืม กยศ. ไม่มีการกำหนดอายุขั้นต่ำหรือสูงสุดโดยตรง แต่ต้องเป็นนักเรียน/นักศึกษาที่กำลังศึกษาอยู่ในสถานศึกษาที่เข้าร่วมโครงการกับกองทุน'),

-- เอกสาร
('เอกสารที่ต้องเตรียม', 'เอกสาร',
 'ต้องเตรียมเอกสารอะไรบ้างในการกู้ กยศ.?',
 'เอกสารที่ต้องเตรียมสำหรับการกู้ยืม กยศ. ได้แก่:
1. แบบคำขอกู้ยืมเงิน (กยศ.101)
2. หนังสือให้ความยินยอมในการเปิดเผยข้อมูลส่วนบุคคล (ของผู้กู้ บิดา มารดา หรือผู้ปกครอง)
3. สำเนาบัตรประจำตัวประชาชน (ของผู้กู้ บิดา มารดา หรือผู้ปกครอง)
4. เอกสารรับรองรายได้ครอบครัว:
   - กรณีมีรายได้ประจำ: สลิปเงินเดือน หรือหนังสือรับรองเงินเดือน
   - กรณีไม่มีรายได้ประจำ: หนังสือรับรองรายได้ครอบครัว (กยศ.102) พร้อมสำเนาบัตรเจ้าหน้าที่รัฐผู้รับรอง
5. เอกสารอื่นๆ ตามที่สถานศึกษากำหนด (เช่น สมุดบันทึกกิจกรรมจิตอาสา)'),

('เอกสาร กยศ.102', 'เอกสาร',
 'กยศ.102 คืออะไร?',
 'กยศ.102 คือ หนังสือรับรองรายได้ครอบครัวของผู้กู้ยืม ใช้ในกรณีที่บิดามารดาหรือผู้ปกครองไม่มีรายได้ประจำ (ไม่มีสลิปเงินเดือน) โดยต้องให้เจ้าหน้าที่ของรัฐหรือข้าราชการเป็นผู้รับรองรายได้ พร้อมแนบสำเนาบัตรประจำตัวเจ้าหน้าที่รัฐของผู้รับรอง'),

-- ขั้นตอนการกู้
('ขั้นตอนการกู้ยืม', 'ขั้นตอน',
 'ขั้นตอนการกู้ยืม กยศ. ผ่านระบบ DSL มีอะไรบ้าง?',
 'ขั้นตอนการกู้ยืมผ่านระบบ DSL:
1. ลงทะเบียน: ดาวน์โหลดแอปพลิเคชัน "กยศ. Connect" หรือเข้าเว็บไซต์ https://wsa.dsl.studentloan.or.th
2. ยื่นความประสงค์ (Pre-Approve): สำหรับผู้กู้รายใหม่ ต้องยื่นผ่านระบบ Pre-Approve เพื่อตรวจสอบสิทธิเบื้องต้น
3. กรอกข้อมูลและแนบเอกสาร: เข้าสู่ระบบ DSL เพื่อกรอกข้อมูลและแนบไฟล์เอกสารดิจิทัล (ขนาดไม่เกิน 10 MB)
4. สถานศึกษาตรวจสอบ: รอให้สถานศึกษาตรวจสอบและอนุมัติคำขอ
5. ทำสัญญา: เมื่อผ่านการอนุมัติ ทำสัญญากู้ยืมเงินและแบบยืนยันการเบิกเงินในระบบ DSL'),

('ระบบ DSL คืออะไร', 'ขั้นตอน',
 'ระบบ DSL คืออะไร?',
 'ระบบ DSL (Digital Student Loan) คือระบบกองทุนเงินให้กู้ยืมเพื่อการศึกษาแบบดิจิทัล เป็นระบบออนไลน์ที่ใช้ในการดำเนินการกู้ยืมทั้งหมด ตั้งแต่การลงทะเบียน ยื่นคำขอกู้ แนบเอกสาร ไปจนถึงการทำสัญญา สามารถเข้าใช้งานได้ที่ https://wsa.dsl.studentloan.or.th หรือผ่านแอป กยศ. Connect'),

('แอป กยศ. Connect', 'ขั้นตอน',
 'แอป กยศ. Connect คืออะไร ใช้งานอย่างไร?',
 'แอป กยศ. Connect เป็นแอปพลิเคชันอย่างเป็นทางการของกองทุน กยศ. สำหรับผู้กู้ยืมเงิน สามารถดาวน์โหลดได้ทั้ง iOS และ Android ใช้สำหรับ:
1. ลงทะเบียนผู้กู้ใหม่
2. ยื่นคำขอกู้ยืมและแนบเอกสาร
3. ตรวจสอบสถานะการกู้ยืม
4. ทำสัญญากู้ยืมเงิน
5. ตรวจสอบยอดหนี้และสถานะการชำระ'),

('การยืนยันตัวตน', 'ขั้นตอน',
 'ต้องยืนยันตัวตนอย่างไรในระบบ กยศ.?',
 'การยืนยันตัวตนในระบบ กยศ. ปัจจุบันต้องใช้แอปพลิเคชัน ThaID (ของกรมการปกครอง) ในการยืนยันตัวตน โดยบางกรณีอาจต้องใช้ร่วมกับแอปทางรัฐ ควรเตรียมดาวน์โหลดและลงทะเบียนแอปเหล่านี้ไว้ล่วงหน้าเพื่อความสะดวก'),

-- การชำระหนี้
('การชำระหนี้ กยศ.', 'การชำระหนี้',
 'ช่องทางการชำระหนี้ กยศ. มีอะไรบ้าง?',
 'ช่องทางการชำระหนี้ กยศ. ได้แก่:
1. แอปพลิเคชัน กยศ. Connect
2. แอปพลิเคชัน เป๋าตัง (Paotang)
3. เคาน์เตอร์ธนาคารกรุงไทย ทุกสาขา
4. ตู้ ATM ธนาคารกรุงไทย
5. Krungthai NEXT (แอปธนาคารกรุงไทย)
6. หักบัญชีเงินฝากธนาคารกรุงไทยอัตโนมัติ
7. เคาน์เตอร์เซอร์วิส (7-Eleven)
8. ไปรษณีย์ไทย (Pay at Post)'),

('ดอกเบี้ย กยศ.', 'การชำระหนี้',
 'กยศ. คิดอัตราดอกเบี้ยเท่าไร?',
 'กยศ. คิดอัตราดอกเบี้ยเงินกู้ยืมเพื่อการศึกษาไม่เกิน 1% ต่อปี โดยจะเริ่มคิดดอกเบี้ยหลังจากครบระยะเวลาปลอดหนี้ 2 ปี นับจากวันที่สำเร็จการศึกษาหรือเลิกการศึกษา ผู้กู้ยืมต้องชำระเงินคืนกองทุนให้เสร็จสิ้นภายใน 15 ปี นับจากวันที่ครบกำหนดปลอดหนี้'),

('ระยะเวลาปลอดหนี้', 'การชำระหนี้',
 'ระยะเวลาปลอดหนี้ กยศ. คือเท่าไร?',
 'ผู้กู้ยืม กยศ. จะมีระยะเวลาปลอดหนี้ 2 ปี นับจากวันที่สำเร็จการศึกษาหรือเลิกการศึกษา หลังจากครบ 2 ปี จะต้องเริ่มชำระเงินคืนกองทุน โดยมีระยะเวลาชำระคืนทั้งหมด 15 ปี'),

-- ข้อมูล มทร.ศรีวิชัย
('ข้อมูลติดต่อ กยศ. มทร.ศรีวิชัย', 'ข้อมูลทั่วไป',
 'ติดต่องาน กยศ. ของ มทร.ศรีวิชัย ได้อย่างไร?',
 'สามารถติดต่อสอบถามงาน กยศ. ของมหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย ได้ที่:
- กองพัฒนานักศึกษา มทร.ศรีวิชัย
- โทรศัพท์: ติดต่อผ่านสายหลักของมหาวิทยาลัย
- เว็บไซต์: www.rmutsv.ac.th
- หรือติดต่อ กยศ. Call Center โทร 0-2016-4888

**หมายเหตุ:** กรุณาตรวจสอบข้อมูลล่าสุดจากประกาศของมหาวิทยาลัยโดยตรง เนื่องจากข้อมูลอาจมีการเปลี่ยนแปลง'),

('ประเภทการกู้ กยศ.', 'คุณสมบัติ',
 'กยศ. มีกี่ลักษณะ อะไรบ้าง?',
 'กองทุน กยศ. มีลักษณะการกู้ยืม 4 ลักษณะ:
1. ลักษณะที่ 1: ผู้ขาดแคลนทุนทรัพย์ (รายได้ครอบครัวไม่เกิน 360,000 บาท/ปี)
2. ลักษณะที่ 2: ศึกษาในสาขาวิชาที่เป็นความต้องการหลัก (ไม่จำกัดรายได้)
3. ลักษณะที่ 3: ศึกษาในสาขาวิชาขาดแคลน (ไม่จำกัดรายได้)
4. ลักษณะที่ 4: เรียนดีเพื่อสร้างความเป็นเลิศ (ผลการเรียนเฉลี่ยสะสมไม่ต่ำกว่า 3.00)

นักศึกษาสามารถกู้ได้มากกว่า 1 ลักษณะพร้อมกัน หากมีคุณสมบัติครบถ้วน'),

('จิตอาสา กยศ.', 'คุณสมบัติ',
 'ผู้กู้ กยศ. ต้องทำกิจกรรมจิตอาสาหรือไม่?',
 'ใช่ ผู้กู้ยืม กยศ. ต้องทำกิจกรรมจิตอาสาไม่น้อยกว่า 36 ชั่วโมง ต่อปีการศึกษา โดยต้องบันทึกกิจกรรมในสมุดบันทึกกิจกรรมจิตอาสา และแนบหลักฐานในระบบ DSL เมื่อยื่นกู้ กิจกรรมจิตอาสาต้องเป็นกิจกรรมที่ไม่ได้รับค่าตอบแทน และเป็นประโยชน์ต่อสังคม/ชุมชน'),

('วงเงินกู้', 'ข้อมูลทั่วไป',
 'กู้ กยศ. ได้สูงสุดเท่าไร?',
 'วงเงินกู้ยืม กยศ. แบ่งเป็น:
1. ค่าเล่าเรียน: ตามอัตราที่กองทุนกำหนดในแต่ละหลักสูตร/สถานศึกษา
2. ค่าใช้จ่ายที่เกี่ยวเนื่องกับการศึกษา: ตามที่กองทุนกำหนด
3. ค่าครองชีพ: ไม่เกิน 3,000 บาท/เดือน (เฉพาะลักษณะที่ 1 ผู้ขาดแคลนทุนทรัพย์)

วงเงินรวมสูงสุดขึ้นอยู่กับระดับการศึกษาและสาขาวิชา กรุณาตรวจสอบกับงาน กยศ. ของสถานศึกษา');
