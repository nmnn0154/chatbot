import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const key = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    console.error('No key'); return;
  }
  const genAI = new GoogleGenerativeAI(key);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    console.log('Chat Models: ', data.models.filter(m => m.supportedGenerationMethods.includes('generateContent')).map(m => m.name));
  } catch(e) {
    console.error('ERROR:', e.message);
  }
}
test();
