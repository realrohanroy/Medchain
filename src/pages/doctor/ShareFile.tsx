import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { FileUp, X, FileText, Download } from 'lucide-react';
import { uploadAndShareFile, getDoctorSharedFiles, SharedFile as SharedFileType, getMockSharedFiles } from '@/services/fileService';

const ShareFile: React.FC = () => {
  const { user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sharedFiles, setSharedFiles] = useState<SharedFileType[]>([]);
  const [patients, setPatients] = useState<{id: string, name: string, email: string}[]>([
    { id: 'ansh123', name: 'Ansh Kumar', email: 'ansh@gmail.com' }
  ]);
  
  // Load shared files
  useEffect(() => {
    const loadFiles = async () => {
      try {
        // In a real app, you would use the actual user ID
        const doctorId = user?.id || 'doctor1';
        
        // Try to get files from the database, fall back to mock data if needed
        const files = await getDoctorSharedFiles(doctorId);
        
        // If no files returned (possibly due to no DB connection), use mock data
        if (files.length === 0) {
          const mockFiles = getMockSharedFiles(doctorId, 'doctor');
          setSharedFiles(mockFiles);
        } else {
          setSharedFiles(files);
        }
      } catch (error) {
        console.error('Error loading shared files:', error);
        // Fall back to mock data
        const doctorId = user?.id || 'doctor1';
        const mockFiles = getMockSharedFiles(doctorId, 'doctor');
        setSharedFiles(mockFiles);
      }
    };
    
    loadFiles();
  }, [user]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleShareFile = async () => {
    if (!selectedPatient || !selectedFile || !description) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const doctorId = user?.id || 'doctor1';
      
      // Use the fileService to upload and share the file
      const newFile = await uploadAndShareFile(
        selectedFile,
        doctorId, 
        selectedPatient,
        description
      );
      
      if (newFile) {
        // Update the UI with the new file at the top of the list
        setSharedFiles(prev => [newFile, ...prev]);
        
        // Reset the form
        setSelectedPatient('');
        setDescription('');
        setSelectedFile(null);
        
        // Success toast is handled in the uploadAndShareFile function
      } else {
        // If for some reason the return is null, show a custom error
        toast.error('Failed to share file. Please try again.');
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      toast.error('Failed to share file');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDownload = (file: SharedFileType) => {
    // Check if we have a fileUrl to download
    if (file.fileUrl) {
      window.open(file.fileUrl, '_blank');
      toast.success(`Downloading ${file.fileName}...`);
    } else {
      toast.info(`Downloading ${file.fileName}...`);
      // In a mock environment, there's no actual file to download
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Share Files with Patients</CardTitle>
          <CardDescription>Upload and share medical files with your patients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Patient</label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map(patient => (
                    <SelectItem key={patient.id} value={patient.id}>{patient.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload File</label>
              <input 
                type="file" 
                id="file-upload" 
                className="hidden"
                onChange={handleFileChange}
              />
              
              {!selectedFile ? (
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50">
                    <FileUp className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Click to upload a file</p>
                    <p className="text-xs text-gray-400">PDF, DOC, Images accepted</p>
                  </div>
                </label>
              ) : (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter file description"
              />
            </div>
            
            <Button 
              className="w-full"
              onClick={handleShareFile}
              disabled={!selectedPatient || !selectedFile || !description || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Share File'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recently Shared Files</CardTitle>
          <CardDescription>Files you've shared with patients</CardDescription>
        </CardHeader>
        <CardContent>
          {sharedFiles.length > 0 ? (
            <div className="space-y-4">
              {sharedFiles.map(file => {
                const patient = patients.find(p => p.id === file.patientId);
                return (
                  <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{file.fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          Shared with {patient?.name || 'Unknown Patient'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(file.sharedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(file)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No files shared yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShareFile; 