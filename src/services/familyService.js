import { supabase } from '../lib/supabaseClient';
import { handleServiceError, handleServiceSuccess } from './serviceHelpers';

const withTimeout = (promise, timeoutMs = 12000, message = 'Request timed out') =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);

const callRpc = async (fnName, payload, timeoutMs = 12000) => {
  const {
    data: { session },
    error: sessionError,
  } = await withTimeout(supabase.auth.getSession(), timeoutMs, 'Unable to access auth session');

  if (sessionError) throw sessionError;
  if (!session?.access_token) throw new Error('Please sign in again.');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase environment variables are missing.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${fnName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const raw = await response.text();
    const parsed = raw ? JSON.parse(raw) : null;

    if (!response.ok) {
      const message = parsed?.message || parsed?.error || `RPC ${fnName} failed (${response.status})`;
      throw new Error(message);
    }

    return parsed;
  } finally {
    clearTimeout(timer);
  }
};

export const createFamily = async (name) => {
  try {
    if (!name || !String(name).trim()) {
      throw new Error('Family name is required');
    }

    const data = await callRpc('create_family_with_admin_member', {
      family_name: String(name).trim(),
    });

    return handleServiceSuccess(data);
  } catch (error) {
    if (error?.name === 'AbortError') {
      return handleServiceError(new Error('Create family timed out. Check internet/Supabase and try again.'));
    }
    return handleServiceError(error);
  }
};

export const joinFamily = async (inviteCode) => {
  try {
    if (!inviteCode || !String(inviteCode).trim()) {
      throw new Error('Invite code is required');
    }

    const data = await callRpc('join_family_with_invite', {
      input_invite_code: String(inviteCode).trim(),
    });

    return handleServiceSuccess(data);
  } catch (error) {
    if (error?.name === 'AbortError') {
      return handleServiceError(new Error('Join family timed out. Check internet/Supabase and try again.'));
    }
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
