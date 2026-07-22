import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Vercel Serverless Function to handle Gemini Embedding API in Production
 * Deployed automatically on Vercel at /api/embed
 */
export default async function handler(req, res) {
  // Allow only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { texts } = req.body;
    let apiKey = process.env.GEMINI_API_KEY;
    
    // Fallback if there is an issue with parsing the env variable directly
    if (!apiKey && process.env.VITE_GEMINI_API_KEY) {
      apiKey = process.env.VITE_GEMINI_API_KEY;
    }

    if (!apiKey) {
      console.error('GEMINI_API_KEY is not configured in Environment Variables');
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    if (!texts || !Array.isArray(texts)) {
      return res.status(400).json({ error: 'texts must be an array of strings' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });

    // Generate embeddings for all texts
    const embeddings = [];
    for (const text of texts) {
      const result = await model.embedContent(text);
      embeddings.push(result.embedding.values);
    }

    return res.status(200).json({ embeddings });

  } catch (error) {
    console.error('Gemini API Error in Embed Serverless Function:', error);
    return res.status(500).json({ error: 'Failed to generate embeddings' });
  }
}
