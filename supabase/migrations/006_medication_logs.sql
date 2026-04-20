DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'medication_status') THEN
    CREATE TYPE public.medication_status AS ENUM ('taken', 'missed', 'pending', 'rescheduled');
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  reminder_id UUID REFERENCES public.reminders(id) ON DELETE SET NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  status public.medication_status NOT NULL DEFAULT 'pending',
  taken_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS medication_logs_user_reminder_schedule_uidx
  ON public.medication_logs(user_id, reminder_id, scheduled_time);

CREATE INDEX IF NOT EXISTS medication_logs_user_time_idx
  ON public.medication_logs(user_id, scheduled_time DESC);

CREATE INDEX IF NOT EXISTS medication_logs_status_idx
  ON public.medication_logs(status);

ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own medication logs" ON public.medication_logs;
CREATE POLICY "Users can view own medication logs" ON public.medication_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own medication logs" ON public.medication_logs;
CREATE POLICY "Users can insert own medication logs" ON public.medication_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own medication logs" ON public.medication_logs;
CREATE POLICY "Users can update own medication logs" ON public.medication_logs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own medication logs" ON public.medication_logs;
CREATE POLICY "Users can delete own medication logs" ON public.medication_logs
  FOR DELETE USING (auth.uid() = user_id);
