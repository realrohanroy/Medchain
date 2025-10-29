// This is a simple in-memory service to handle file sharing between doctors and patients
// In a real application, this would use a database or cloud storage

export interface SharedFile {
  id: string;
  doctorId: string;
  patientId: string;
  fileName: string;
  fileType: string;
  description: string;
  sharedAt: string;
  fileSize?: number;
}

// In-memory storage for shared files
let sharedFiles: SharedFile[] = [
  {
    id: 'file1',
    doctorId: 'doctor1',
    patientId: 'ansh123',
    fileName: 'Medical Report.pdf',
    fileType: 'application/pdf',
    description: 'Annual check-up results',
    sharedAt: new Date().toISOString()
  },
  {
    id: 'file2',
    doctorId: 'doctor1',
    patientId: 'ansh123',
    fileName: 'Blood Test Results.jpg',
    fileType: 'image/jpeg',
    description: 'Blood work from last visit',
    sharedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];

/**
 * Get all files shared by a doctor
 */
export const getFilesByDoctor = (doctorId: string): SharedFile[] => {
  return sharedFiles.filter(file => file.doctorId === doctorId);
};

/**
 * Get all files shared with a patient
 */
export const getFilesByPatient = (patientId: string): SharedFile[] => {
  return sharedFiles.filter(file => file.patientId === patientId);
};

/**
 * Share a file from doctor to patient
 */
export const shareFile = (file: Omit<SharedFile, 'id' | 'sharedAt'>): SharedFile => {
  const newFile: SharedFile = {
    ...file,
    id: Math.random().toString(36).substring(2),
    sharedAt: new Date().toISOString()
  };
  
  sharedFiles.unshift(newFile); // Add to beginning of array
  return newFile;
};

/**
 * Delete a shared file
 */
export const deleteFile = (fileId: string): boolean => {
  const initialLength = sharedFiles.length;
  sharedFiles = sharedFiles.filter(file => file.id !== fileId);
  return initialLength > sharedFiles.length;
};

// Mock patients data
export const mockPatients = [
  { id: 'ansh123', name: 'Ansh Kumar', email: 'ansh@gmail.com' }
];

// Mock doctors data
export const mockDoctors = [
  { id: 'doctor1', name: 'Dr. Emily Chen', specialization: 'Cardiology' },
  { id: 'doctor2', name: 'Dr. James Wilson', specialization: 'Neurology' }
]; 