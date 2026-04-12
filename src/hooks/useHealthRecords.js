import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  addHealthRecord,
  deleteHealthRecord,
  getHealthRecords,
  getHealthRecordsByType,
  uploadHealthFile,
} from '../services/healthService';

export const useHealthRecords = (profileId, filters = {}) =>
  useQuery({
    queryKey: ['health-records', profileId, filters],
    queryFn: async () => {
      const { data, error } = await getHealthRecords(profileId, filters);
      if (error) throw error;
      return data;
    },
    enabled: Boolean(profileId),
  });

export const useUploadHealthRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, profileId, recordData, onProgress }) => {
      onProgress?.(20);
      const fileRes = await uploadHealthFile(file, profileId);
      if (fileRes.error) throw fileRes.error;

      onProgress?.(70);
      const createRes = await addHealthRecord({
        ...recordData,
        profile_id: profileId,
        file_url: fileRes.data.url,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      });
      if (createRes.error) throw createRes.error;

      onProgress?.(100);
      return createRes.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['health-records', vars.profileId] });
      toast.success('Record uploaded');
    },
    onError: (error) => toast.error(error.message || 'Upload failed'),
  });
};

export const useDeleteHealthRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }) => {
      const { data, error } = await deleteHealthRecord(id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-records'] });
      toast.success('Record deleted');
    },
    onError: (error) => toast.error(error.message || 'Delete failed'),
  });
};

export const useHealthRecordsByType = (profileId, type) =>
  useQuery({
    queryKey: ['health-records', profileId, type],
    queryFn: async () => {
      const { data, error } = await getHealthRecordsByType(profileId, type);
      if (error) throw error;
      return data;
    },
    enabled: Boolean(profileId && type),
  });
