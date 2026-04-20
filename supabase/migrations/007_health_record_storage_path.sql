ALTER TABLE public.health_records
ADD COLUMN IF NOT EXISTS file_path TEXT;