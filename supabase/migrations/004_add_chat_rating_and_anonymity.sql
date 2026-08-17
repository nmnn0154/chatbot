-- Add rating column
ALTER TABLE public.chat_histories
ADD COLUMN IF NOT EXISTS rating SMALLINT CHECK (rating >= 1 AND rating <= 5);

-- Drop the old insert policy and create a new one that allows user_id to be NULL (Anonymous)
DROP POLICY IF EXISTS "Users can insert own chat history" ON public.chat_histories;

CREATE POLICY "Users can insert chat history (Anonymous allowed)"
  ON public.chat_histories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to update rating only if it hasn't been rated yet
CREATE POLICY "Users can rate unrated chat history"
  ON public.chat_histories FOR UPDATE
  TO authenticated
  USING (rating IS NULL)
  WITH CHECK (rating >= 1 AND rating <= 5);
