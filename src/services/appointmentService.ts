
import { supabase } from "@/integrations/supabase/client";

export const getAppointments = async (userId: string, userRole: string) => {
  try {
    const field = userRole === 'doctor' ? 'doctor_id' : 'patient_id';
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctor_id (id, name, email, specialty),
        patient:patient_id (id, name, email)
      `)
      .eq(field, userId)
      .order('datetime', { ascending: true });
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    return { data: [], error: error.message || 'Failed to fetch appointments' };
  }
};

export const createAppointment = async (appointment: any) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointment)
      .select()
      .single();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    return { data: null, error: error.message || 'Failed to create appointment' };
  }
};

export const updateAppointment = async (id: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    return { data: null, error: error.message || 'Failed to update appointment' };
  }
};

export const deleteAppointment = async (id: string) => {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return { error: null };
  } catch (error: any) {
    console.error('Error deleting appointment:', error);
    return { error: error.message || 'Failed to delete appointment' };
  }
};
