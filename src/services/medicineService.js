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

export const getMedicines = async (familyId, filters = {}) => {
  try {
    let query = supabase
      .from('medicines')
      .select('*, reminders(id, scheduled_time, is_active), profiles:assigned_to(full_name, avatar_url)')
      .order('created_at', { ascending: false });

    if (familyId) query = query.eq('family_id', familyId);

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
    const { data, error } = await supabase.from('medicines').insert(medicineData).select('*').single();
    if (error) throw error;
    return handleServiceSuccess(data);
  } catch (error) {
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
    let query = supabase
      .from('medicines')
      .select('*')
      .filter('stock_count', 'lte', 'low_stock_threshold');
      
    if (familyId) query = query.eq('family_id', familyId);
    
    const { data, error } = await query;
    if (error) throw error;
    return handleServiceSuccess(data || []);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const searchMedicines = async (familyId, query) => getMedicines(familyId, { search: query });
