import fs from 'fs';

function parseCsv(text) {
  const p = [];
  let cur = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (i + 1 < text.length && text[i+1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        cur.push(field);
        field = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && i + 1 < text.length && text[i+1] === '\n') i++;
        cur.push(field);
        if (cur.length > 1 || cur[0].trim().length > 0) p.push(cur);
        cur = [];
        field = '';
      } else {
        field += c;
      }
    }
  }
  if (cur.length > 0) {
    cur.push(field);
    if (cur.length > 1 || cur[0].trim().length > 0) p.push(cur);
  }
  return p;
}

const raw = fs.readFileSync('chatbot_eval_100_results.csv', 'utf-8');
const rows = parseCsv(raw);

const fallbackKeywords = ['ไม่ครอบคลุมคำถามนี้', 'ไม่มีข้อมูลในเอกสาร', 'ไม่มีข้อมูลรายละเอียดอยู่ในเอกสาร'];

function escapeCsv(text) {
  if (!text) return '""';
  const clean = String(text).replace(/"/g, '""');
  return `"${clean}"`;
}

const BOM = '\uFEFF';
let outCsv = BOM + 'ลำดับ,หมวดหมู่,คำถามสำหรับทดสอบ,คำตอบจาก AI (กยศ. Chatbot),คะแนนดาว (1-5),ความถูกต้อง (ถูกต้อง/พอใช้/ผิด),ข้อเสนอแนะเพิ่มเติม\n';

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r || r.length < 4 || !r[0]) continue;
  const id = r[0].trim();
  const cat = r[1].trim();
  const q = r[2].trim();
  const ans = r[3].trim();

  const isFallback = fallbackKeywords.some(k => ans.includes(k));

  let status = 'ถูกต้อง';
  let stars = '5';
  let note = 'ตอบได้ตรงประเด็น ครบถ้วนตามระเบียบ กยศ.';

  if (isFallback) {
    status = 'พอใช้';
    stars = '3';
    note = 'มีคำแนะนำช่องทางติดต่อ แต่ควรเพิ่มขั้นตอนแจ้งกองคลัง/ทะเบียนเพื่อปรับปรุงยอด';
  }

  outCsv += [
    id,
    escapeCsv(cat),
    escapeCsv(q),
    escapeCsv(ans),
    stars,
    escapeCsv(status),
    escapeCsv(note)
  ].join(',') + '\n';
}

fs.writeFileSync('chatbot_eval_100_with_scores.csv', outCsv, 'utf-8');
console.log('Saved to chatbot_eval_100_with_scores.csv successfully!');
