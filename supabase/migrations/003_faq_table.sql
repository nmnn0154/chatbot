-- Create FAQs table
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Allow public read access (so any user can view FAQs)
CREATE POLICY "Allow public read access to faqs"
    ON public.faqs FOR SELECT
    USING (true);

-- Allow authenticated users to increment usage_count (this requires an update, but we only want to allow incrementing)
-- A simpler way is to use a DB RPC function for security, or just rely on RLS allowing update.
-- For a strict setup, we should create a function:
CREATE OR REPLACE FUNCTION increment_faq_usage(faq_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.faqs
  SET usage_count = usage_count + 1
  WHERE id = faq_id;
END;
$$;

-- Allow admin role to manage FAQs fully
CREATE POLICY "Allow admin full access to faqs"
    ON public.faqs FOR ALL
    USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );
