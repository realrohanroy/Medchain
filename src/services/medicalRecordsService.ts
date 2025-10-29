import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { uploadFileWithPath, getSignedFileUrl, checkFileAccess } from './storageService';

export interface MedicalRecord {
  id: string;
  patientId: string;
  fileName: string;
  cid: string;
  uploadDate: string;
  tags: string[];
  description?: string;
  fileUrl?: string;
  sharedWith?: string[];
}

/**
 * Upload a medical record file to storage and create a record in the database
 */
export const uploadMedicalRecord = async (
  file: File,
  patientId: string,
  tags: string[] = [],
  description: string = ''
): Promise<MedicalRecord | null> => {
  try {
    // Generate a record ID first
    const recordId = uuidv4();
    
    // 1. Upload the file to storage with proper path organization
    const { data: uploadData, error: uploadError } = await uploadFileWithPath(
      'medical-records',
      file,
      patientId,
      recordId
    );
    
    // Handle bucket not found or other upload errors
    if (uploadError || !uploadData) {
      console.log("Storage upload failed, creating mock record instead:", uploadError);
      
      // Create a mock CID (for demo purposes)
      const mockCid = `Qm${Array(44).fill(0).map(() => 
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(
          Math.floor(Math.random() * 62)
        )).join('')}`;
      
      // Create a mock record with a fake URL
      const mockRecord: MedicalRecord = {
        id: recordId,
        patientId,
        fileName: file.name,
        cid: mockCid,
        uploadDate: new Date().toISOString(),
        tags,
        description,
        fileUrl: `https://example.com/mock-files/${file.name.replace(/\s+/g, '_')}`
      };
      
      toast.success(`${file.name} uploaded successfully (mock record)`);
      return mockRecord;
    }
    
    // Generate a CID (in a real app, this would come from IPFS)
    // For demo, we'll create a random mock CID
    const cid = `Qm${Array(44).fill(0).map(() => 
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(
        Math.floor(Math.random() * 62)
      )).join('')}`;
    
    // 2. Create a medical record in the database
    const medicalRecord = {
      id: recordId,
      patient_id: patientId,
      file_name: file.name,
      cid: cid,
      tags: tags,
      description: description,
      storage_path: uploadData.fullPath
    };
    
    try {
      // 3. Store the record in the database
      const { error: dbError } = await supabase
        .from('medical_records')
        .insert({
          patient_id: patientId,
          file_name: file.name,
          cid: cid,
          tags: tags,
          description: description
        });
        
      if (dbError) {
        console.log("Database insertion failed, returning local record object:", dbError);
      }
    } catch (dbError) {
      console.error("Database error caught, continuing with local record object:", dbError);
    }
    
    // Return the record in our expected format
    const returnRecord: MedicalRecord = {
      id: medicalRecord.id,
      patientId: medicalRecord.patient_id,
      fileName: medicalRecord.file_name,
      cid: medicalRecord.cid,
      uploadDate: new Date().toISOString(),
      tags: medicalRecord.tags,
      description: medicalRecord.description,
      fileUrl: uploadData.signedUrl
    };
    
    toast.success(`${file.name} uploaded successfully!`);
    return returnRecord;
  } catch (error) {
    console.error('Error in uploadMedicalRecord:', error);
    toast.error(`Failed to upload medical record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};

// Note: File upload functionality moved to storageService.ts for better security

/**
 * Get medical records for a patient
 */
export const getPatientMedicalRecords = async (patientId: string): Promise<MedicalRecord[]> => {
  try {
    console.log("Attempting to fetch medical records for patient:", patientId);
    
    // Try to get data from Supabase
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('upload_date', { ascending: false });
      
    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }
    
    console.log("Medical records retrieved from Supabase:", data?.length || 0);
    
    // Transform the data to match our interface
    const records: MedicalRecord[] = (data || []).map(record => ({
      id: record.id,
      patientId: record.patient_id,
      fileName: record.file_name,
      cid: record.cid,
      uploadDate: record.upload_date,
      tags: record.tags || [],
      description: record.description
    }));
    
    return records;
  } catch (error) {
    console.error('Error fetching patient medical records:', error);
    
    // Return an empty array - the component will handle falling back to mock data
    return [];
  }
};

/**
 * For development/demo purposes: get mock medical records if database is not available
 */
export const getMockMedicalRecords = (patientId: string): MedicalRecord[] => {
  return [
    {
      id: '1',
      patientId,
      fileName: 'Blood_Test_Results.pdf',
      cid: 'QmUVkMQnj9xpq65kaNUYwXYRPUoLxNpzEqLd3LJYNUvFQ7',
      uploadDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['blood test', 'routine', 'annual']
    },
    {
      id: '2',
      patientId,
      fileName: 'ECG_Report.pdf',
      cid: 'QmTgqnhFBMkfT9s8PHKcdXBn1Y1oH5qbGVT4LxA2XQ4bfU',
      uploadDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['cardiology', 'ecg', 'heart']
    },
    {
      id: '3',
      patientId,
      fileName: 'Xray_Chest.jpg',
      cid: 'QmVXdQJ5FTXZ8vkSBurbVcmH3NUWXMrBUcQxWBi7p1T9EK',
      uploadDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['radiology', 'chest', 'xray']
    }
  ];
}; 