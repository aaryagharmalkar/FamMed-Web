import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  createFamily,
  getFamilyDetails,
  getFamilyMembers,
  getUserFamilies,
  joinFamily,
  regenerateInviteCode,
  removeMember,
  updateMemberRole,
} from '../services/familyService';

export const useFamily = (familyId) =>
  useQuery({
    queryKey: ['family', familyId],
    queryFn: async () => {
      const { data, error } = await getFamilyDetails(familyId);
      if (error) throw error;
      return data;
    },
    enabled: Boolean(familyId),
  });

export const useFamilyMembers = (familyId) =>
  useQuery({
    queryKey: ['family-members', familyId],
    queryFn: async () => {
      const { data, error } = await getFamilyMembers(familyId);
      if (error) throw error;
      return data;
    },
    enabled: Boolean(familyId),
  });

export const useUserFamilies = (profileId) =>
  useQuery({
    queryKey: ['user-families', profileId],
    queryFn: async () => {
      const { data, error } = await getUserFamilies(profileId);
      if (error) throw error;
      return data;
    },
    enabled: Boolean(profileId),
  });

export const useCreateFamily = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name) => {
      const { data, error } = await createFamily(name);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
      queryClient.invalidateQueries({ queryKey: ['user-families'] });
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      toast.success('Family created');
    },
    onError: (error) => toast.error(error.message || 'Failed to create family'),
  });
};

export const useJoinFamily = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inviteCode) => {
      const { data, error } = await joinFamily(inviteCode);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
      queryClient.invalidateQueries({ queryKey: ['user-families'] });
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      toast.success('Joined family');
    },
    onError: (error) => toast.error(error.message || 'Failed to join family'),
  });
};

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ familyId, profileId, role }) => {
      const { data, error } = await updateMemberRole(familyId, profileId, role);
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['family-members', vars.familyId] });
      toast.success('Role updated');
    },
    onError: (error) => toast.error(error.message || 'Failed to update role'),
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ familyId, profileId }) => {
      const { data, error } = await removeMember(familyId, profileId);
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['family-members', vars.familyId] });
      toast.success('Member removed');
    },
    onError: (error) => toast.error(error.message || 'Failed to remove member'),
  });
};

export const useRegenerateInviteCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (familyId) => {
      const { data, error } = await regenerateInviteCode(familyId);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['family', data.id] });
      queryClient.invalidateQueries({ queryKey: ['user-families'] });
      toast.success('Invite code regenerated');
    },
    onError: (error) => toast.error(error.message || 'Failed to regenerate invite code'),
  });
};
