import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";
import { 
  getUserAccessRequests, 
  findUserById,
  findUserByEmail,
  safeUser
} from '@/lib/mockData';
import type { AccessRequest } from '@/lib/mockData';
import { toast } from 'sonner';

// Create a simple in-memory store for real-time access requests
// In a real app, this would be stored in a database
let accessRequests: AccessRequest[] = [...getUserAccessRequests('all') as AccessRequest[]];

export const getAccessRequests = async (patientId: string) => {
  try {
    const { data, error } = await supabase
      .from('access_requests')
      .select(`
        *,
        doctor:doctor_id (id, name, email, specialty)
      `)
      .eq('patient_id', patientId)
      .order('request_date', { ascending: false });
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching access requests:', error);
    // Fallback to mock data
    const mockRequests = accessRequests.filter(req => req.patientId === patientId);
    return { data: mockRequests, error: null };
  }
};

export const getDoctorRequests = async (doctorId: string) => {
  try {
    const { data, error } = await supabase
      .from('access_requests')
      .select(`
        *,
        patient:patient_id (id, name, email)
      `)
      .eq('doctor_id', doctorId)
      .order('request_date', { ascending: false });
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching doctor requests:', error);
    // Fallback to mock data
    const mockRequests = accessRequests.filter(req => req.doctorId === doctorId);
    return { data: mockRequests, error: null };
  }
};

export interface AccessRequest {
  id: string;
  doctorId: string;
  patientId: string;
  recordId?: string;
  requestAllRecords: boolean;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  updatedAt: string;
  doctor?: {
    fullName: string;
    email: string;
    specialty?: string;
    hospital?: string;
  };
  patient?: {
    fullName: string;
    email: string;
    specialty?: string;
    hospital?: string;
  };
}

export interface AccessGrant {
  id: string;
  requestId?: string;
  doctorId: string;
  patientId: string;
  recordId?: string;
  grantAllRecords: boolean;
  createdAt: string;
  expiresAt?: string;
  revokedAt?: string;
  doctor?: {
    fullName: string;
    email: string;
    specialty?: string;
    hospital?: string;
  };
  patient?: {
    fullName: string;
    email: string;
  };
}

/**
 * Creates an access request from a doctor to a patient
 */
export const createAccessRequest = async (
  doctorId: string,
  patientId: string,
  reason: string,
  recordId?: string,
  requestAllRecords: boolean = false
): Promise<AccessRequest | null> => {
  try {
    // Validate inputs
    if (!doctorId || !patientId || !reason) {
      toast.error('Missing required fields for access request');
      return null;
    }
    
    if (!recordId && !requestAllRecords) {
      toast.error('Must specify a record ID or request all records');
      return null;
    }
    
    // Create the request
    const accessRequest = {
      id: uuidv4(),
      doctor_id: doctorId,
      patient_id: patientId,
      record_id: recordId || null,
      request_all_records: requestAllRecords,
      reason,
      status: 'pending'
    };
    
    // Try to insert into database
    const { data, error } = await supabase
      .from('access_requests')
      .insert(accessRequest)
      .select('*')
      .single();

    if (error) {
      console.error('Error creating access request:', error);
      // Check for duplicate request
      if (error.code === '23505') { // Unique violation
        toast.error('You already have a pending request for this patient/record');
      } else {
        toast.error(`Failed to create access request: ${error.message}`);
      }
      return null;
    }
    
    toast.success('Access request sent successfully');
    
    // Return in our expected format
    return {
        id: data.id,
      doctorId: data.doctor_id,
        patientId: data.patient_id,
      recordId: data.record_id || undefined,
      requestAllRecords: data.request_all_records,
      reason: data.reason,
        status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error in createAccessRequest:', error);
    toast.error(`Failed to create access request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};

/**
 * Gets all access requests for a patient
 */
export const getPatientAccessRequests = async (patientId: string): Promise<AccessRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('access_requests')
      .select(`
        *,
        doctor:doctor_id(
          id,
          full_name,
          email,
          specialty
        )
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching access requests:', error);
      return [];
    }
    
    // Transform to our interface format
    return (data || []).map(request => ({
      id: request.id,
      doctorId: request.doctor_id,
      patientId: request.patient_id,
      recordId: request.record_id || undefined,
      requestAllRecords: request.request_all_records,
      reason: request.reason,
      status: request.status,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
      doctor: request.doctor ? {
        fullName: request.doctor.full_name,
        email: request.doctor.email,
        specialty: request.doctor.specialty
      } : undefined
    }));
  } catch (error) {
    console.error('Error in getPatientAccessRequests:', error);
    return [];
  }
};

/**
 * Gets all access requests made by a doctor
 */
export const getDoctorAccessRequests = async (doctorId: string): Promise<AccessRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('access_requests')
      .select(`
        *,
        patient:patient_id(
          id,
          full_name,
          email
        )
      `)
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching doctor access requests:', error);
      return [];
    }
    
    // Transform to our interface format
    return (data || []).map(request => ({
      id: request.id,
      doctorId: request.doctor_id,
      patientId: request.patient_id,
      recordId: request.record_id || undefined,
      requestAllRecords: request.request_all_records,
      reason: request.reason,
      status: request.status,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
      patient: request.patient ? {
        fullName: request.patient.full_name,
        email: request.patient.email
      } : undefined
    }));
  } catch (error) {
    console.error('Error in getDoctorAccessRequests:', error);
    return [];
  }
};

