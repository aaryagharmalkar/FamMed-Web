-- Fix join-family flow under RLS by using a security-definer RPC.

CREATE OR REPLACE FUNCTION public.join_family_with_invite(input_invite_code TEXT)
RETURNS public.family_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  target_family_id UUID;
  membership public.family_members;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT f.id
  INTO target_family_id
  FROM public.families f
  WHERE UPPER(f.invite_code) = UPPER(TRIM(input_invite_code))
  LIMIT 1;

  IF target_family_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  INSERT INTO public.family_members (family_id, profile_id, role)
  VALUES (target_family_id, current_user_id, 'member')
  ON CONFLICT (family_id, profile_id)
  DO UPDATE SET role = public.family_members.role
  RETURNING * INTO membership;

  RETURN membership;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_family_with_invite(TEXT) TO authenticated;
