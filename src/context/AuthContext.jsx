import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { signOut as signOutService } from '../services/authService';
import { useUserFamilies } from '../hooks/useFamily';

const AuthContext = createContext(null);
const ACTIVE_FAMILY_STORAGE_KEY = 'activeFamilyId';
const getActiveFamilyStorageKey = (userId) => `${ACTIVE_FAMILY_STORAGE_KEY}:${userId || 'anon'}`;

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const { user, profile, isLoading, isAuthenticated, authError, clearAuthState } = useAuth();
  const {
    data: memberships = [],
    isLoading: isMembershipsLoading,
    isFetching: isMembershipsFetching,
    error: membershipsError,
  } = useUserFamilies(user?.id);
  const [familyId, setFamilyId] = useState(null);

  const membershipFamilyIds = useMemo(
    () => memberships
      .map((membership) => membership?.family_id || membership?.families?.id)
      .filter(Boolean),
    [memberships]
  );

  useEffect(() => {
    if (!user?.id) {
      setFamilyId(null);
      localStorage.removeItem(getActiveFamilyStorageKey('anon'));
      return;
    }

    const storageKey = getActiveFamilyStorageKey(user.id);
    const legacySavedFamilyId = localStorage.getItem(ACTIVE_FAMILY_STORAGE_KEY);
    const savedFamilyId = localStorage.getItem(storageKey) || legacySavedFamilyId;

    if (legacySavedFamilyId && !localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, legacySavedFamilyId);
      localStorage.removeItem(ACTIVE_FAMILY_STORAGE_KEY);
    }

    if (savedFamilyId && !familyId) {
      setFamilyId(savedFamilyId);
    }

    // Keep current family selection while memberships are still resolving.
    if (isMembershipsLoading || isMembershipsFetching) {
      return;
    }

    // If memberships query fails, avoid wiping active family from state/storage.
    if (membershipsError) {
      return;
    }

    if (membershipFamilyIds.length === 0) {
      // If we already have an active family, preserve it until a confirmed refetch proves it's gone.
      if (familyId || savedFamilyId) {
        return;
      }

      setFamilyId(null);
      return;
    }

    if (savedFamilyId && membershipFamilyIds.includes(savedFamilyId)) {
      setFamilyId(savedFamilyId);
      return;
    }

    if (familyId && membershipFamilyIds.includes(familyId)) {
      return;
    }

    const fallbackFamilyId = membershipFamilyIds[0];
    setFamilyId(fallbackFamilyId);
    localStorage.setItem(storageKey, fallbackFamilyId);
  }, [membershipFamilyIds, user?.id, isMembershipsLoading, isMembershipsFetching, membershipsError, familyId]);

  const setActiveFamily = useCallback(
    (nextFamilyId) => {
      const storageKey = getActiveFamilyStorageKey(user?.id);

      if (!nextFamilyId) {
        setFamilyId(null);
        localStorage.removeItem(storageKey);
        return;
      }

      if (membershipFamilyIds.length > 0 && !membershipFamilyIds.includes(nextFamilyId)) {
        toast.error('Selected family is not available in your memberships.');
        return;
      }

      setFamilyId(nextFamilyId);
      localStorage.setItem(storageKey, nextFamilyId);
    },
    [membershipFamilyIds, user?.id]
  );

  const signOut = async () => {
    clearAuthState();
    localStorage.removeItem(getActiveFamilyStorageKey(user?.id));
    setFamilyId(null);

    const { error } = await signOutService();
    if (error) {
      toast.error(error.message || 'Sign out timed out, redirecting to login.');
    } else {
      toast.success('Signed out');
    }

    navigate('/login', { replace: true });
    window.setTimeout(() => {
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }, 100);
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      familyId,
      memberships,
      setActiveFamily,
      isLoading,
      isAuthenticated,
      authError,
      signOut,
    }),
    [user, profile, familyId, memberships, setActiveFamily, isLoading, isAuthenticated, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
};
