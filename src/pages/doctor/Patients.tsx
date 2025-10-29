import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Upload, User, Plus, Loader2 } from 'lucide-react';
import { getUserMedicalRecords } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDoctorPatients } from '@/services/patientService';

const DoctorPatients: React.FC = () => {
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [showPatientDialog, setShowPatientDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileTags, setFileTags] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  
  useEffect(() => {
    const loadPatients = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await getDoctorPatients(user.id);
        
        if (error) {
          throw new Error(error);
        }
        
        setPatients(data);
      } catch (error) {
        console.error('Error loading patients:', error);
        toast.error('Failed to load patients');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPatients();
    
    // Set up WebSocket message listener
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        console.log('WebSocket message received in DoctorPatients:', event.data);
        const message = JSON.parse(event.data);
        
        if (message.type === 'APPOINTMENT_CREATED' || message.type === 'APPOINTMENT_UPDATED') {
          // Reload patients list as it may have changed due to new appointment
          loadPatients();
          
          // Show toast notification for new appointments
          if (message.type === 'APPOINTMENT_CREATED') {
            toast.info('New patient added from appointment');
          }
        } else if (message.type === 'ACCESS_REQUEST_UPDATED') {
          // Reload patients list if an access request was approved
          if (message.payload?.status === 'Approved') {
            loadPatients();
          }
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };
    
    window.addEventListener('message', handleWebSocketMessage);
    
    return () => {
      window.removeEventListener('message', handleWebSocketMessage);
    };
  }, [user]);
  
  if (!user) return null;
  
  const filteredPatients = patients.filter(patient => 
    (patient.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (patient.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (patient.wallet?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );
  
  const truncateWallet = (wallet: string) => {
    if (!wallet) return 'N/A';
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };
  
  const getPatientRecordCount = (patientId: string) => {
    return getUserMedicalRecords(patientId).length;
  };
  
  const getLastUploadDate = (patientId: string) => {
    const records = getUserMedicalRecords(patientId);
    
    if (records.length === 0) {
      return 'No records';
    }
    
    // Sort by upload date (most recent first)
    const sortedRecords = [...records].sort((a, b) => 
      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );
    
    return new Date(sortedRecords[0].uploadDate).toLocaleDateString();
  };
  
  const handleViewPatient = (patient: any) => {
    setSelectedPatient(patient);
    setShowPatientDialog(true);
  };
  
  const handleShowUploadDialog = (patient: any) => {
    setSelectedPatient(patient);
    setShowUploadDialog(true);
  };
  
  const handleAddPatient = () => {
    toast.success('Add patient functionality would be implemented here');
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleUpload = () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    
    setIsUploading(true);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsUploading(false);
          toast.success(`File ${selectedFile.name} uploaded successfully for ${selectedPatient?.name}`);
          setShowUploadDialog(false);
          setSelectedFile(null);
          setFileTags('');
          setUploadProgress(0);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Patients</h1>
        <Button onClick={handleAddPatient}>
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>
      
      <div className="flex items-center mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search patients..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading patients...</span>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Last Upload</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.name || patient.full_name}</TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell className="font-mono">{truncateWallet(patient.wallet)}</TableCell>
                    <TableCell>{getPatientRecordCount(patient.id)}</TableCell>
                    <TableCell>{getLastUploadDate(patient.id)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPatient(patient)}
                        >
                          <User className="mr-2 h-4 w-4" />
                          Details
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleShowUploadDialog(patient)}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No patients found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Patient Details Dialog */}
      <Dialog open={showPatientDialog} onOpenChange={setShowPatientDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Patient Information</DialogTitle>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="py-4 space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex items-center justify-center">
                  <div className="bg-primary/10 rounded-full w-24 h-24 flex items-center justify-center">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedPatient.name || selectedPatient.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedPatient.email}</p>
                  <p className="text-sm font-mono mt-1">{selectedPatient.wallet || 'Wallet not available'}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline">
                      {getPatientRecordCount(selectedPatient.id)} Records
                    </Badge>
                    <Badge variant="outline">
                      Patient Since: {selectedPatient.created_at ? new Date(selectedPatient.created_at).toLocaleDateString() : '2025-01-15'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm">
                      <p className="font-medium mb-1">Contact Information</p>
                      <p className="text-muted-foreground">Phone: +1 (555) 123-4567</p>
                      <p className="text-muted-foreground">Address: 123 Main St, Anytown, USA</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm">
                      <p className="font-medium mb-1">Medical Information</p>
                      <p className="text-muted-foreground">Blood Type: A+</p>
                      <p className="text-muted-foreground">Allergies: None</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Recent Activity</p>
                <ul className="text-sm space-y-2">
                  <li className="text-muted-foreground">- Record uploaded on {new Date().toLocaleDateString()}</li>
                  <li className="text-muted-foreground">- Appointment scheduled for 05/15/2025</li>
                </ul>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-between w-full">
              <Button variant="outline" onClick={() => setShowPatientDialog(false)}>Close</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setShowPatientDialog(false);
                  toast.success('Appointment feature would be implemented here');
                }}>
                  Schedule Appointment
                </Button>
                <Button onClick={() => {
                  setShowPatientDialog(false);
                  if (selectedPatient) {
                    handleShowUploadDialog(selectedPatient);
                  }
                }}>
                  Upload Records
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Medical Record</DialogTitle>
            <DialogDescription>
              {selectedPatient && `Upload a medical record for ${selectedPatient.name}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="border-2 border-dashed rounded-md p-6 text-center">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Click to select or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: PDF, JPG, PNG, DICOM
                  </p>
                </div>
              </label>
            </div>
            
            {selectedFile && (
              <div className="bg-muted rounded-md p-3">
                <p className="text-sm font-medium">Selected file:</p>
                <p className="text-sm truncate">{selectedFile.name}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags (comma separated)</label>
              <Input
                placeholder="e.g., Blood Test, Lab Results, Routine Check"
                value={fileTags}
                onChange={(e) => setFileTags(e.target.value)}
              />
            </div>
            
            {isUploading && (
              <div className="space-y-2">
                <div className="text-sm flex justify-between">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorPatients;
