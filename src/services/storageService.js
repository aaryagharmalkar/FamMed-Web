import { supabase } from '../lib/supabaseClient';
import { handleServiceError, handleServiceSuccess } from './serviceHelpers';

export const uploadFile = async (bucket, path, file, options = {}) => {
  try {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
      ...options,
    });
    if (error) throw error;
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const downloadFile = async (bucket, path) => {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error) throw error;
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const deleteFile = async (bucket, path) => {
  try {
    const { data, error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const getSignedUrl = async (bucket, path, expiresIn = 3600) => {
  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error) throw error;
    return handleServiceSuccess(data?.signedUrl || null);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const listFiles = async (bucket, folder = '') => {
  try {
    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit: 200,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw error;
    return handleServiceSuccess(data || []);
  } catch (error) {
    return handleServiceError(error);
  }
};
