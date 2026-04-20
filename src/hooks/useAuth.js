import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const buildFallbackProfile = (nextUser, existingProfile = null) => {
  if (!nextUser?.id) return null;

  const fullName =
    existingProfile?.full_name ||
    nextUser.user_metadata?.full_name ||
    nextUser.user_metadata?.name ||
    nextUser.email?.split('@')[0] ||
    'Member';

  return {
    id: nextUser.id,
    full_name: fullName,
    avatar_url: existingProfile?.avatar_url || nextUser.user_metadata?.avatar_url || null,
    role: existingProfile?.role || 'member',
  };
};

const resolveProfile = async (nextUser, existingProfile = null) => {
  if (!nextUser?.id) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', nextUser.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) return data;

  const fallbackProfile = buildFallbackProfile(nextUser, existingProfile);

  const { error: upsertError } = await supabase.from('profiles').upsert({
    id: nextUser.id,
    full_name: fallbackProfile?.full_name || 'Member',
    avatar_url: fallbackProfile?.avatar_url || null,
  });

  if (upsertError) {
    throw upsertError;
  }

  const { data: recoveredProfile, error: recoveredError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', nextUser.id)
    .maybeSingle();

  if (recoveredError) {
    throw recoveredError;
  }

  return recoveredProfile ?? fallbackProfile;
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setProfile(null);
    setAuthError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    let initialSessionResolved = false;
    let nullSessionFallback = null;
    const bootstrapTimeout = setTimeout(() => {
      if (!mounted || initialSessionResolved) return;
      initialSessionResolved = true;
      setAuthError((prev) => prev ?? new Error('Auth initialization timed out.'));
      setIsLoading(false);
    }, 12000);

    const finishBootstrap = () => {
      if (!mounted || initialSessionResolved) return;
      initialSessionResolved = true;
      clearTimeout(bootstrapTimeout);
      if (nullSessionFallback) clearTimeout(nullSessionFallback);
      setIsLoading(false);
    };

    const fetchAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;
        if (error) {
          setAuthError(error);
          setIsLoading(false);
          return;
        }

        const currentUser = session?.user ?? null;
        setUser(currentUser ?? null);

        if (currentUser) {
          setProfile((prev) => prev ?? buildFallbackProfile(currentUser));
          resolveProfile(currentUser)
            .then((resolvedProfile) => {
              if (mounted) {
                setProfile((prev) => resolvedProfile ?? prev ?? buildFallbackProfile(currentUser));
              }
            })
            .catch((error) => {
              if (mounted) {
                setProfile((prev) => prev ?? buildFallbackProfile(currentUser));
                setAuthError((prev) => prev ?? error);
              }
            })
            .finally(() => {
              finishBootstrap();
            });
        } else {
          nullSessionFallback = setTimeout(() => {
            finishBootstrap();
          }, 2000);
        }
      } catch (error) {
        if (mounted) {
          setUser(null);
          setProfile(null);
          setAuthError(error);
          setIsLoading(false);
        }
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (!mounted) return;
        setAuthError(null);
        if (nullSessionFallback) {
          clearTimeout(nullSessionFallback);
          nullSessionFallback = null;
        }
        const nextUser = session?.user ?? null;
        setUser(nextUser);

        if (!nextUser) {
          setProfile(null);
          finishBootstrap();
          return;
        }

        setProfile((prev) => prev ?? buildFallbackProfile(nextUser));

        const resolvedProfile = await resolveProfile(nextUser);
        if (!mounted) return;
        setProfile((prev) => resolvedProfile ?? prev ?? buildFallbackProfile(nextUser));
        finishBootstrap();
      } catch (error) {
        if (!mounted) return;
        setAuthError(error);
        finishBootstrap();
      }
    });

    fetchAuth();

    return () => {
      mounted = false;
      clearTimeout(bootstrapTimeout);
      if (nullSessionFallback) clearTimeout(nullSessionFallback);
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return useMemo(
    () => ({
      user,
      profile,
      isLoading,
      authError,
      isAuthenticated: Boolean(user),
      clearAuthState,
    }),
    [user, profile, isLoading, authError, clearAuthState]
  );
};
