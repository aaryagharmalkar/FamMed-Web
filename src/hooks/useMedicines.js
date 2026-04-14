import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  addMedicine,
  deleteMedicine,
  getLowStockMedicines,
  getMedicineById,
  getMedicines,
  updateMedicine,
} from '../services/medicineService';

export const useMedicines = (familyId, filters = {}) =>
  useQuery({
    queryKey: ['medicines', familyId, filters],
    queryFn: async () => {
      const { data, error } = await getMedicines(familyId, filters);
      if (error) throw error;
      return data;
    },
    enabled: Boolean(familyId),
  });

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
  useQuery({
    queryKey: ['medicines', 'low-stock', familyId],
    queryFn: async () => {
      const { data, error } = await getLowStockMedicines(familyId);
      if (error) throw error;
      return data;
    },
    enabled: Boolean(familyId),
    refetchInterval: 60 * 1000,
  });
