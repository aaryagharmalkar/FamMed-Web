-- Sample seed data for local development only.
-- Run after at least one auth user exists and replace profile IDs as needed.

INSERT INTO public.families (id, name, created_by, invite_code)
VALUES ('11111111-1111-1111-1111-111111111111', 'Demo Family', NULL, 'DEMO2026')
ON CONFLICT (id) DO NOTHING;
