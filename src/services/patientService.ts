import { supabase } from "@/integrations/supabase/client";
import { getDoctorAccessRequests } from "./accessRequestService";
import { getAppointments } from "./appointmentService";
import { safeGetUserById } from "@/utils/userUtils";

/**
 * Gets all patients associated with a doctor via appointments and access requests
 */
export const getDoctorPatients = async (doctorId: string) => {
  try {
    // Get patients from appointments
    const { data: appointmentData, error: appointmentError } = await getAppointments(doctorId, 'doctor');
    
    if (appointmentError) {
      throw new Error(appointmentError);
    }
    
    // Get patients from access requests
    const accessRequests = await getDoctorAccessRequests(doctorId);
    
    // Create a set of unique patient IDs
    const patientIds = new Set([
      ...(appointmentData || []).map(apt => apt.patient_id),
      ...accessRequests.map(req => req.patientId)
    ]);
    
    // Get full patient profiles from database
    const { data: patientData, error: patientError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', Array.from(patientIds))
      .eq('role', 'patient');
    
    if (patientError) {
      throw new Error(patientError.message);
    }
    
    return { data: patientData || [], error: null };
  } catch (error: any) {
    console.error('Error fetching doctor patients:', error);
    
    // Fallback to client-side data if needed
    const appointmentData = await getAppointments(doctorId, 'doctor');
    const accessRequests = await getDoctorAccessRequests(doctorId);
    
    // Create a set of unique patient IDs
    const patientIds = new Set([
      ...(appointmentData.data || []).map(apt => apt.patient_id),
      ...accessRequests.map(req => req.patientId)
    ]);
    
    // Get patient data from local utility
    const patients = Array.from(patientIds)
      .map(id => safeGetUserById(id))
      .filter(patient => patient && patient.role === 'patient');
    
    return { data: patients, error: error.message || 'Failed to fetch patients' };
  }
};

/**
 * Gets patient details by ID
 */
export const getPatientById = async (patientId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', patientId)
      .eq('role', 'patient')
      .single();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching patient details:', error);
    
    // Fallback to client-side data
    const patient = safeGetUserById(patientId);
    
    return { 
      data: patient, 
      error: error.message || 'Failed to fetch patient details' 
    };
  }
}; 