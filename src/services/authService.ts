import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  role: 'patient' | 'doctor';
  specialty?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const signUp = async (data: SignUpData) => {
  try {
    const { email, password, name, role, specialty } = data;
    
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          specialty
        }
      }
    });

    if (signUpError) throw signUpError;
    
    return { data: authData, error: null };
  } catch (error: any) {
    console.error('Error signing up:', error);
    return { data: null, error: error.message || 'Failed to sign up' };
  }
};

export const login = async (data: LoginData) => {
  try {
    console.log('Attempting to login with:', data.email);
    
    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (loginError) {
      console.error('Login error:', loginError);
      throw loginError;
    }
    
    console.log('Login successful:', authData);
    return { data: authData, error: null };
  } catch (error: any) {
    console.error('Error logging in:', error);
    return { data: null, error: error.message || 'Failed to log in' };
  }
};

export const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error logging out:', error);
    return { error: error.message || 'Failed to log out' };
  }
};

export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error getting session:', error);
    return { data: null, error: error.message || 'Failed to get session' };
  }
};

export const getProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return { data: null, error: error.message || 'Failed to fetch profile' };
  }
};

export const updateProfile = async (userId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return { data: null, error: error.message || 'Failed to update profile' };
  }
};

export const loginWithWallet = async (walletAddress: string, signature: string) => {
  try {
    // In a real implementation, you would verify the signature on the backend
    // For now, we'll just check if a user with this wallet address exists
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();
    
    if (error) {
      // No user found with this wallet address
      toast.error('No account found with this wallet address');
      return { data: null, error: 'No account found with this wallet address' };
    }
    
    // Convert to custom auth
    // In a real implementation, this would be handled by a secure backend
    // For demo purposes, we're using email login after finding the wallet match
    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: 'wallet-login-temp', // This is just a placeholder for the demo
    });
    
    if (loginError) {
      // This is just for the demo
      toast.info('Demo mode: Please use email login instead');
      return { data: null, error: 'Please use email login for this demo' };
    }
    
    return { data: authData, error: null };
  } catch (error: any) {
    console.error('Error logging in with wallet:', error);
    return { data: null, error: error.message || 'Failed to login with wallet' };
  }
};

// Add test function to verify Supabase connection
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
};

export const createTestUser = async () => {
  try {
    console.log('Attempting to create test user...');
    
    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'test123456',
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw authError;
    }

    console.log('Auth user created:', authData);

    if (authData.user) {
      // Then create the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'patient',
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        throw profileError;
      }

      console.log('Test user profile created successfully');
      return { success: true, error: null };
    }

    return { success: false, error: 'Failed to create user' };
  } catch (error: any) {
    console.error('Error creating test user:', error);
    return { success: false, error: error.message };
  }
};

export const createTestUsers = async () => {
  try {
    console.log('Creating test users for both roles...');

    // Create test patient
    const { data: patientAuthData, error: patientAuthError } = await supabase.auth.signUp({
      email: 'patient@example.com',
      password: 'test123456',
    });

    if (patientAuthError) {
      console.error('Error creating patient auth:', patientAuthError);
      throw patientAuthError;
    }

    if (patientAuthData.user) {
      const { error: patientProfileError } = await supabase
        .from('profiles')
        .insert({
          id: patientAuthData.user.id,
          email: 'patient@example.com',
          full_name: 'Test Patient',
          role: 'patient',
        });

      if (patientProfileError) {
        console.error('Error creating patient profile:', patientProfileError);
        throw patientProfileError;
      }
    }

    // Create test doctor
    const { data: doctorAuthData, error: doctorAuthError } = await supabase.auth.signUp({
      email: 'doctor@example.com',
      password: 'test123456',
    });

    if (doctorAuthError) {
      console.error('Error creating doctor auth:', doctorAuthError);
      throw doctorAuthError;
    }

    if (doctorAuthData.user) {
      const { error: doctorProfileError } = await supabase
        .from('profiles')
        .insert({
          id: doctorAuthData.user.id,
          email: 'doctor@example.com',
          full_name: 'Test Doctor',
          role: 'doctor',
          specialty: 'General Medicine',
        });

      if (doctorProfileError) {
        console.error('Error creating doctor profile:', doctorProfileError);
        throw doctorProfileError;
      }
    }

    console.log('Test users created successfully');
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error creating test users:', error);
    return { success: false, error: error.message };
  }
};
