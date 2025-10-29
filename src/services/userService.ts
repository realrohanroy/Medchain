
import { supabase } from "@/integrations/supabase/client";

export const getUsers = async (role?: string) => {
  try {
    let query = supabase.from('profiles').select('*');
    
    if (role) {
      query = query.eq('role', role);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return { data: [], error: error.message || 'Failed to fetch users' };
  }
};

export const getDoctors = async () => {
  return getUsers('doctor');
};

export const getPatients = async () => {
  return getUsers('patient');
};

export const getUserById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return { data: null, error: error.message || 'Failed to fetch user' };
  }
};

export const updateWalletAddress = async (userId: string, walletAddress: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ wallet_address: walletAddress.toLowerCase() })
      .eq('id', userId)
      .select()
      .single();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating wallet address:', error);
    return { data: null, error: error.message || 'Failed to update wallet address' };
  }
};
