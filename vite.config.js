import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// Custom Vite plugin to handle Gemini API proxy during local development
// This mimics the behavior of Vercel Serverless Functions
const chatPlugin = () => ({
  name: 'chat-plugin',
  configureServer(server) {
    server.middlewares.use('/api/chat', async (req, res, next) => {
      // Only handle POST requests to /api/chat
      if (req.method !== 'POST') return next();

      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const { message, context } = JSON.parse(body || '{}');

          if (!message || typeof message !== 'string' || message.trim().length === 0) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Message is required' }));
          }

          const apiKey = process.env.GEMINI_API_KEY;

          if (!apiKey) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Gemini API key missing' }));
          }

          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

          let systemPrompt = `คุณคือผู้ช่วย AI ชื่อ "กยศ. Chatbot" ของ มทร.ศรีวิชัย
หน้าที่ของคุณคือตอบคำถามเกี่ยวกับกองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.) โดยวิเคราะห์จากข้อมูลอ้างอิงจากเอกสารที่ให้มา
พยายามตอบคำถามอย่างละเอียด ครบถ้วน และแม่นยำที่สุด โดยดึงข้อมูลที่เกี่ยวข้องจากเอกสารมาอธิบายให้ผู้ใช้เข้าใจ
หากผู้ใช้พิมพ์มาสั้นๆ เป็นคีย์เวิร์ด (เช่น "เอกสาร", "คุณสมบัติ", "ขั้นตอน") ให้สันนิษฐานว่าผู้ใช้อยากทราบข้อมูลที่เกี่ยวข้องกับคีย์เวิร์ดนั้นในบริบทของ กยศ. และให้สรุปข้อมูลที่เกี่ยวข้องทั้งหมดมาเสนอเลย ไม่ต้องปฏิเสธ
หากถามนอกเรื่อง ให้บอกปัดอย่างสุภาพและพาผู้ใช้กลับสู่เรื่อง กยศ.
หากคำถามหรือคีย์เวิร์ดนั้นไม่มีข้อมูลเกี่ยวข้องในเอกสารเลยจริงๆ (และไม่ใช่คำทักทาย) ให้ตอบว่า "ขออภัยครับ ข้อมูลในเอกสารที่ผมมีไม่ครอบคลุมคำถามนี้ กรุณาติดต่อกองพัฒนานักศึกษา มทร.ศรีวิชัย หรือ กยศ. Call Center 0-2016-4888"
ตอบด้วยภาษาที่สุภาพ เป็นคำแนะนำที่ชัดเจน และจัดรูปแบบด้วย markdown (เช่น ใช้ bullet points หรือตัวหนา) เพื่อให้อ่านง่าย

เนื้อหาอ้างอิงจากเอกสาร:\n`;
          if (context && Array.isArray(context) && context.length > 0) {
            context.forEach((c, idx) => {
              if (c?.answer) {
                systemPrompt += `[ส่วนที่ ${idx + 1}]:\n${c.answer}\n\n`;
              }
            });
          }

          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: message.trim() }] }],
            systemInstruction: systemPrompt,
          });

          const response = result.response.text();
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ response }));

        } catch (error) {
          console.error('[Gemini Chat API Proxy Error]:', error.message || error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          let errorMsg = 'Failed to generate response';
          const errStr = String(error.message || error);
          if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('RESOURCE_EXHAUSTED')) {
            errorMsg = 'โควต้า API หมดแล้วครับ (Free Tier จำกัด 20 requests/วัน) กรุณารอวันถัดไป หรืออัปเกรดแผน API';
            res.statusCode = 429;
          }
          res.end(JSON.stringify({ error: errorMsg }));
        }
      });
    });

    server.middlewares.use('/api/embed', async (req, res, next) => {
      // Only handle POST requests to /api/embed
      if (req.method !== 'POST') return next();

      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const { texts } = JSON.parse(body || '{}');
          const apiKey = process.env.GEMINI_API_KEY;

          if (!apiKey) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Gemini API key missing' }));
          }

          if (!texts || !Array.isArray(texts) || texts.length === 0) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'texts must be a non-empty array of strings' }));
          }

          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

          const embeddingPromises = texts.map(async (text) => {
            const sanitized = String(text || '').slice(0, 4000);
            const result = await model.embedContent(sanitized);
            return result.embedding.values;
          });

          const embeddings = await Promise.all(embeddingPromises);

          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ embeddings }));

        } catch (error) {
          console.error('[Gemini Embed API Proxy Error]:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Failed to generate embeddings' }));
        }
      });
    });
  }
});

export default defineConfig({
  plugins: [react(), chatPlugin()],
  server: {
    port: 5173,
  }
});
