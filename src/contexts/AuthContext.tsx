// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track last applied user id to avoid redundant state churn
  const lastUserIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const updateAuthState = (newSession: Session | null) => {
    const nextUser = newSession?.user ?? null;
    const nextUserId = nextUser?.id ?? null;

    // Guard: only update if the user actually changed
    if (lastUserIdRef.current !== nextUserId) {
      console.log(
        'AuthContext: Updating auth state:',
        nextUser?.email || 'No session'
      );
      lastUserIdRef.current = nextUserId;
      setSession(newSession);
      setUser(nextUser);
      // Clear any previous errors on successful auth
      if (newSession && error) setError(null);
    }
  };

  const clearAuthState = () => {
    console.log('AuthContext: Clearing auth state');
    lastUserIdRef.current = null;
    setSession(null);
    setUser(null);
    setError(null);
  };

  const signOut = async () => {
    try {
      console.log('AuthContext: Starting logout process...');
      // Optimistic local clear for instant UI feedback
      clearAuthState();

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.log('AuthContext: Logout error:', error);

        // If session is already invalid on server, local state is already cleared
        if (
          error.message?.includes('session_not_found') ||
          error.message?.includes('Session not found') ||
          (error as any)?.status === 403
        ) {
          console.log('AuthContext: Session already invalid on server');
          return;
        }

        // Ensure local session cleared even on other errors
        await supabase.auth.signOut({ scope: 'local' });
      } else {
        console.log('AuthContext: Logout successful');
      }
    } catch (err) {
      console.error('AuthContext: Unexpected logout error:', err);
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (localError) {
        console.error('AuthContext: Failed to clear local session:', localError);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    const initializeAuth = async () => {
      try {
        console.log('AuthContext: Initializing auth...');
        const {
          data: { session: initialSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (sessionError) {
          console.error(
            'AuthContext: Error getting initial session:',
            sessionError
          );

          // If the session is invalid, clear local state
          if (
            sessionError.message?.includes('session_not_found') ||
            sessionError.message?.includes('Session not found')
          ) {
            console.log(
              'AuthContext: Session not found on server, clearing local session'
            );
            await supabase.auth.signOut({ scope: 'local' });
            clearAuthState();
            setLoading(false);
            return;
          }

          setError(sessionError.message);
          setLoading(false);
          return;
        }

        console.log(
          'AuthContext: Initial session:',
          initialSession?.user?.email || 'No session'
        );
        updateAuthState(initialSession);
        setLoading(false);
      } catch (err) {
        console.error('AuthContext: Auth initialization error:', err);
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : 'Authentication error');
        setLoading(false);
      }
    };

    // Create user profile for new signups
    const createUserProfile = async (user: User) => {
      try {
        console.log('Creating user profile for:', user.email);
        const { error } = await supabase.from('users').insert({
          id: user.id,
          email: user.email,
          full_name: (user.user_metadata as any)?.full_name || null,
        });

        if (error && !error.message?.includes('duplicate key')) {
          console.error('Error creating user profile:', error);
        } else if (!error) {
          console.log('User profile created successfully');
        }
      } catch (err) {
        console.error('Unexpected error creating user profile:', err);
      }
    };

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mountedRef.current) return;

      console.log(
        'AuthContext: Auth state changed:',
        event,
        newSession?.user?.email || 'No session'
      );

      if (event === 'SIGNED_OUT') {
        clearAuthState();
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_UP') {
        // Update (guarded) + create profile once
        updateAuthState(newSession);
        if (newSession?.user) {
          await createUserProfile(newSession.user);
        }
        setLoading(false);
        return;
      }

      // For SIGNED_IN / TOKEN_REFRESHED / USER_UPDATED / PASSWORD_RECOVERY, etc.
      updateAuthState(newSession);
      setLoading(false);

      // IMPORTANT: no redirects here.
      // Navigation is handled by your route layer (e.g., ProtectedRoute).
    });

    // Initialize once
    initializeAuth();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []); // run once

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!user && !!session,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
