import { supabase } from '../lib/supabaseClient';
import { handleServiceError, handleServiceSuccess } from './serviceHelpers';

export const createFamily = async (name) => {
  try {
    if (!name || !String(name).trim()) {
      throw new Error('Family name is required');
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user?.id) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('create_family_with_admin_member', {
      family_name: String(name).trim(),
    });
    if (error) throw error;

    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const joinFamily = async (inviteCode) => {
  try {
    if (!inviteCode || !String(inviteCode).trim()) {
      throw new Error('Invite code is required');
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user?.id) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('join_family_with_invite', {
      input_invite_code: String(inviteCode).trim(),
    });
    if (error) throw error;

    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const getFamilyMembers = async (familyId) => {
  try {
    const { data, error } = await supabase
      .from('family_members')
      .select('*, profiles(id, full_name, avatar_url, role)')
      .eq('family_id', familyId);
    if (error) throw error;
    return handleServiceSuccess(data || []);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const updateMemberRole = async (familyId, profileId, role) => {
  try {
    const { data, error } = await supabase
      .from('family_members')
      .update({ role })
      .eq('family_id', familyId)
      .eq('profile_id', profileId)
      .select('*')
      .single();
    if (error) throw error;
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const removeMember = async (familyId, profileId) => {
  try {
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('family_id', familyId)
      .eq('profile_id', profileId);
    if (error) throw error;
    return handleServiceSuccess(true);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const getFamilyDetails = async (familyId) => {
  try {
    const { data, error } = await supabase.from('families').select('*').eq('id', familyId).single();
    if (error) throw error;
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const regenerateInviteCode = async (familyId) => {
  try {
    const newCode = Math.random().toString(36).slice(2, 10).toUpperCase();
    const { data, error } = await supabase
      .from('families')
      .update({ invite_code: newCode })
      .eq('id', familyId)
      .select('*')
      .single();
    if (error) throw error;
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const getUserFamilies = async (profileId) => {
  try {
    const { data, error } = await supabase
      .from('family_members')
      .select('family_id, role, joined_at, families(id, name, invite_code, created_by, created_at)')
      .eq('profile_id', profileId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return handleServiceSuccess(data || []);
  } catch (error) {
    return handleServiceError(error);
  }
};
