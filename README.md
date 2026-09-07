# กยศ. Chatbot — มทร.ศรีวิชัย

ระบบแชตบอตให้บริการข้อมูลข่าวสารและตอบข้อซักถามเกี่ยวกับกองทุนเงินให้กู้ยืม
เพื่อการศึกษา (กยศ.) ของมหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย (โครงงานปริญญานิพนธ์)

การประเมินความถูกต้องของคำตอบและความพึงพอใจของผู้ใช้งาน ดำเนินการผ่านแบบฟอร์ม
ภายนอก (ไม่อยู่ในเว็บแอปนี้) — ผู้ดูแลระบบส่งออกประวัติแชทเป็น CSV จากหน้าแดชบอร์ดได้

## สถาปัตยกรรม

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | React 19 + Vite 8, React Router 7 |
| Backend | Vercel Serverless Functions (`api/`) — dev ใช้ Vite middleware จำลอง |
| ฐานข้อมูล / Auth | Supabase (Postgres + `pgvector`, RLS, Google OAuth) |
| โมเดล AI | Google Gemini — chat + embedding (RAG) |
| ประมวลผล PDF | `pdfjs-dist` (แยกข้อความ + chunk ฝั่ง browser) |

### การทำงานของ RAG

1. ผู้ใช้ส่งคำถาม → `POST /api/chat` (แนบ Supabase JWT)
2. เซิร์ฟเวอร์สร้าง embedding ของคำถาม แล้วค้น `document_chunks` ผ่าน RPC
   `match_document_chunks` (อยู่ภายใต้ RLS ของผู้ใช้)
3. นำ chunk ที่เกี่ยวข้องมาประกอบเป็น context ส่งให้ Gemini สร้างคำตอบ
4. บันทึกประวัติการสนทนาแบบไม่ระบุตัวตน (`chat_histories.user_id = null`)

โค้ดหลักอยู่ที่ [`api/_lib/`](api/_lib/) และใช้ร่วมกันทั้ง production และ dev.

## การติดตั้ง

```bash
npm install
cp .env.example .env   # แล้วกรอกค่าจริง
npm run dev            # http://localhost:5173
```

### ตัวแปรสภาพแวดล้อม

ดู [`.env.example`](.env.example) — สรุป:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — ฝั่ง client
- `GEMINI_API_KEY` — **ฝั่งเซิร์ฟเวอร์เท่านั้น** (ห้ามขึ้นต้นด้วย `VITE_`)
- `GEMINI_CHAT_MODEL` / `GEMINI_EMBED_MODEL` — override ชื่อโมเดล (ไม่บังคับ)

### ฐานข้อมูล

รัน migration ใน [`supabase/migrations/`](supabase/migrations/) ตามลำดับผ่าน
Supabase SQL Editor:

| ไฟล์ | เนื้อหา |
|---|---|
| `001_initial_schema.sql` | profiles, knowledge_base, chat_histories, RLS, seed FAQ |
| `002_add_vector_pdf.sql` | pgvector, documents, document_chunks, `match_document_chunks` |
| `003_faq_table.sql` | ตาราง faqs + `increment_faq_usage` |
| `004_add_chat_rating_and_anonymity.sql` | คอลัมน์ rating + policy สนทนาไม่ระบุตัวตน |
| `005_add_announcements.sql` | ตาราง announcements + storage bucket `news-images` (รูปประกอบข่าว) |
| `006_add_calendar.sql` | ปฏิทินการดำเนินงานประจำปีการศึกษา |
| `008_secure_chat_rating.sql` | ปิดช่องโหว่ RLS การให้คะแนน — ให้คะแนนผ่านฟังก์ชัน `rate_chat_response` |
| `009_drop_evaluation.sql` | ลบตารางระบบประเมินผลรุ่นเก่า (ย้ายไปทำผ่านฟอร์มภายนอก) — ปลอดภัยแม้ไม่เคยสร้างตาราง |

หลังรัน `005` ต้องสร้าง bucket ชื่อ `news-images` (ติ๊ก Public) ในเมนู Storage ของ Supabase

### กำหนดสิทธิ์ผู้ดูแลระบบ

```sql
update public.profiles set role = 'admin' where id = '<user-uuid>';
```

## สคริปต์

| คำสั่ง | หน้าที่ |
|---|---|
| `npm run dev` | เซิร์ฟเวอร์พัฒนา + จำลอง `/api/*` |
| `npm run build` | build production ไป `dist/` |
| `npm run preview` | พรีวิว build |
| `npm run lint` | oxlint |

## Deploy (Vercel)

1. เชื่อม repo กับ Vercel — ตรวจ preset เป็น **Vite**
2. ตั้ง Environment Variables ทั้งหมดจาก `.env.example` (รวม `GEMINI_API_KEY`)
3. ฟังก์ชันใน `api/` จะถูก deploy เป็น Serverless Functions อัตโนมัติที่ `/api/*`

## หมายเหตุด้านความปลอดภัย

- `GEMINI_API_KEY` เคยถูก commit ในประวัติ git ช่วงแรก — **ควร rotate key**
  ที่ Google AI Studio ก่อนเปิดใช้งานจริง
- `chat_histories` ถูกบันทึกแบบไม่ระบุตัวตนโดยตั้งใจ (ไม่มี `user_id`)
- rate limiting ปัจจุบันเป็นแบบ in-memory ต่อ instance — production ควรใช้
  Upstash Redis หรือเก็บใน DB
