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
    const { texts } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('GEMINI_API_KEY is not configured in Environment Variables');
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'texts must be a non-empty array of strings' });
    }

    // Limit maximum batch size
    if (texts.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 texts per embedding request' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

    // Generate embeddings in parallel to prevent Vercel Serverless timeout
    const embeddingPromises = texts.map(async (text) => {
      const sanitized = String(text || '').slice(0, 4000);
      const result = await model.embedContent(sanitized);
      return result.embedding.values;
    });

    const embeddings = await Promise.all(embeddingPromises);

    return res.status(200).json({ embeddings });

  } catch (error) {
    console.error('Gemini API Error in Embed Serverless Function:', error);
    return res.status(500).json({ error: 'Failed to generate embeddings' });
  }
}
