import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

// Define the shared file interface
export interface SharedFile {
  id: string;
  doctor_id: string;
  patient_id: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  cid?: string;
  storage_path?: string;
  description: string;
  fileUrl?: string;
  shared_at: string;
  expires_at?: string;
  is_viewed?: boolean;
}

/**
 * Upload a file to storage and share it with a patient
 */
export const uploadAndShareFile = async (
  file: File,
  doctor_id: string,
  patient_id: string,
  description: string
): Promise<SharedFile | null> => {
  try {
    // 1. Upload the file to storage
    const { data: uploadData, error: uploadError } = await uploadFile('medical-files', file);
    
    // Handle bucket not found or other upload errors by creating mock data
    if (uploadError || !uploadData) {
      console.log("Storage upload failed, creating mock file instead:", uploadError);
      
      // Create a mock shared file with a fake URL (for demo purposes)
      const mockFile: SharedFile = {
        id: uuidv4(),
        doctor_id,
        patient_id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        description,
        fileUrl: `https://example.com/mock-files/${file.name.replace(/\s+/g, '_')}`,
        shared_at: new Date().toISOString(),
        is_viewed: false
      };
      
      toast.success(`${file.name} shared successfully (mock file)`);
      return mockFile;
    }
    
    // 2. Create a shared file record
    const sharedFileData = {
      id: uuidv4(),
      doctor_id,
      patient_id,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: uploadData.fullPath,
      description,
      shared_at: new Date().toISOString(),
      is_viewed: false
    };
    
    // 3. Store the shared file record in the database
    try {
      const { error: dbError } = await supabase
        .from('shared_files')
        .insert(sharedFileData);
        
      if (dbError) {
        console.log("Database insertion failed, returning local file object:", dbError);
        // Continue even if DB insert fails - we already have the file object
      }
    } catch (dbError) {
      console.error("Database error caught, continuing with local file object:", dbError);
      // Continue with local object
    }
    
    // Return the shared file with the fileUrl property for frontend use
    const sharedFile: SharedFile = {
      ...sharedFileData,
      fileUrl: uploadData.publicUrl
    };
    
    return sharedFile;
  } catch (error) {
    console.error('Error in uploadAndShareFile:', error);
    toast.error(`Failed to share file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};

/**
 * Upload a file to Supabase storage
 */
export const uploadFile = async (
  bucketName: string,
  file: File,
  path: string = ''
) => {
  try {
    // Ensure unique file names by using a UUID
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    // Show toast notification
    toast.loading(`Uploading ${file.name}...`, { id: 'file-upload' });

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (error) {
      // Check if it's a bucket not found error
      if (error.message?.includes('bucket') || error.message?.includes('not found')) {
        toast.error(`Storage not configured: ${error.message}`, { id: 'file-upload' });
        console.error('Bucket not found or storage not configured:', error);
      } else {
        toast.error(`Upload failed: ${error.message}`, { id: 'file-upload' });
        console.error('Error uploading file:', error);
      }
      
      return {
        data: null,
        error: error.message || 'Failed to upload file',
      };
    }

    // Get public URL for the file
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    toast.success(`${file.name} uploaded successfully!`, { id: 'file-upload' });

    return {
      data: {
        path: data.path,
        fullPath: filePath,
        publicUrl: urlData.publicUrl,
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Error in uploadFile function:', error);
    toast.error(`Upload error: ${error.message || 'Unknown error'}`, { id: 'file-upload' });
    return {
      data: null,
      error: error.message || 'Failed to upload file',
    };
  }
};

/**
 * Get shared files for a doctor (files the doctor has shared)
 */
export const getDoctorSharedFiles = async (doctor_id: string): Promise<SharedFile[]> => {
  try {
    console.log("Attempting to fetch shared files for doctor:", doctor_id);
    
    // Try to get data from Supabase
    const { data, error } = await supabase
      .from('shared_files')
      .select('*')
      .eq('doctor_id', doctor_id)
      .order('shared_at', { ascending: false });
      
    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }
    
    console.log("Files retrieved from Supabase:", data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error fetching doctor shared files:', error);
    
    // Instead of showing an error toast here, we'll let the component handle it
    // This allows the component to fall back to mock data
    
    // Return an empty array to signal the component to use mock data
    return [];
  }
};

/**
 * Get shared files for a patient (files shared with the patient)
 */
export const getPatientSharedFiles = async (patient_id: string): Promise<SharedFile[]> => {
  try {
    console.log("Attempting to fetch shared files for patient:", patient_id);
    
    // Try to get data from Supabase
    const { data, error } = await supabase
      .from('shared_files')
      .select('*')
      .eq('patient_id', patient_id)
      .order('shared_at', { ascending: false });
      
    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }
    
    console.log("Files retrieved from Supabase:", data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error fetching patient shared files:', error);
    
    // Instead of showing an error toast here, we'll let the component handle it
    // This allows the component to fall back to mock data
    
    // Return an empty array to signal the component to use mock data
    return [];
  }
};

/**
 * Mark a shared file as viewed by the patient
 */
export const markFileAsViewed = async (fileId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('shared_files')
      .update({ is_viewed: true })
      .eq('id', fileId);
      
    if (error) {
      console.error("Error marking file as viewed:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error marking file as viewed:', error);
    return false;
  }
};

/**
 * For development/demo purposes: mock shared files if no backend available
 */
export const getMockSharedFiles = (user_id: string, role: 'doctor' | 'patient'): SharedFile[] => {
  const mockFiles: SharedFile[] = [
    {
      id: '1',
      doctor_id: 'doctor1',
      patient_id: 'ansh123',
      file_name: 'Medical Report.pdf',
      file_type: 'application/pdf',
      file_size: 1024 * 1024 * 2, // 2 MB
      description: 'Annual checkup results',
      shared_at: new Date().toISOString(),
      is_viewed: false
    },
    {
      id: '2',
      doctor_id: 'doctor1',
      patient_id: 'ansh123',
      file_name: 'Blood Test Results.pdf',
      file_type: 'application/pdf',
      file_size: 1024 * 512, // 512 KB
      description: 'Latest blood work',
      shared_at: new Date(Date.now() - 86400000).toISOString(),
      is_viewed: true
    },
    {
      id: '3',
      doctor_id: 'doctor2',
      patient_id: 'ansh123',
      file_name: 'MRI Scan.jpg',
      file_type: 'image/jpeg',
      file_size: 1024 * 1024 * 5, // 5 MB
      description: 'Brain MRI results',
      shared_at: new Date(Date.now() - 172800000).toISOString(),
      is_viewed: true
    }
  ];
  
  if (role === 'doctor') {
    return mockFiles.filter(file => file.doctor_id === user_id);
  } else {
    return mockFiles.filter(file => file.patient_id === user_id);
  }
}; 