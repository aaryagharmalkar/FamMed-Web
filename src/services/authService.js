import { supabase } from '../lib/supabaseClient';
import { uploadFile, getSignedUrl } from './storageService';
import { handleServiceError, handleServiceSuccess } from './serviceHelpers';

export const signUp = async (email, password, fullName) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return handleServiceSuccess(true);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return handleServiceSuccess(data?.user ?? null);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const updateProfile = async (profileData) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', profileData.id)
      .select('*')
      .single();
    if (error) throw error;
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const uploadAvatar = async (file) => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const path = `${user.id}/avatar-${Date.now()}.${fileExt}`;
    const uploadResult = await uploadFile('health-files', path, file, { cacheControl: '3600' });
    if (uploadResult.error) throw uploadResult.error;

    const urlResult = await getSignedUrl('health-files', path, 60 * 60 * 24 * 7);
    if (urlResult.error) throw urlResult.error;

    const profileResult = await updateProfile({ id: user.id, avatar_url: urlResult.data });
    if (profileResult.error) throw profileResult.error;

    return handleServiceSuccess(profileResult.data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const resetPassword = async (email) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};
