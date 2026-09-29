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

// ตัด header ออก
const questions = [];
for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',');
  if (parts.length >= 3) {
    const id = parts[0].trim();
    const category = parts[1].trim();
    // ส่วนคำถามอาจมีเครื่องหมายคำพูด
    const question = parts.slice(2, parts.length - 1).join(',').replace(/^"|"$/g, '').trim();
    questions.push({ id, category, question });
  }
}

console.log(`Loaded ${questions.length} questions. Starting evaluation run...`);

const outputPath = path.resolve('chatbot_eval_100_results.csv');

// เตรียม Header แบบ UTF-8 BOM
const BOM = '\uFEFF';
const header = 'ลำดับ,หมวดหมู่,คำถามสำหรับทดสอบ,คำตอบจาก AI (กยศ. Chatbot),คะแนนดาว (1-5),ความถูกต้อง (ถูกต้อง/พอใช้/ผิด),ข้อเสนอแนะเพิ่มเติม\n';
fs.writeFileSync(outputPath, BOM + header, 'utf-8');

function escapeCsv(text) {
  if (!text) return '""';
  const clean = text.replace(/"/g, '""');
  return `"${clean}"`;
}

async function run() {
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

    const row = [
      item.id,
      escapeCsv(item.category),
      escapeCsv(q),
      escapeCsv(answer),
      '', // คะแนนดาว
      '', // ความถูกต้อง
      ''  // ข้อเสนอแนะ
    ].join(',') + '\n';

    fs.appendFileSync(outputPath, row, 'utf-8');

    // หน่วงเวลาเล็กน้อย 800ms เพื่อป้องกัน Rate limit
    await new Promise(r => setTimeout(r, 800));
  }

  console.log(`\nAll ${questions.length} questions completed! Saved to ${outputPath}`);
}

run().catch(console.error);
