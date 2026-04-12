import { createContext, useContext, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { signOut as signOutService } from '../services/authService';
import { useUserFamilies } from '../hooks/useFamily';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const { user, profile, isLoading, isAuthenticated, authError } = useAuth();
  const { data: memberships = [] } = useUserFamilies(user?.id);

  const familyId = memberships?.[0]?.family_id || memberships?.[0]?.families?.id || null;

  const signOut = async () => {
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
    () => ({ user, profile, familyId, isLoading, isAuthenticated, authError, signOut }),
    [user, profile, familyId, isLoading, isAuthenticated, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
};
