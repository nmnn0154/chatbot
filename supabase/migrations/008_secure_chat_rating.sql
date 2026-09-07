-- =====================================================
-- Migration 008: ปิดช่องโหว่การให้คะแนนบทสนทนา
--
-- ปัญหาเดิม (migration 004): policy "Users can rate unrated chat history"
-- อนุญาตให้ผู้ใช้ที่ล็อกอิน UPDATE แถวใดก็ได้ที่ rating เป็น NULL และ
-- WITH CHECK ตรวจแค่ช่วงค่า rating จึงเขียนทับคอลัมน์อื่น (เช่น bot_response) ได้
--
-- แก้ไข: ยกเลิกสิทธิ์ UPDATE ตรง ๆ แล้วให้ให้คะแนนผ่านฟังก์ชัน SECURITY DEFINER
-- ที่แตะเฉพาะคอลัมน์ rating และเฉพาะแถวที่ยังไม่เคยให้คะแนน
-- =====================================================

DROP POLICY IF EXISTS "Users can rate unrated chat history" ON public.chat_histories;

CREATE OR REPLACE FUNCTION public.rate_chat_response(p_id UUID, p_rating SMALLINT)
RETURNS VOID AS $$
BEGIN
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'rating must be between 1 and 5';
  END IF;

  UPDATE public.chat_histories
     SET rating = p_rating
   WHERE id = p_id
     AND rating IS NULL
     AND created_at > NOW() - INTERVAL '2 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.rate_chat_response(UUID, SMALLINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rate_chat_response(UUID, SMALLINT) TO authenticated;
