import { supabase } from '../lib/supabaseClient';
import { uploadFile, getSignedUrl } from './storageService';
import { handleServiceError, handleServiceSuccess } from './serviceHelpers';

const withTimeout = (promise, timeoutMs = 12000, message = 'Request timed out') =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);

const insertMedicineViaRest = async (medicineData, timeoutMs = 12000) => {
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
    const response = await fetch(`${supabaseUrl}/rest/v1/medicines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${session.access_token}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(medicineData),
      signal: controller.signal,
    });

    const raw = await response.text();
    const parsed = raw ? JSON.parse(raw) : null;

    if (!response.ok) {
      const message = parsed?.message || parsed?.error || `Save medicine failed (${response.status})`;
      throw new Error(message);
    }

    if (!Array.isArray(parsed) || !parsed[0]) {
      throw new Error('Medicine saved but no row was returned.');
    }

    return parsed[0];
  } finally {
    clearTimeout(timer);
  }
};

export const getMedicines = async (familyId, filters = {}) => {
  try {
    let query = supabase
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
    const { data, error } = await supabase
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
    const data = await insertMedicineViaRest(medicineData, 12000);
    return handleServiceSuccess(data);
  } catch (error) {
    if (error?.name === 'AbortError') {
      return handleServiceError(new Error('Save medicine timed out. Check Supabase connection and try again.'));
    }
    return handleServiceError(error);
  }
};

export const updateMedicine = async (id, updates) => {
  try {
    const { data, error } = await supabase.from('medicines').update(updates).eq('id', id).select('*').single();
    if (error) throw error;
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const deleteMedicine = async (id) => {
  try {
    const { error } = await supabase.from('medicines').delete().eq('id', id);
    if (error) throw error;
    return handleServiceSuccess(true);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const updateStockCount = async (id, newCount) => updateMedicine(id, { stock_count: newCount });

export const uploadPrescription = async (medicineId, file) => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
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
    const { data, error } = await supabase
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
