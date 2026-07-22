import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Vercel Serverless Function to handle Gemini API Proxy in Production
 * Deployed automatically on Vercel at /api/chat
 */
export default async function handler(req, res) {
  // Allow only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, context } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('GEMINI_API_KEY is not configured in Vercel Environment Variables');
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // We use gemini-3.5-flash as it is fast and supports system instructions
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    let systemPrompt = `คุณคือผู้ช่วย AI ชื่อ "กยศ. Chatbot" ของ มทร.ศรีวิชัย
หน้าที่ของคุณคือตอบคำถามเกี่ยวกับกองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.) โดยวิเคราะห์จากข้อมูลอ้างอิงจากเอกสารที่ให้มา
พยายามตอบคำถามอย่างละเอียด ครบถ้วน และแม่นยำที่สุด โดยดึงข้อมูลที่เกี่ยวข้องจากเอกสารมาอธิบายให้ผู้ใช้เข้าใจ
หากผู้ใช้พิมพ์มาสั้นๆ เป็นคีย์เวิร์ด (เช่น "เอกสาร", "คุณสมบัติ", "ขั้นตอน") ให้สันนิษฐานว่าผู้ใช้อยากทราบข้อมูลที่เกี่ยวข้องกับคีย์เวิร์ดนั้นในบริบทของ กยศ. และให้สรุปข้อมูลที่เกี่ยวข้องทั้งหมดมาเสนอเลย ไม่ต้องปฏิเสธ
หากถามนอกเรื่อง ให้บอกปัดอย่างสุภาพและพาผู้ใช้กลับสู่เรื่อง กยศ.
หากคำถามหรือคีย์เวิร์ดนั้นไม่มีข้อมูลเกี่ยวข้องในเอกสารเลยจริงๆ (และไม่ใช่คำทักทาย) ให้ตอบว่า "ขออภัยครับ ข้อมูลในเอกสารที่ผมมีไม่ครอบคลุมคำถามนี้ กรุณาติดต่อกองพัฒนานักศึกษา มทร.ศรีวิชัย หรือ กยศ. Call Center 0-2016-4888"
ตอบด้วยภาษาที่สุภาพ เป็นคำแนะนำที่ชัดเจน และจัดรูปแบบด้วย markdown (เช่น ใช้ bullet points หรือตัวหนา) เพื่อให้อ่านง่าย

ข้อมูลอ้างอิงจากเอกสาร:\n`;
    
    if (context && context.length > 0) {
      context.forEach((c, idx) => {
        systemPrompt += `[ส่วนที่ ${idx + 1}]:\n${c.answer}\n\n`;
      });
    }

    // Call Gemini API
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: message }] }],
      systemInstruction: systemPrompt,
    });

    const response = result.response.text();
    return res.status(200).json({ response });

  } catch (error) {
    console.error('Gemini API Error in Serverless Function:', error);
    return res.status(500).json({ error: 'Failed to generate response' });
  }
}
