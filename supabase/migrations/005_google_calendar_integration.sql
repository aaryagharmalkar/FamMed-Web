CREATE TABLE IF NOT EXISTS public.google_tokens (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  expiry TIMESTAMPTZ,
  scope TEXT,
  email TEXT,
  calendar_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own google tokens" ON public.google_tokens;
CREATE POLICY "Users can read own google tokens" ON public.google_tokens
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own google tokens" ON public.google_tokens;
CREATE POLICY "Users can insert own google tokens" ON public.google_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own google tokens" ON public.google_tokens;
CREATE POLICY "Users can update own google tokens" ON public.google_tokens
  FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.reminders
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS event_id TEXT,
  ADD COLUMN IF NOT EXISTS date_time TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS reminders_user_id_idx ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS reminders_event_id_idx ON public.reminders(event_id);
CREATE INDEX IF NOT EXISTS reminders_date_time_idx ON public.reminders(date_time);
