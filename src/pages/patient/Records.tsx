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
import { 
  Eye, 
  Download, 
  Search, 
  Copy, 
  CheckCheck,
  Plus,
  Share2,
  UserX,
  Upload
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import FileUploadModal from '@/components/FileUploadModal';
import { 
  getPatientMedicalRecords, 
  getMockMedicalRecords, 
  MedicalRecord 
} from '@/services/medicalRecordsService';
import { grantAccessToRecord, revokeAccessToRecord } from '@/services/web3Service';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { findUserById } from '@/lib/mockData';
import { safeGetUserById } from '@/utils/userUtils';
import { supabase } from '@/integrations/supabase/client';
import { getAvailableDoctors } from '@/services/doctorService';
import FileUpload from '@/components/FileUpload';

const PatientRecords: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCid, setCopiedCid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [showSharedWithModal, setShowSharedWithModal] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  
  // Load medical records on component mount
  useEffect(() => {
    if (!user) return;
    
    // Load available doctors
    const loadDoctors = async () => {
      try {
        // Use the new doctorService to get doctors, specifically including Viraj
        const { data: doctorsData, error } = await getAvailableDoctors();
        
        if (error) {
          console.error('Error fetching doctors:', error);
          throw error;
        }
        
        if (doctorsData && doctorsData.length > 0) {
          console.log('Doctors loaded:', doctorsData.length);
          // Check if Viraj is in the results
          const hasViraj = doctorsData.some(doctor => 
            doctor.email === 'viraj.22320042@viit.ac.in');
          
          if (hasViraj) {
            console.log('Viraj found in doctor list');
          } else {
            console.log('Viraj not found in results, should have been added by service');
          }
          
          setAvailableDoctors(doctorsData);
        } else {
          // Fall back to mock data if no doctors found
          console.log('No doctors found, using mock data');
          const mockDoctors = Array.isArray(findUserById('all')) 
            ? (findUserById('all') as any[]).filter(user => user.role === 'doctor')
            : [];
          
          setAvailableDoctors(mockDoctors);
        }
      } catch (error) {
        console.error('Error in loadDoctors:', error);
        // Fall back to mock data if there's an error
        const mockDoctors = Array.isArray(findUserById('all')) 
          ? (findUserById('all') as any[]).filter(user => user.role === 'doctor')
          : [];
        
        setAvailableDoctors(mockDoctors);
        toast.info('Using demo doctor data - database connection not available');
      }
    };
    
    const loadMedicalRecords = async () => {
      try {
        setIsLoading(true);
        
        // Special case for Ansh user - use the correct ID
        let patientId = user.id;
        const patientName = user.name || "Your Records"; // Store patient name
        
        if (user.email === 'ansh@gmail.com') {
          patientId = 'ansh123'; // Force the correct ID for Ansh
        }
        
        console.log("Loading medical records for patient ID:", patientId);
        
        try {
          // Try to get records from the database
          const dbRecords = await getPatientMedicalRecords(patientId);
          console.log("Records from database:", dbRecords);
          
          // If no records returned or if database error, use mock data
          if (dbRecords.length === 0) {
            console.log("No records returned from database, using mock data");
            const mockRecords = getMockMedicalRecords(patientId);
            setRecords(mockRecords);
            console.log("Mock records:", mockRecords);
          } else {
            setRecords(dbRecords);
          }
        } catch (error) {
          console.error('Error fetching medical records from database:', error);
          // Fall back to mock data if there's an error
          const mockRecords = getMockMedicalRecords(patientId);
          console.log("Using mock records due to error:", mockRecords);
          setRecords(mockRecords);
          
          // Don't show the error toast since we recovered with mock data
          toast.info('Using demo data - database connection not available');
        }
      } catch (error) {
        console.error('Error loading medical records:', error);
        toast.error('Failed to load medical records. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadMedicalRecords();
    loadDoctors();
  }, [user]);
  
  const handleShareWithDoctor = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setSelectedDoctorId('');
    setIsShareModalOpen(true);
  };
  
  const handleShareConfirm = async () => {
    if (!selectedRecord || !selectedDoctorId) {
      toast.error('Please select a doctor to share with');
      return;
    }
    
    setIsSharing(true);
    try {
      // Get the doctor for better UI feedback
      const doctor = safeGetUserById(selectedDoctorId);
      
      // In a real app, we would use the blockchain to grant access
      const txHash = await grantAccessToRecord(selectedRecord.cid, selectedDoctorId);
      
      if (txHash) {
        // Update the local record to reflect the sharing
        const updatedRecords = records.map(r => {
          if (r.id === selectedRecord.id) {
            return {
              ...r,
              sharedWith: [...(r.sharedWith || []), selectedDoctorId]
            };
          }
          return r;
        });
        
        setRecords(updatedRecords);
        
        toast.success(`Record shared with Dr. ${doctor?.name || 'the selected doctor'}`);
        setIsShareModalOpen(false);
      }
    } catch (error) {
      console.error('Error sharing record:', error);
      toast.error('Failed to share record');
    } finally {
      setIsSharing(false);
    }
  };
  
  if (!user) return null;
  
  const filteredRecords = records.filter(record => 
    record.fileName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    record.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleCopyCid = (cid: string) => {
    navigator.clipboard.writeText(cid);
    setCopiedCid(cid);
    toast.success('CID copied to clipboard!');
    
    // Reset the copied state after a short delay
    setTimeout(() => setCopiedCid(null), 2000);
  };
  
  const truncateCid = (cid: string) => {
    return `${cid.slice(0, 6)}...${cid.slice(-4)}`;
  };
  
  const handleView = (record: MedicalRecord) => {
    if (record.fileUrl) {
      window.open(record.fileUrl, '_blank');
      toast.success(`Viewing ${record.fileName}`);
    } else {
      toast.info(`In demo mode: ${record.fileName} would open here`);
    }
  };
  
  const handleDownload = (record: MedicalRecord) => {
    if (record.fileUrl) {
      window.open(record.fileUrl, '_blank');
      toast.success(`Downloading ${record.fileName}`);
    } else {
      toast.info(`In demo mode: ${record.fileName} would download here`);
    }
  };
  
  const handleUploadSuccess = (newRecord: MedicalRecord) => {
    setRecords(prev => [newRecord, ...prev]);
  };
  
  // New function to handle the FileUpload component's callback
  const handleFileUploaded = (file: File, cid: string) => {
    // Create a new record with the uploaded file info
    const newRecord: MedicalRecord = {
      id: `record-${Date.now()}`,
      patientId: user.id,
      fileName: file.name,
      cid: cid,
      uploadDate: new Date().toISOString(),
      tags: ['IPFS', 'Blockchain'],
      sharedWith: []
    };
    
    // Add the new record to our list
    setRecords(prev => [newRecord, ...prev]);
    toast.success(`File ${file.name} uploaded successfully with CID: ${cid}`);
    
    // Set as selected record for immediate sharing option
    setSelectedRecord(newRecord);
    setSelectedDoctorId('');
    setIsShareModalOpen(true); // Open share dialog automatically
  };
  
  // Check if a record is already shared with any doctors
  const isSharedWithDoctors = (record: MedicalRecord) => {
    return record.sharedWith && record.sharedWith.length > 0;
  };
  
  // Function to handle viewing shared doctors
  const handleViewSharedWith = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setShowSharedWithModal(true);
  };
  
  // Function to revoke access for a doctor
  const handleRevokeAccess = async (doctorId: string) => {
    if (!selectedRecord) return;
    
    setIsRevoking(true);
    try {
      // Get the doctor for better UI feedback
      const doctor = safeGetUserById(doctorId);
      const doctorName = doctor?.name || doctorId;
      
      // Call the blockchain service to revoke access
      const txHash = await revokeAccessToRecord(selectedRecord.cid, doctorId);
      
      if (txHash) {
        // Update the local record to reflect the revoked access
        const updatedRecords = records.map(r => {
          if (r.id === selectedRecord.id) {
            return {
              ...r,
              sharedWith: (r.sharedWith || []).filter(id => id !== doctorId)
            };
          }
          return r;
        });
        
        setRecords(updatedRecords);
        
        // Also update the selected record
        if (selectedRecord) {
          setSelectedRecord({
            ...selectedRecord,
            sharedWith: (selectedRecord.sharedWith || []).filter(id => id !== doctorId)
          });
        }
        
        toast.success(`Access revoked for Dr. ${doctorName}`);
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      toast.error('Failed to revoke access');
    } finally {
      setIsRevoking(false);
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {user.name ? `${user.name}'s Medical Records` : 'Medical Records'}
        </h1>
        <Button onClick={() => setIsUploadModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Upload Record
        </Button>
      </div>
      
      {/* Add new upload section with IPFS integration */}
      <div className="mb-6 p-4 border rounded-md bg-gray-50 dark:bg-gray-900">
        <h2 className="text-lg font-medium mb-3 flex items-center">
          <Upload className="mr-2 h-5 w-5" />
          Upload Medical Record (IPFS Storage)
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Files uploaded here will be stored on IPFS and secured with blockchain technology.
          You can share them with doctors immediately after upload.
        </p>
        <FileUpload 
          onFileUpload={handleFileUploaded}
          allowedTypes={['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
          maxSizeMB={10}
          tags={['medical', 'record', 'document']}
          testMode={false}
        />
      </div>
      
      <div className="flex items-center mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search records..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>CID</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.fileName}
                      {isSharedWithDoctors(record) && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-2 h-6 p-0"
                          onClick={() => handleViewSharedWith(record)}
                        >
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Shared ({record.sharedWith?.length})
                          </span>
                        </Button>
                      )}
                    </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{truncateCid(record.cid)}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleCopyCid(record.cid)}
                      >
                        {copiedCid === record.cid ? (
                          <CheckCheck className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(record.uploadDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {record.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-0.5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                          onClick={() => handleView(record)}
                          title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                          onClick={() => handleDownload(record)}
                          title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleShareWithDoctor(record)}
                          title="Share with Doctor"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      )}
      
      {/* File Upload Modal */}
      <FileUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
      
      {/* Share with Doctor Modal - Enhanced with more prominent doctor selection */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Medical Record</DialogTitle>
            <DialogDescription>
              {selectedRecord?.fileName ? (
                <>Your file "{selectedRecord.fileName}" was successfully uploaded. Would you like to share it with a doctor?</>
              ) : (
                <>Select a doctor to share this medical record with</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedRecord && (
              <div className="bg-muted p-3 rounded-md mb-4">
                <p className="font-medium">{selectedRecord.fileName}</p>
                <p className="text-sm text-muted-foreground">{truncateCid(selectedRecord.cid)}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="doctor-select" className="text-sm font-medium">
                Select Doctor
              </label>
              <Select
                value={selectedDoctorId}
                onValueChange={setSelectedDoctorId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {availableDoctors.length > 0 ? (
                    availableDoctors.map((doctor) => (
                      <SelectItem 
                        key={doctor.id} 
                        value={doctor.id}
                        className={
                          (doctor.name === 'Dr. Rohan Sharma' || doctor.name === 'Dr. Viraj Patil' || doctor.email === 'viraj.22320042@viit.ac.in') 
                            ? 'bg-blue-50' 
                            : ''
                        }
                      >
                        <div className="flex flex-col">
                          <span className={
                            (doctor.name === 'Dr. Rohan Sharma' || doctor.name === 'Dr. Viraj Patil' || doctor.email === 'viraj.22320042@viit.ac.in') 
                              ? 'font-medium' 
                              : ''
                          }>
                            {doctor.name}
                          </span>
                          {doctor.specialization && (
                            <span className="text-xs text-muted-foreground">
                              {doctor.specialization} - {doctor.hospital || 'General Hospital'}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-doctor" disabled>No doctors available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsShareModalOpen(false)}
              disabled={isSharing}
            >
              {selectedRecord?.fileName ? "Skip Sharing" : "Cancel"}
            </Button>
            <Button 
              onClick={handleShareConfirm}
              disabled={!selectedDoctorId || isSharing || selectedDoctorId === 'no-doctor'}
            >
              {isSharing ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Record
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add the Shared With Modal */}
      <Dialog open={showSharedWithModal} onOpenChange={setShowSharedWithModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Doctors With Access</DialogTitle>
            <DialogDescription>
              These doctors have been granted access to {selectedRecord?.fileName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedRecord && selectedRecord.sharedWith && selectedRecord.sharedWith.length > 0 ? (
              <div className="space-y-2">
                {selectedRecord.sharedWith.map((doctorId) => {
                  const doctor = safeGetUserById(doctorId);
                  return (
                    <div key={doctorId} className="flex justify-between items-center p-3 bg-muted rounded-md">
                      <div>
                        <p className="font-medium">{doctor?.name || doctorId}</p>
                        {doctor?.specialization && (
                          <p className="text-sm text-muted-foreground">
                            {doctor.specialization} - {doctor.hospital || 'General Hospital'}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleRevokeAccess(doctorId)}
                        disabled={isRevoking}
                      >
                        {isRevoking ? (
                          <div className="animate-spin h-4 w-4 border-2 border-white rounded-full" />
                        ) : (
                          <>
                            <UserX className="h-4 w-4 mr-1" />
                            Revoke Access
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                This record is not shared with any doctors
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSharedWithModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientRecords;
