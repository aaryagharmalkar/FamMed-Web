import { supabase } from '../lib/supabaseClient';
import { handleServiceError, handleServiceSuccess } from './serviceHelpers';

const withTimeout = (promise, timeoutMs = 20000, message = 'Request timed out') =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      promise.finally?.(() => clearTimeout(timer));
    }),
  ]);

export const uploadFile = async (bucket, path, file, options = {}) => {
  try {
    const { data, error } = await withTimeout(
      supabase.storage.from(bucket).upload(path, file, {
        upsert: true,
        ...options,
      }),
      30000,
      'Storage upload timed out. Please try again.'
    );
    if (error) throw error;
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const downloadFile = async (bucket, path) => {
  try {
    const { data, error } = await withTimeout(
      supabase.storage.from(bucket).download(path),
      20000,
      'Storage download timed out. Please try again.'
    );
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
    const { data, error } = await withTimeout(
      supabase.storage.from(bucket).createSignedUrl(path, expiresIn),
      20000,
      'Could not create a signed file URL in time.'
    );
    if (error) throw error;
    return handleServiceSuccess(data?.signedUrl || null);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const listFiles = async (bucket, folder = '') => {
  try {
    const { data, error } = await withTimeout(
      supabase.storage.from(bucket).list(folder, {
        limit: 200,
        sortBy: { column: 'name', order: 'asc' },
      }),
      20000,
      'Storage listing timed out. Please try again.'
    );
    if (error) throw error;
    return handleServiceSuccess(data || []);
  } catch (error) {
    return handleServiceError(error);
  }
};
