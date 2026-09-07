-- =====================================================
-- Migration 009: ยกเลิกระบบประเมินผลในเว็บ
--
-- การประเมินความถูกต้องของคำตอบ และการสำรวจความพึงพอใจ
-- ย้ายไปทำผ่านแบบฟอร์มภายนอก (เช่น Google Forms) จึงลบตารางระบบประเมินผลรุ่นเก่าออก
-- (DROP ... IF EXISTS จึงรันได้ปลอดภัยแม้จะไม่เคยสร้างตารางเหล่านี้)
--
-- ยังคงเก็บ:
--   - chat_histories.rating  (การให้ดาวคำตอบในหน้าแชท — migration 004/008)
--   - calendar_events        (migration 006)
-- =====================================================

DROP TABLE IF EXISTS public.eval_results CASCADE;
DROP TABLE IF EXISTS public.eval_runs CASCADE;
DROP TABLE IF EXISTS public.eval_questions CASCADE;
DROP TABLE IF EXISTS public.satisfaction_surveys CASCADE;
DROP TABLE IF EXISTS public.expert_reviews CASCADE;
