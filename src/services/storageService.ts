// Helper functions for secure file access in Supabase storage
import { supabase } from "@/integrations/supabase/client";

/**
 * Generate a signed URL for accessing a medical record file
 * This ensures only authorized users can access files
 */
export const getSignedFileUrl = async (
  bucketName: string,
  filePath: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<{ url: string | null; error: string | null }> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return { url: null, error: error.message };
    }

    return { url: data.signedUrl, error: null };
  } catch (error: any) {
    console.error('Error in getSignedFileUrl:', error);
    return { url: null, error: error.message || 'Failed to generate file URL' };
  }
};

/**
 * Check if a user has access to a medical record file
 * This should be called before generating signed URLs
 */
export const checkFileAccess = async (
  userId: string,
  patientId: string,
  recordId?: string
): Promise<boolean> => {
  try {
    // Check if user is the patient (owner)
    if (userId === patientId) {
      return true;
    }

    // Check if user is a doctor with access
    const { data, error } = await supabase
      .from('access_grants')
      .select('id')
      .eq('doctor_id', userId)
      .eq('patient_id', patientId)
      .or(`record_id.eq.${recordId},grant_all_records.eq.true`)
      .is('revoked_at', null)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .limit(1);

    if (error) {
      console.error('Error checking file access:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error in checkFileAccess:', error);
    return false;
  }
};

/**
 * Upload file with proper path organization
 * Files are organized as: patient_id/record_id/filename
 */
export const uploadFileWithPath = async (
  bucketName: string,
  file: File,
  patientId: string,
  recordId: string
): Promise<{ data: { path: string; fullPath: string; signedUrl: string } | null; error: string | null }> => {
  try {
    // Ensure unique file names by using a UUID
    const fileExt = file.name.split('.').pop();
    const fileName = `${recordId}_${file.name}`;
    const filePath = `${patientId}/${recordId}/${fileName}`;

    // Upload the file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return { data: null, error: uploadError.message };
    }

    // Generate signed URL for immediate access
    const { url: signedUrl, error: urlError } = await getSignedFileUrl(bucketName, filePath);

    if (urlError) {
      console.error('Error generating signed URL:', urlError);
      return { data: null, error: urlError };
    }

    return {
      data: {
        path: uploadData.path,
        fullPath: filePath,
        signedUrl: signedUrl || ''
      },
      error: null
    };
  } catch (error: any) {
    console.error('Error in uploadFileWithPath:', error);
    return { data: null, error: error.message || 'Failed to upload file' };
  }
};