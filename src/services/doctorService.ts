import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch all doctors or a specific doctor from Supabase
 */
export const getDoctors = async (doctorId?: string) => {
  try {
    let query = supabase
      .from('users')
      .select('*')
      .eq('role', 'doctor');
      
    if (doctorId) {
      query = query.eq('id', doctorId);
    }
    
    const { data, error } = await query;
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching doctors:', error);
    return { data: [], error: error.message || 'Failed to fetch doctors' };
  }
};

/**
 * Get doctors by email for specific accounts
 * This is useful for finding a particular doctor like Viraj
 */
export const getDoctorByEmail = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'doctor')
      .eq('email', email)
      .single();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching doctor by email:', error);
    return { data: null, error: error.message || 'Failed to fetch doctor' };
  }
};

/**
 * Get a list of available doctors from Supabase
 * Optionally excluding the current doctor
 */
export const getAvailableDoctors = async (excludeDoctorId?: string) => {
  try {
    let query = supabase
      .from('users')
      .select('id, name, email, specialization, hospital, role')
      .eq('role', 'doctor');
      
    if (excludeDoctorId) {
      query = query.neq('id', excludeDoctorId);
    }
    
    const { data, error } = await query;
      
    if (error) throw error;
    
    // Make sure we have Viraj in the results if he exists
    const virajEmail = 'viraj.22320042@viit.ac.in';
    const hasViraj = data?.some(doctor => doctor.email === virajEmail);
    
    if (!hasViraj) {
      // Add Viraj dummy data if not found in database
      const virajDoctor = {
        id: 'doctor_viraj',
        name: 'Dr. Viraj Telhande',
        email: virajEmail,
        specialization: 'General Medicine',
        hospital: 'VIIT Medical Center',
        role: 'doctor'
      };
      
      return { 
        data: [...(data || []), virajDoctor], 
        error: null 
      };
    }
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching available doctors:', error);
    
    // Return mock data as fallback including Viraj
    const mockDoctors = [
      {
        id: 'doctor3',
        name: 'Dr. Viraj Telhande',
        email: 'viraj.22320042@viit.ac.in',
        specialization: 'General Medicine',
        hospital: 'VIIT Medical Center',
        role: 'doctor'
      },
      {
        id: 'doctor4',
        name: 'Dr. Rohan Sharma',
        email: 'rohan@example.com',
        specialization: 'Orthopedics',
        hospital: 'Memorial Hospital',
        role: 'doctor'
      }
    ];
    
    return { 
      data: mockDoctors, 
      error: error.message || 'Failed to fetch doctors. Using mock data.' 
    };
  }
}; 