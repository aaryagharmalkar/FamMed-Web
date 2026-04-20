import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  addMedicine,
  addMedicinesBulk,
  deleteMedicine,
  getLowStockMedicines,
  getMedicineById,
  getMedicines,
  saveInsightsToMedicine,
  updateMedicine,
} from '../services/medicineService';
import { getMedicineInsightsFromGemini } from '../lib/ocrClient';

export const useMedicines = (familyId, filters = {}) =>
  {
    const query = useQuery({
    queryKey: ['medicines', familyId, filters],
    queryFn: async () => {
      const { data, error } = await getMedicines(familyId, filters);
      if (error) throw error;
      return data;
    },
    enabled: Boolean(familyId),
  });

    if (!familyId) {
      return {
        ...query,
        data: [],
        isLoading: false,
        error: new Error('No active family'),
      };
    }

    return query;
  };

export const useMedicine = (id) =>
  useQuery({
    queryKey: ['medicine', id],
    queryFn: async () => {
      const { data, error } = await getMedicineById(id);
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });

const SEVEN_DAYS_MS = 1000 * 60 * 60 * 24 * 7;

export const useMedicineInsights = ({ medicine, enabled = true }) =>
  useQuery({
    queryKey: ['medicine-insights', medicine?.id, medicine?.name, medicine?.dosage, medicine?.frequency],
    queryFn: async () => {
      const existingInsights = medicine?.ai_insights;
      const updatedAt = medicine?.ai_insights_updated_at ? new Date(medicine.ai_insights_updated_at) : null;
      const isFresh =
        Boolean(existingInsights) &&
        Boolean(updatedAt?.getTime()) &&
        Date.now() - updatedAt.getTime() < SEVEN_DAYS_MS;

      if (isFresh) {
        return { ...existingInsights, _source: 'cache' };
      }

      try {
        const insights = await getMedicineInsightsFromGemini({
          name: medicine?.name,
          dosage: medicine?.dosage,
          frequency: medicine?.frequency,
        });

        if (medicine?.id) {
          await saveInsightsToMedicine(medicine.id, insights);
        }

        return { ...insights, _source: 'gemini' };
      } catch {
        if (existingInsights) {
          return {
            ...existingInsights,
            _source: 'cache',
            _warning: 'AI insights unavailable. Showing saved medicine data only.',
          };
        }

        return {
          _source: 'fallback',
          _warning: 'AI insights unavailable. Showing saved medicine data only.',
        };
      }
    },
    enabled: Boolean(enabled && medicine?.name),
    staleTime: 1000 * 60 * 30,
    retry: 0,
  });

export const useAddMedicine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await addMedicine(payload);
      if (error) throw error;
      return data;
    },
    onMutate: async (newMedicine) => {
      await queryClient.cancelQueries({ queryKey: ['medicines', newMedicine.family_id] });
      const previous = queryClient.getQueryData(['medicines', newMedicine.family_id]);
      queryClient.setQueryData(['medicines', newMedicine.family_id], (old = []) => [{ ...newMedicine, id: `temp-${Date.now()}` }, ...old]);
      return { previous };
    },
    onError: (error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['medicines', variables.family_id], context.previous);
      }
      toast.error(error.message || 'Failed to add medicine');
    },
    onSuccess: (_, variables) => {
      toast.success('Medicine added');
      queryClient.invalidateQueries({ queryKey: ['medicines', variables.family_id] });
    },
  });
};

export const useBulkAddMedicines = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ medicines, familyId }) => {
      const { data, error } = await addMedicinesBulk(medicines);
      if (error) {
        console.error('[useBulkAddMedicines] Error:', error);
        throw error;
      }
      if (!data || !Array.isArray(data)) {
        throw new Error('Save returned invalid data.');
      }
      return data;
    },
    onError: (error) => {
      const msg = error?.message || 'Failed to save extracted medicines';
      console.error('[useBulkAddMedicines] onError:', msg);
      toast.dismiss();
      toast.error(msg);
    },
    onSuccess: (data, variables) => {
      if (variables?.familyId) {
        queryClient.invalidateQueries({ queryKey: ['medicines', variables.familyId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['medicines'] });
      }
      toast.dismiss();
      toast.success(`${data?.length || 0} medicine(s) saved`);
    },
  });
};

export const useUpdateMedicine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await updateMedicine(id, updates);
      if (error) throw error;
      return data;
    },
    onError: (error) => toast.error(error.message || 'Failed to update medicine'),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['medicines', data.family_id] });
      queryClient.invalidateQueries({ queryKey: ['medicine', data.id] });
      toast.success('Medicine updated');
    },
  });
};

export const useDeleteMedicine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }) => {
      if (!window.confirm('Delete this medicine?')) throw new Error('Cancelled');
      const { data, error } = await deleteMedicine(id);
      if (error) throw error;
      return data;
    },
    onError: (error) => {
      if (error.message !== 'Cancelled') toast.error(error.message || 'Failed to delete medicine');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
      toast.success('Medicine deleted');
    },
  });
};

export const useLowStockAlert = (familyId) =>
  {
    const query = useQuery({
    queryKey: ['medicines', 'low-stock', familyId],
    queryFn: async () => {
      const { data, error } = await getLowStockMedicines(familyId);
      if (error) throw error;
      return data;
    },
    enabled: Boolean(familyId),
    refetchInterval: 60 * 1000,
  });

    if (!familyId) {
      return {
        ...query,
        data: [],
        isLoading: false,
        error: new Error('No active family'),
      };
    }

    return query;
  };
