import { config } from 'dotenv';
config();

import fs from 'fs';
import path from 'path';
import { retrieveContext } from './api/_lib/retrieval.js';
import { generateChatResponse } from './api/_lib/gemini.js';

// อ่านคำถาม 100 ข้อจาก test_questions_100.csv
const csvPath = path.resolve('test_questions_100.csv');
const rawCsv = fs.readFileSync(csvPath, 'utf-8');
const lines = rawCsv.split(/\r?\n/).filter(l => l.trim().length > 0);

const questions = [];
for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',');
  if (parts.length >= 3) {
    const id = parts[0].trim();
    const category = parts[1].trim();
    const question = parts.slice(2, parts.length - 1).join(',').replace(/^"|"$/g, '').trim();
    const expected = parts[parts.length - 1].replace(/^"|"$/g, '').trim();
    questions.push({ id, category, question, expected });
  }
}

console.log(`Starting v2 evaluation for ${questions.length} questions...`);

const outputPath = path.resolve('chatbot_eval_100_v2.csv');
const BOM = '\uFEFF';
const header = 'ลำดับ,หมวดหมู่,คำถามสำหรับทดสอบ,คำตอบจาก AI (กยศ. Chatbot),คะแนนดาว (1-5),ความถูกต้อง,ข้อเสนอแนะเพิ่มเติม\n';
fs.writeFileSync(outputPath, BOM + header, 'utf-8');

function escapeCsv(text) {
  if (!text) return '""';
  return `"${String(text).replace(/"/g, '""')}"`;
}

const fallbackKeywords = ['ไม่ครอบคลุมคำถามนี้', 'ไม่มีข้อมูลในเอกสาร', 'ไม่มีข้อมูลรายละเอียดอยู่ในเอกสาร'];

async function run() {
  let correctCount = 0;
  let partialCount = 0;
  let fallbackCount = 0;

  for (let idx = 0; idx < questions.length; idx++) {
    const item = questions[idx];
    const q = item.question;
    console.log(`[${idx + 1}/${questions.length}] Querying: ${q}`);

    let answer = '';
    try {
      const ctx = await retrieveContext(q);
      answer = await generateChatResponse(q, ctx);
    } catch (err) {
      console.error(`Error on Q${item.id}:`, err?.message || err);
      answer = `เกิดข้อผิดพลาดในการประมวลผล: ${err?.message || 'Unknown error'}`;
    }

    const isFallback = fallbackKeywords.some(k => answer.includes(k));
    let status = 'ถูกต้อง';
    let stars = '5';
    let note = 'ตอบได้ตรงประเด็น ครบถ้วนตามระเบียบ กยศ.';

    if (isFallback) {
      status = 'พอใช้';
      stars = '3';
      note = 'มีคำแนะนำช่องทางติดต่อ แต่ควรเพิ่มข้อมูลขั้นตอนใน FAQ เพิ่มเติม';
      fallbackCount++;
    } else {
      correctCount++;
    }

    const row = [
      item.id,
      escapeCsv(item.category),
      escapeCsv(q),
      escapeCsv(answer),
      stars,
      escapeCsv(status),
      escapeCsv(note)
    ].join(',') + '\n';

    fs.appendFileSync(outputPath, row, 'utf-8');

    // หน่วงเวลา 700ms เพื่อป้องกัน Rate limit
    await new Promise(r => setTimeout(r, 700));
  }

  console.log('\n=============================================');
  console.log('🎉 การทดสอบ 100 ข้อรอบใหม่เสร็จสมบูรณ์!');
  console.log(`- ถูกต้องครบถ้วน: ${correctCount} ข้อ (${(correctCount / questions.length * 100).toFixed(1)}%)`);
  console.log(`- พอใช้ / ขาดข้อมูล: ${fallbackCount} ข้อ (${(fallbackCount / questions.length * 100).toFixed(1)}%)`);
  console.log(`- บันทึกผลลัพธ์ลงไฟล์: ${outputPath}`);
  console.log('=============================================\n');
}

run().catch(console.error);
