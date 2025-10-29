import { supabase } from "@/integrations/supabase/client";
import { getUserMedicalRecords } from "@/lib/mockData";

export const getMedicalRecords = async (patientId: string) => {
  try {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patientId);
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching records:', error);
    return { data: [], error: error.message || 'Failed to fetch records' };
  }
};

export const getAccessibleRecords = async (doctorId: string) => {
  try {
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        *,
        profiles:patient_id (name, email)
      `)
      .eq('access_grants.doctor_id', doctorId)
      .is('access_grants.revoked_at', null);
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching accessible records:', error);
    return { data: [], error: error.message || 'Failed to fetch accessible records' };
  }
};

export const addMedicalRecord = async (record: any) => {
  try {
    const { data, error } = await supabase
      .from('medical_records')
      .insert(record)
      .select()
      .single();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error adding record:', error);
    return { data: null, error: error.message || 'Failed to add record' };
  }
};

export const grantAccess = async (grant: any) => {
  try {
    const { data, error } = await supabase
      .from('access_grants')
      .insert(grant)
      .select()
      .single();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error granting access:', error);
    return { data: null, error: error.message || 'Failed to grant access' };
  }
};

export const revokeAccess = async (grantId: string) => {
  try {
    const { data, error } = await supabase
      .from('access_grants')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', grantId)
      .select()
      .single();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error revoking access:', error);
    return { data: null, error: error.message || 'Failed to revoke access' };
  }
};

/**
 * Gets all medical records for a patient
 */
export const getPatientMedicalRecords = async (patientId: string) => {
  try {
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        *,
        shared_with:access_grants(*)
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching patient medical records:', error);
    
    // Fallback to mock data
    const mockRecords = getUserMedicalRecords(patientId);
    
    return { 
      data: mockRecords, 
      error: error.message || 'Failed to fetch patient medical records' 
    };
  }
};