/**
 * Updates the status of an access request
 */
export const updateAccessRequestStatus = async (
  requestId: string,
  status: 'approved' | 'denied',
  patientId: string
): Promise<boolean> => {
  try {
    // Verify user is the patient
    const { data: requestData, error: requestError } = await supabase
      .from('access_requests')
      .select('*')
      .eq('id', requestId)
      .eq('patient_id', patientId)
      .single();
    
    if (requestError || !requestData) {
      console.error('Error verifying access request:', requestError);
      toast.error('Access request not found or you do not have permission');
      return false;
    }
    
    // Update the status
    const { error } = await supabase
      .from('access_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId);
    
    if (error) {
      console.error('Error updating access request status:', error);
      toast.error(`Failed to update request: ${error.message}`);
      return false;
    }
    
    // If approved, create an access grant
    if (status === 'approved') {
      await createAccessGrant(
        requestData.doctor_id,
        requestData.patient_id,
        requestData.id,
        requestData.record_id,
        requestData.request_all_records
      );
    }
    
    toast.success(`Access request ${status}`);
    return true;
  } catch (error) {
    console.error('Error in updateAccessRequestStatus:', error);
    toast.error(`Failed to update request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

// Alias for updateAccessRequestStatus for backward compatibility
export const updateAccessRequest = async (
  requestId: string,
  status: 'Rejected' | 'Approved' | 'Pending'
) => {
  try {
    // Convert status format from camelCase to lowercase
    const normalizedStatus = status.toLowerCase() as 'approved' | 'denied' | 'pending';
    // For 'Rejected', we use 'denied' in the database
    const dbStatus = normalizedStatus === 'rejected' ? 'denied' : normalizedStatus;
    
    // First fetch the request to get the patient ID
    const { data: requestData, error: requestError } = await supabase
      .from('access_requests')
      .select('*')
      .eq('id', requestId)
      .single();
    
    if (requestError || !requestData) {
      console.error('Error fetching access request:', requestError);
      throw new Error('Access request not found');
    }
    
    // Call the new function with the correct patient ID
    const success = await updateAccessRequestStatus(requestId, dbStatus as 'approved' | 'denied', requestData.patient_id);
    
    if (!success) {
      throw new Error('Failed to update access request');
    }

    // Fetch the updated request to return
    const { data: updatedRequest, error: updateError } = await supabase
      .from('access_requests')
      .select('*')
      .eq('id', requestId)
      .single();
      
    if (updateError || !updatedRequest) {
      console.error('Error fetching updated request:', updateError);
      throw new Error('Failed to fetch updated request');
    }
    
    // Return in the format expected by the calling functions
    return {
      id: updatedRequest.id,
      patientId: updatedRequest.patient_id,
      doctorId: updatedRequest.doctor_id,
      requestDate: updatedRequest.created_at,
      status: status, // Use the original status format from the parameter
      reason: updatedRequest.reason
    };
  } catch (error) {
    console.error('Error in updateAccessRequest:', error);
    toast.error(`Failed to update request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

/**
 * Creates an access grant (internal function used after approving a request)
 */
const createAccessGrant = async (
  doctorId: string,
  patientId: string,
  requestId: string,
  recordId?: string,
  grantAllRecords: boolean = false
): Promise<AccessGrant | null> => {
  try {
    const accessGrant = {
      id: uuidv4(),
      request_id: requestId,
      doctor_id: doctorId,
      patient_id: patientId,
      record_id: recordId || null,
      grant_all_records: grantAllRecords,
      created_at: new Date().toISOString()
    };
    
    // Insert into database
    const { data, error } = await supabase
      .from('access_grants')
      .insert(accessGrant)
      .select()
      .single();

    if (error) {
      console.error('Error creating access grant:', error);
      return null;
    }

    return {
        id: data.id,
      requestId: data.request_id,
      doctorId: data.doctor_id,
        patientId: data.patient_id,
      recordId: data.record_id || undefined,
      grantAllRecords: data.grant_all_records,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      revokedAt: data.revoked_at
      };
  } catch (error) {
    console.error('Error in createAccessGrant:', error);
    return null;
  }
};

/**
 * Gets all access grants for a patient
 */
export const getPatientAccessGrants = async (patientId: string): Promise<AccessGrant[]> => {
  try {
    const { data, error } = await supabase
      .from('access_grants')
      .select(`
        *,
        doctor:doctor_id(
          id,
          full_name,
          email,
          specialty
        )
      `)
      .eq('patient_id', patientId)
      .is('revoked_at', null)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching access grants:', error);
      return [];
    }
    
    // Transform to our interface format
    return (data || []).map(grant => ({
      id: grant.id,
      requestId: grant.request_id || undefined,
      doctorId: grant.doctor_id,
      patientId: grant.patient_id,
      recordId: grant.record_id || undefined,
      grantAllRecords: grant.grant_all_records,
      createdAt: grant.created_at,
      expiresAt: grant.expires_at,
      revokedAt: grant.revoked_at,
      doctor: grant.doctor ? {
        fullName: grant.doctor.full_name,
        email: grant.doctor.email,
        specialty: grant.doctor.specialty
      } : undefined
    }));
  } catch (error) {
    console.error('Error in getPatientAccessGrants:', error);
    return [];
  }
};

/**
 * Gets all access grants for a doctor
 */
export const getDoctorAccessGrants = async (doctorId: string): Promise<AccessGrant[]> => {
  try {
    const { data, error } = await supabase
      .from('access_grants')
      .select(`
        *,
        patient:patient_id(
          id,
          full_name,
          email
        )
      `)
      .eq('doctor_id', doctorId)
      .is('revoked_at', null)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching doctor access grants:', error);
      return [];
    }
    
    // Transform to our interface format
    return (data || []).map(grant => ({
      id: grant.id,
      requestId: grant.request_id || undefined,
      doctorId: grant.doctor_id,
      patientId: grant.patient_id,
      recordId: grant.record_id || undefined,
      grantAllRecords: grant.grant_all_records,
      createdAt: grant.created_at,
      expiresAt: grant.expires_at,
      revokedAt: grant.revoked_at,
      patient: grant.patient ? {
        fullName: grant.patient.full_name,
        email: grant.patient.email
      } : undefined
    }));
  } catch (error) {
    console.error('Error in getDoctorAccessGrants:', error);
    return [];
  }
};

/**
 * Revokes an access grant
 */
export const revokeAccessGrant = async (
  grantId: string,
  patientId: string
): Promise<boolean> => {
  try {
    // Verify user is the patient
    const { data: grantData, error: grantError } = await supabase
      .from('access_grants')
      .select('*')
      .eq('id', grantId)
      .eq('patient_id', patientId)
      .single();

    if (grantError || !grantData) {
      console.error('Error verifying access grant:', grantError);
      toast.error('Access grant not found or you do not have permission');
      return false;
    }
    
    // Revoke the grant
    const { error } = await supabase
      .from('access_grants')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', grantId);
    
    if (error) {
      console.error('Error revoking access grant:', error);
      toast.error(`Failed to revoke access: ${error.message}`);
      return false;
    }
    
    toast.success('Access revoked successfully');
    return true;
  } catch (error) {
    console.error('Error in revokeAccessGrant:', error);
    toast.error(`Failed to revoke access: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

/**
 * Checks if a doctor has access to a specific record
 */
export const checkDoctorRecordAccess = async (
  doctorId: string,
  recordId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('access_grants')
      .select('*')
      .eq('doctor_id', doctorId)
      .is('revoked_at', null)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .or(`record_id.eq.${recordId},grant_all_records.eq.true`);
    
    if (error) {
      console.error('Error checking record access:', error);
      return false;
    }
    
    return (data || []).length > 0;
  } catch (error) {
    console.error('Error in checkDoctorRecordAccess:', error);
    return false;
  }
};

/**
 * For development/demo purposes: get mock access requests if database is not available
 */
export const getMockPatientAccessRequests = (patientId: string): AccessRequest[] => {
  return [
    {
      id: '1',
      doctorId: 'doctor1',
      patientId,
      requestAllRecords: true,
      reason: 'Need to review your complete medical history for consultation',
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      doctor: {
        fullName: 'Dr. Sarah Johnson',
        email: 'sarah@hospital.com',
        specialty: 'Cardiology'
      }
    },
    {
      id: '2',
      doctorId: 'doctor2',
      patientId,
      recordId: 'record1',
      requestAllRecords: false,
      reason: 'Need to see your recent blood test',
      status: 'approved',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      doctor: {
        fullName: 'Dr. Michael Chen',
        email: 'michael@hospital.com',
        specialty: 'Hematology'
      }
    },
    {
      id: '3',
      doctorId: 'doctor3',
      patientId,
      requestAllRecords: true,
      reason: 'General consultation',
      status: 'denied',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
      doctor: {
        fullName: 'Dr. Emily Rodriguez',
        email: 'emily@hospital.com',
        specialty: 'General Practice'
      }
    }
  ];
};

/**
 * For development/demo purposes: get mock access grants if database is not available
 */
export const getMockPatientAccessGrants = (patientId: string): AccessGrant[] => {
  return [
    {
      id: '1',
      requestId: '2',
      doctorId: 'doctor2',
      patientId,
      recordId: 'record1',
      grantAllRecords: false,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      doctor: {
        fullName: 'Dr. Michael Chen',
        email: 'michael@hospital.com',
        specialty: 'Hematology'
      }
    },
    {
      id: '2',
      requestId: '4',
      doctorId: 'doctor4',
      patientId,
      grantAllRecords: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      doctor: {
        fullName: 'Dr. James Wilson',
        email: 'james@hospital.com',
        specialty: 'Oncology'
      }
    }
  ];
};

export const getAvailableDoctors = async () => {
  try {
    // First try with Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'doctor');

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      return data;
    }
  } catch (error) {
    console.error('Error fetching doctors from Supabase:', error);
    // Fallback to mock data
  }

  // Return from mock data
  const allUsers = findUserById('all');
  if (Array.isArray(allUsers)) {
    return allUsers.filter(user => user.role === 'doctor');
  }
  
  return [];
};
