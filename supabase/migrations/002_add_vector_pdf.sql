-- =====================================================
-- Migration 002: Add Vector and documents RAG support
-- =====================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- 2. DOCUMENTS TABLE
-- Stores metadata about uploaded PDFs
-- =====================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Admins can manage documents
CREATE POLICY "Admins can manage documents"
  ON public.documents
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- Authenticated users can read documents
CREATE POLICY "Users can read documents"
  ON public.documents
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 3. DOCUMENT_CHUNKS TABLE
-- Stores extracted chunks of text from PDFs with vectors
-- =====================================================
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(3072) NOT NULL, -- Gemini "gemini-embedding-001" outputs 3072 dimensions by default
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Admins can manage document chunks
CREATE POLICY "Admins can manage document chunks"
  ON public.document_chunks
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- Authenticated users can read document chunks
CREATE POLICY "Users can read document chunks"
  ON public.document_chunks
  FOR SELECT TO authenticated
  USING (true);

-- Removed HNSW index since 3072 dimensions exceeds the max limit of 2000 for indices.
-- Sequential scan will be used instead, which is plenty fast up to thousands of chunks.

-- =====================================================
-- 4. FUNCTION TO SEARCH COMPATIBLE CHUNKS (RAG)
-- =====================================================
CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding vector(3072),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;
