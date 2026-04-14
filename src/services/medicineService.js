import { supabase, supabaseConfigError } from '../lib/supabaseClient';
import { uploadFile, getSignedUrl } from './storageService';
import { handleServiceError, handleServiceSuccess } from './serviceHelpers';

const withTimeout = (promiseOrFactory, timeoutMs = 20000, message = 'Request timed out') => {
  let timeoutId;
  const promise = typeof promiseOrFactory === 'function' ? promiseOrFactory() : promiseOrFactory;

  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
};

const ensureSupabaseClient = () => {
  if (!supabase) {
    throw new Error(supabaseConfigError || 'Supabase client is not configured.');
  }
  return supabase;
};

const verifyConnection = async (client) => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('You appear to be offline. Reconnect to the internet and try again.');
  }

  try {
    await withTimeout(
      client.auth.getSession(),
      10000,
      'Could not connect to Supabase auth. Check internet connection.'
    );
  } catch (error) {
    // Soft fail: log but don't block the operation—actual DB errors will surface below
    console.warn('Supabase preflight check failed (non-blocking):', error.message);
  }
};

export const getMedicines = async (familyId, filters = {}) => {
  try {
    const client = ensureSupabaseClient();
    let query = client
      .from('medicines')
      .select('*, reminders(id, scheduled_time, is_active), profiles:assigned_to(full_name, avatar_url)')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false });

    if (filters.search) query = query.ilike('name', `%${filters.search}%`);
    if (filters.form) query = query.eq('form', filters.form);
    if (typeof filters.isActive === 'boolean') query = query.eq('is_active', filters.isActive);
    if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo);

    const { data, error } = await query;
    if (error) throw error;
    return handleServiceSuccess(data || []);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const getMedicineById = async (id) => {
  try {
    const client = ensureSupabaseClient();
    const { data, error } = await client
      .from('medicines')
      .select('*, reminders(*), profiles:assigned_to(full_name, avatar_url), reminder_logs(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const addMedicine = async (medicineData) => {
  try {
    const client = ensureSupabaseClient();
    await verifyConnection(client);

    const { data, error } = await withTimeout(
      client.from('medicines').insert(medicineData).select('*').single(),
      25000,
      'Save medicine timed out after 25 seconds. Check Supabase project status and network, then try again.'
    );

    if (error) throw error;
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};
export const updateMedicine = async (id, updates) => {
  try {
    const client = ensureSupabaseClient();
    const { data, error } = await client.from('medicines').update(updates).eq('id', id).select('*').single();
    if (error) throw error;
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};
export const deleteMedicine = async (id) => {
  try {
    const client = ensureSupabaseClient();
    const { error } = await client.from('medicines').delete().eq('id', id);
    if (error) throw error;
    return handleServiceSuccess(true);
  } catch (error) {
    return handleServiceError(error);
  }
};
export const updateStockCount = async (id, newCount) => updateMedicine(id, { stock_count: newCount });

export const uploadPrescription = async (medicineId, file) => {
  try {
    const client = ensureSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();
    if (userError) throw userError;

    const fileExt = file.name.split('.').pop();
    const path = `${user.id}/prescriptions/${medicineId}-${Date.now()}.${fileExt}`;

    const uploadResult = await uploadFile('health-files', path, file, { cacheControl: '3600' });
    if (uploadResult.error) throw uploadResult.error;

    const urlResult = await getSignedUrl('health-files', path, 60 * 60 * 24 * 7);
    if (urlResult.error) throw urlResult.error;

    const updateResult = await updateMedicine(medicineId, { prescription_url: urlResult.data });
    if (updateResult.error) throw updateResult.error;

    return handleServiceSuccess(updateResult.data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const getLowStockMedicines = async (familyId) => {
  try {
    const client = ensureSupabaseClient();
    const { data, error } = await client
      .from('medicines')
      .select('*')
      .eq('family_id', familyId)
      .filter('stock_count', 'lte', 'low_stock_threshold');
    if (error) throw error;
    return handleServiceSuccess(data || []);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const searchMedicines = async (familyId, query) => getMedicines(familyId, { search: query });
