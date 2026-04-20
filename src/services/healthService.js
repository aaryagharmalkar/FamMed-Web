import { supabase } from '../lib/supabaseClient';
import { uploadFile, getSignedUrl } from './storageService';
import { handleServiceError, handleServiceSuccess } from './serviceHelpers';

export const getHealthRecords = async (profileId, filters = {}) => {
  try {
    let query = supabase
      .from('health_records')
      .select('*')
      .eq('profile_id', profileId)
      .order('recorded_date', { ascending: false });

    if (filters.type) query = query.eq('record_type', filters.type);
    if (filters.search) query = query.or(`title.ilike.%${filters.search}%,doctor_name.ilike.%${filters.search}%,hospital_name.ilike.%${filters.search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return handleServiceSuccess(data || []);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const addHealthRecord = async (recordData) => {
  try {
    const { data, error } = await supabase.from('health_records').insert(recordData).select('*').single();
    if (error) throw error;
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const updateHealthRecord = async (id, updates) => {
  try {
    const { data, error } = await supabase.from('health_records').update(updates).eq('id', id).select('*').single();
    if (error) throw error;
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const deleteHealthRecord = async (id) => {
  try {
    const { error } = await supabase.from('health_records').delete().eq('id', id);
    if (error) throw error;
    return handleServiceSuccess(true);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const uploadHealthFile = async (file, profileId) => {
  try {
    if (!file) {
      throw new Error('Please select a file to upload.');
    }

    const ext = String(file.name || '').split('.').pop() || 'bin';
    const safeBaseName = String(file.name || 'record')
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .slice(0, 60);
    const path = `${profileId}/records/${Date.now()}-${safeBaseName}.${ext}`;
    const uploadResult = await uploadFile('health-files', path, file, { cacheControl: '3600' });
    if (uploadResult.error) throw uploadResult.error;

    const urlResult = await getSignedUrl('health-files', path, 60 * 60 * 24 * 7);
    if (urlResult.error) throw urlResult.error;

    return handleServiceSuccess({ path, url: urlResult.data });
  } catch (error) {
    return handleServiceError(error);
  }
};

export const getHealthRecordsByType = async (profileId, type) => getHealthRecords(profileId, { type });

export const searchHealthRecords = async (profileId, query) => getHealthRecords(profileId, { search: query });
