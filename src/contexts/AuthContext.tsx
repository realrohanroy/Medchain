import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/global';
import { findUserByEmail, safeUser } from '@/lib/mockData'; // Import mock data functions
import { login as authLogin, getProfile, testSupabaseConnection } from '@/services/authService';

// Utility function to add timeout to promises
const withTimeout = function<T>(p: Promise<T>, ms = 4000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('profiles fetch timeout')), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }).catch((e) => { clearTimeout(t); reject(e); });
  });
};

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loginWithWallet: (address: string, signature: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  login: async () => false,
  logout: () => {},
  isAuthenticated: false,
  loginWithWallet: async () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await getProfile(userId);
      if (error) throw error;
      if (data) {
        setUser(data as UserProfile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile');
    }
  };

  useEffect(() => {
    console.log('AuthProvider mounted - setting up auth state listener');
    
    // Test Supabase connection
    const testConnection = async () => {
      try {
        console.log('Testing Supabase connection...');
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        if (error) {
          console.error('Supabase connection test failed:', error);
          toast.error('Database connection failed');
          setLoading(false);
          return;
        }
        console.log('Supabase connection test successful');
      } catch (error) {
        console.error('Supabase connection test error:', error);
        toast.error('Database connection failed');
        setLoading(false);
        return;
      }
    };
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.id);
        console.log('Session details:', {
          hasSession: !!newSession,
          hasUser: !!newSession?.user,
          userId: newSession?.user?.id,
          email: newSession?.user?.email
        });
        
        setSession(newSession);
        
        if (newSession?.user) {
          console.log('Fetching user profile for:', newSession.user.id);
          try {
            // Try to fetch existing profile; use maybeSingle to avoid throwing on 0 rows
            const { data: profile, error: profileError } = await withTimeout(
              supabase
                .from('profiles')
                .select('*')
                .eq('id', newSession.user.id)
                .maybeSingle()
            );

            if (profileError) {
              throw profileError;
            }

            if (!profile) {
              // Auto-create profile for first-time users (allowed by RLS: auth.uid() = id)
              console.log('No profile found. Creating default profile for user:', newSession.user.id);
              const { data: created, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: newSession.user.id,
                  email: newSession.user.email ?? '',
                  full_name: newSession.user.email ?? 'New User',
                  role: 'patient',
                })
                .select('*')
                .single();

              if (createError) {
                // As a last resort (e.g., RLS off or transient issue), fall back to minimal session-backed user
                console.warn('Profile create failed, falling back to session-derived user');
                setUser({
                  id: newSession.user.id,
                  email: newSession.user.email ?? '',
                  name: newSession.user.email ?? 'New User',
                  role: 'patient',
                } as unknown as UserProfile);
                setLoading(false);
                return;
              }

              // Normalize to ensure .name exists for UI components
              setUser({ ...(created as Record<string, any>), name: created.full_name ?? created.email ?? 'User' } as unknown as UserProfile);
            } else {
              console.log('Profile fetched successfully:', profile);
              setUser({ ...(profile as Record<string, any>), name: (profile as any).name ?? (profile as any).full_name ?? (profile as any).email ?? 'User' } as unknown as UserProfile);
            }
            setLoading(false);
          } catch (error) {
            console.error('Error ensuring user profile exists:', error);
            toast.error('Failed to load user profile');
            setLoading(false);
            return;
          }
        } else {
          console.log('No user in session, clearing user state');
          setUser(null);
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        await testSupabaseConnection();
        
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          throw sessionError;
        }
        
        console.log('Current session state:', {
          hasSession: !!currentSession,
          hasUser: !!currentSession?.user,
          userId: currentSession?.user?.id,
          email: currentSession?.user?.email
        });
        
        setSession(currentSession);
        
        if (currentSession?.user) {
          console.log('Fetching initial user profile for:', currentSession.user.id);
          try {
            const { data: profile, error: profileError } = await withTimeout(
              supabase
                .from('profiles')
                .select('*')
                .eq('id', currentSession.user.id)
                .maybeSingle()
            );

            if (profileError) {
              throw profileError;
            }

            if (!profile) {
              console.log('No profile found on init. Creating default profile:', currentSession.user.id);
              const { data: created, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: currentSession.user.id,
                  email: currentSession.user.email ?? '',
                  full_name: currentSession.user.email ?? 'New User',
                  role: 'patient',
                })
                .select('*')
                .single();

              if (createError) {
                console.warn('Profile create on init failed, falling back to session-derived user');
                setUser({
                  id: currentSession.user.id,
                  email: currentSession.user.email ?? '',
                  name: currentSession.user.email ?? 'New User',
                  role: 'patient',
                } as unknown as UserProfile);
                return;
              }

              setUser({ ...(created as Record<string, any>), name: created.full_name ?? created.email ?? 'User' } as unknown as UserProfile);
            } else {
              console.log('Initial profile fetched successfully:', profile);
              setUser({ ...(profile as Record<string, any>), name: (profile as any).name ?? (profile as any).full_name ?? (profile as any).email ?? 'User' } as unknown as UserProfile);
            }
            setLoading(false);
          } catch (error) {
            console.error('Error ensuring initial user profile exists:', error);
            throw error;
          }
        } else {
          console.log('No active session found during initialization');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        toast.error('Failed to initialize authentication');
        setLoading(false);
      } finally {
        console.log('Auth initialization complete, setting loading to false');
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await authLogin({ email, password });

      if (error) {
        throw new Error(error);
      }

      if (!data?.user) {
        throw new Error('No user data received');
      }

      return true;
    } catch (error: any) {
      console.error('Error logging in:', error);
      toast.error(error.message || 'Failed to login');
      return false;
    }
  };
  
  const loginWithWallet = async (address: string, signature: string) => {
    try {
      // Fetch user by wallet address
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', address.toLowerCase())
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        toast.error('No user associated with this wallet address');
        return false;
      }
      
      // For demo purposes, we'll just simulate the login
      toast.success('Logged in with wallet successfully!');
      
      // This is just a demo - in a real app, we would use a proper auth flow
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: 'wallet-auth-demo-bypass', // This won't work in a real deployment
      });
      
      if (signInError) {
        toast.info('Demo mode: Please use the email login instead');
        return false;
      }
      
      return true;
    } catch (error: any) {
      console.error('Error logging in with wallet:', error);
      toast.error(error.message || 'Failed to login with wallet');
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to logout');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      loading, 
      login, 
      logout,
      isAuthenticated: !!user && !!session,
      loginWithWallet
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
