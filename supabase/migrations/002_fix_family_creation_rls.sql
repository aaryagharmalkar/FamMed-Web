-- Fix family creation RLS issues by using an atomic security-definer function.
-- This avoids two-step client inserts that conflict with family_members insert RLS.

-- Keep family insert strict and explicit.
DROP POLICY IF EXISTS "Authenticated users can create families" ON public.families;
CREATE POLICY "Authenticated users can create families" ON public.families
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND created_by = auth.uid()
  );

-- Ensure created_by is set from auth.uid() when omitted.
CREATE OR REPLACE FUNCTION public.set_family_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS families_set_created_by ON public.families;
CREATE TRIGGER families_set_created_by
BEFORE INSERT ON public.families
FOR EACH ROW
EXECUTE FUNCTION public.set_family_created_by();

-- Allow a newly-created family owner to add themselves as admin member.
DROP POLICY IF EXISTS "Admins can insert family_members" ON public.family_members;
CREATE POLICY "Admins can insert family_members" ON public.family_members
  FOR INSERT
  WITH CHECK (public.is_family_admin_or_caregiver(family_id));

DROP POLICY IF EXISTS "Owner can add self as first family member" ON public.family_members;
CREATE POLICY "Owner can add self as first family member" ON public.family_members
  FOR INSERT
  WITH CHECK (
    profile_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.families f
      WHERE f.id = family_id
        AND f.created_by = auth.uid()
    )
  );

-- Atomic family creation function for frontend use.
CREATE OR REPLACE FUNCTION public.create_family_with_admin_member(family_name TEXT)
RETURNS public.families
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  new_family public.families;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.families (name, created_by)
  VALUES (family_name, current_user_id)
  RETURNING * INTO new_family;

  INSERT INTO public.family_members (family_id, profile_id, role)
  VALUES (new_family.id, current_user_id, 'admin')
  ON CONFLICT (family_id, profile_id) DO NOTHING;

  RETURN new_family;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_family_with_admin_member(TEXT) TO authenticated;
