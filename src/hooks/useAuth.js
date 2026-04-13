import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const timeout = setTimeout(() => {
      if (mounted) {
        setAuthError(new Error('Auth request timed out.'));
        setIsLoading(false);
      }
    }, 10000);

    const fetchAuth = async () => {
      try {
        const {
          data: { user: currentUser },
          error,
        } = await supabase.auth.getUser();

        if (!mounted) return;
        if (error) {
          setAuthError(error);
          setIsLoading(false);
          return;
        }

        setUser(currentUser ?? null);

        if (currentUser?.id) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();

          if (!data) {
            const fallbackName =
              currentUser.user_metadata?.full_name ||
              currentUser.user_metadata?.name ||
              currentUser.email?.split('@')[0] ||
              'Member';

            await supabase.from('profiles').upsert({
              id: currentUser.id,
              full_name: fallbackName,
              avatar_url: currentUser.user_metadata?.avatar_url || null,
            });

            const { data: recoveredProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentUser.id)
              .maybeSingle();

            if (mounted) setProfile(recoveredProfile ?? null);
          } else if (mounted) {
            setProfile(data);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        if (mounted) {
          setUser(null);
          setProfile(null);
          setAuthError(error);
          console.error("fetchAuth Error:", error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          clearTimeout(timeout);
        }
      }
    };

    fetchAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        setAuthError(null);
        const nextUser = session?.user ?? null;
        setUser(nextUser);
        if (nextUser?.id) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', nextUser.id)
            .maybeSingle();

          if (!data) {
            const fallbackName =
              nextUser.user_metadata?.full_name ||
              nextUser.user_metadata?.name ||
              nextUser.email?.split('@')[0] ||
              'Member';

            await supabase.from('profiles').upsert({
              id: nextUser.id,
              full_name: fallbackName,
              avatar_url: nextUser.user_metadata?.avatar_url || null,
            });

            const { data: recoveredProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', nextUser.id)
              .maybeSingle();

            setProfile(recoveredProfile ?? null);
          } else {
            setProfile(data ?? null);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        setAuthError(error);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
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
    }),
    [user, profile, isLoading, authError]
  );
};
