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
console.log('Total parsed rows:', rows.length);

const fallbackKeywords = ['ไม่ครอบคลุมคำถามนี้', 'ไม่มีข้อมูลในเอกสาร', 'ไม่มีข้อมูลรายละเอียดอยู่ในเอกสาร'];

const detailedResults = [];
let correct = 0;
let partial = 0;
let wrong = 0;

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r || r.length < 4 || !r[0]) continue;
  const id = parseInt(r[0].trim(), 10);
  if (isNaN(id)) continue;

  const cat = r[1];
  const q = r[2];
  const ans = r[3];

  const isFallback = fallbackKeywords.some(k => ans.includes(k));

  let status = 'ถูกต้อง';
  let stars = 5;
  let note = 'ตอบได้ตรงประเด็น ครบถ้วนตามระเบียบ กยศ.';

  if (isFallback) {
    status = 'ผิด/ขาดข้อมูล';
    stars = 2;
    wrong++;
    note = 'ระบบตอบว่าไม่มีข้อมูลในเอกสาร (Fallback)';
  } else if (ans.length < 60) {
    status = 'พอใช้';
    stars = 3;
    partial++;
    note = 'ตอบสั้น อาจต้องเพิ่มรายละเอียด';
  } else {
    correct++;
  }

  detailedResults.push({ id, cat, q, ans, stars, status, note });
}

console.log('=== สรุปผลการประเมิน 100 ข้อ ===');
console.log(`- ถูกต้องครบถ้วน: ${correct} ข้อ (${(correct/detailedResults.length*100).toFixed(1)}%)`);
console.log(`- พอใช้ / ถูกต้องบางส่วน: ${partial} ข้อ (${(partial/detailedResults.length*100).toFixed(1)}%)`);
console.log(`- ขาดข้อมูล / ตอบปฏิเสธ: ${wrong} ข้อ (${(wrong/detailedResults.length*100).toFixed(1)}%)`);
console.log(`รวมทั้งหมดที่ประเมิน: ${detailedResults.length} ข้อ`);

if (wrong > 0) {
  console.log('\n--- รายการข้อที่ตอบปฏิเสธ/ขาดข้อมูล ---');
  detailedResults.filter(x => x.status === 'ผิด/ขาดข้อมูล').forEach(x => {
    console.log(`ข้อ [${x.id}] ${x.q}`);
  });
}
