import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { getDoctorPatients } from '@/lib/mockData';
import { toast } from 'sonner';
import { FileText, Upload, Download, FileUp, File as FileIcon, X, ClipboardCopy } from 'lucide-react';
import { 
  uploadAndShareFile, 
  getDoctorSharedFiles, 
  getMockSharedFiles, 
  SharedFile as SharedFileType 
} from '@/services/fileService';
import { Badge } from '@/components/ui/badge';

interface Patient {
  id: string;
  name: string;
  email: string;
  role: 'patient';
}

// Fallback mock shared files data
const mockSharedFiles: SharedFileType[] = [
  {
    id: '1',
    doctor_id: 'doctor1',
    patient_id: 'patient1',
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
    patient_id: 'patient2',
    file_name: 'Blood Test Results.pdf',
    file_type: 'application/pdf',
    file_size: 1024 * 512, // 512 KB
    description: 'Latest blood work',
    shared_at: new Date(Date.now() - 86400000).toISOString(),
    is_viewed: false
  }
];

const ShareFiles: React.FC = () => {
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [description, setDescription] = useState('');
  const [sharedFiles, setSharedFiles] = useState<SharedFileType[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    const loadInitialData = async () => {
      try {
        setError(null);
        setIsLoading(true);

        // Set a single patient instead of loading from API
        setPatients([
          { 
            id: 'ansh123', 
            name: 'Ansh Kumar', 
            email: 'ansh@gmail.com', 
            role: 'patient' 
          }
        ]);

        // Load shared files from database, fall back to mock data if needed
        try {
          const doctorId = user.id;
          const files = await getDoctorSharedFiles(doctorId);
          
          // If no files returned (possibly due to no DB connection), use mock data
          if (files.length === 0) {
            const mockData = getMockSharedFiles(doctorId, 'doctor');
            setSharedFiles(mockData);
          } else {
            setSharedFiles(files);
          }
        } catch (error) {
          console.error('Error loading shared files:', error);
          // Fall back to mock data
          const mockData = getMockSharedFiles(user.id, 'doctor');
          setSharedFiles(mockData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data. Please try again later.');
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();

    // WebSocket listener for file sharing updates
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data);

        if (data.type === 'FILE_SHARED' && data.payload.doctor_id === user.id) {
          // Update the shared files list
          setSharedFiles(prevFiles => [data.payload, ...prevFiles]);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };

    window.addEventListener('message', handleWebSocketMessage);
    return () => window.removeEventListener('message', handleWebSocketMessage);
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleShareFile = async () => {
    if (!selectedPatient || !selectedFile || !description) {
      toast.error('Please select a patient, upload a file, and provide a description');
      return;
    }

    try {
      setUploadingFile(true);

      // Upload and share the file using the fileService with snake_case parameters
      const sharedFile = await uploadAndShareFile(
        selectedFile,
        user!.id,
        selectedPatient,
        description
      );

      // If file was successfully shared
      if (sharedFile) {
        // Send WebSocket message
        sendMessage({
          type: 'FILE_SHARED',
          payload: sharedFile
        });

        // Update local state
        setSharedFiles(prevFiles => [sharedFile, ...prevFiles]);

        // Reset form
        setSelectedPatient('');
        setSelectedFile(null);
        setDescription('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Success toast is handled in the uploadAndShareFile function
      } else {
        // If for some reason the return is null, show a custom error
        toast.error('Failed to share file. Please check your input and try again.');
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      toast.error('Failed to share file. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDownload = (file: SharedFileType) => {
    // Check if we have a fileUrl to download
    if (file.fileUrl) {
      window.open(file.fileUrl, '_blank');
      toast.success(`Downloading ${file.file_name}...`);
    } else {
      toast.info(`Downloading ${file.file_name}`);
      // In a mock environment, there's no actual file to download
    }
  };

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper function to format file sizes
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to get patient name from ID
  const getPatientName = (patientId: string, patients: Patient[]) => {
    const patient = patients.find(p => p.id === patientId);
    return patient?.name || 'Unknown Patient';
  };

  // Helper function to copy link to clipboard
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center p-4 border border-red-200 rounded bg-red-50 text-red-700">
          <p>{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

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
                  {patients.length > 0 ? (
                    patients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No patients registered
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {patients.length === 0 && (
                <div className="text-sm text-muted-foreground mt-1">
                  No patients are currently registered with you.
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Upload File</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              
              {!selectedFile ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"
                  onClick={triggerFileInput}
                >
                  <FileUp className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Click to upload a file</p>
                  <p className="text-xs text-gray-400">PDF, DOC, Images accepted</p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <FileIcon className="h-5 w-5 text-primary mr-2" />
                    <div>
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearSelectedFile}
                  >
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
              onClick={handleShareFile} 
              className="w-full"
              disabled={!selectedPatient || !selectedFile || !description || uploadingFile}
            >
              {uploadingFile ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Share File
                </>
              )}
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
          <div className="space-y-4">
            {sharedFiles.length > 0 ? (
              sharedFiles.map((file) => {
                return (
                  <div key={file.id} className="flex flex-col">
                    <Card className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-base">
                            {file.file_name}
                          </CardTitle>
                          <Badge variant="outline" className="ml-2">
                            {formatFileSize(file.file_size || 0)}
                          </Badge>
                        </div>
                        <CardDescription>
                          Shared with: {getPatientName(file.patient_id, patients)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm mb-2">{file.description}</p>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Shared: {formatDate(file.shared_at)}</span>
                          <span>{file.is_viewed ? 'Viewed ✓' : 'Not viewed'}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2 border-t flex justify-between">
                        <Button
                          variant="outline" 
                          size="sm"
                          asChild
                        >
                          <a 
                            href={file.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            View File
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyLink(file.fileUrl || '')}
                        >
                          <ClipboardCopy className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No files shared yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShareFiles; 