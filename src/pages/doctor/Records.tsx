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
  Search, 
  Eye, 
  Download,
  FileCheck,
  Clock,
  Upload,
  Share2,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { findUserById } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getUserId, getUserName } from '@/utils/userUtils';
import FileUpload from '@/components/FileUpload';
import { grantAccessToRecord, revokeAccessToRecord } from '@/services/web3Service';
import { getUserMedicalRecords } from '@/lib/mockData';
import { getPatientMedicalRecords, getMockMedicalRecords } from '@/services/medicalRecordsService';

// Mock data for medical records shared with the doctor
const mockSharedRecords = [
  {
    id: 'sr1',
    fileName: 'Blood Test Results.pdf',
    patientId: 'user1',
    dateShared: '2025-04-15',
    cid: 'Qma1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
    tags: ['Blood Test', 'Lab Results']
  },
  {
    id: 'sr2',
    fileName: 'X-Ray Image.jpg',
    patientId: 'user2',
    dateShared: '2025-04-10',
    cid: 'Qmb2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1',
    tags: ['X-Ray', 'Chest']
  },
  {
    id: 'sr3',
    fileName: 'Prescription.pdf',
    patientId: 'user1',
    dateShared: '2025-04-05',
    cid: 'Qmc3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2',
    tags: ['Prescription', 'Medication']
  }
];

const DoctorRecords: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedPatientForShare, setSelectedPatientForShare] = useState<string>('');
  const [availablePatients, setAvailablePatients] = useState<any[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Effect to load available doctors and shared records
  useEffect(() => {
    if (!user) return;
    
    // Load doctors and shared records
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load available patients for sharing instead of doctors
        // In a real app, we would fetch this from an API
        const mockPatients = [
          { id: 'ansh123', name: 'Ansh Kumar', email: 'ansh@gmail.com' }
        ];
        setAvailablePatients(mockPatients);
        
        // Load shared records for this doctor
        console.log('Loading records shared with doctor:', user.id, user.email);
        
        let sharedRecords = [];
        
        try {
          // Try to get records from the database where this doctor has been granted access
          if (user.email === 'viraj.22320042@viit.ac.in') {
            console.log('Checking for records shared with Viraj');
            try {
              // For Viraj, check shared records 
              const dbRecords = await getPatientMedicalRecords('all');
              console.log('Retrieved records:', dbRecords.length);
              
              // Filter records that are shared with this doctor
              // Use user.id or a fallback doctor_viraj ID for Viraj
              const doctorId = user.id || 'doctor_viraj';
              
              sharedRecords = dbRecords.filter(record => {
                // Check if record has sharedWith property and if it includes this doctor
                return record.sharedWith && 
                       Array.isArray(record.sharedWith) && 
                       record.sharedWith.includes(doctorId);
              });
              
              console.log('Records shared with Viraj:', sharedRecords.length);
            } catch (dbError) {
              console.error('Error getting patient records:', dbError);
              // Fall back to mock data
              sharedRecords = mockSharedRecords.map(record => ({
                ...record,
                sharedWith: ['doctor_viraj']
              }));
            }
          } else {
            // For other doctors, try to get from getUserMedicalRecords
            sharedRecords = getUserMedicalRecords(user.id);
          }
        } catch (error) {
          console.error('Error fetching shared records from database:', error);
          // Fall back to mockSharedRecords if DB access fails
          sharedRecords = mockSharedRecords;
        }
        
        if (sharedRecords && sharedRecords.length > 0) {
          console.log('Shared records found:', sharedRecords.length);
          setRecords(sharedRecords);
        } else {
          console.log('No shared records found, using mock data');
          setRecords(mockSharedRecords);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setRecords(mockSharedRecords);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user]);
  
  if (!user) return null;
  
  const filteredRecords = records.filter(record => {
    const patient = findUserById(record.patientId);
    
    return (
      getUserName(patient).toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.tags && record.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  });
  
  const truncateCid = (cid: string) => {
    return `${cid.slice(0, 6)}...${cid.slice(-4)}`;
  };
  
  const handleView = (record: any) => {
    setSelectedRecord(record);
    setShowViewDialog(true);
  };
  
  const handleDownload = (recordId: string) => {
    toast.success('Downloading file (simulated)');
  };

  const handleUpload = (patientId: string) => {
    setSelectedPatientId(patientId);
    setShowUploadDialog(true);
  };

  const handleFileUploaded = (file: File, cid: string) => {
    toast.success(`File ${file.name} uploaded successfully with CID: ${cid}`);
    setShowUploadDialog(false);
    setSelectedPatientId(null);
  };

  // Renamed from handleShareWithDoctor to handleShareWithPatient
  const handleShareWithPatient = (record: any) => {
    setSelectedRecord(record);
    setSelectedPatientForShare('');
    setIsShareModalOpen(true);
  };
  
  const handleShareConfirm = async () => {
    if (!selectedRecord || !selectedPatientForShare) {
      toast.error('Please select a patient to share with');
      return;
    }
    
    setIsSharing(true);
    try {
      // Get the patient for better UI feedback
      const patient = findUserById(selectedPatientForShare);
      const patientName = patient && 'name' in patient ? patient.name : 'Ansh Kumar';
      
      // In a real app, we would use the blockchain to grant access
      const txHash = await grantAccessToRecord(selectedRecord.cid, selectedPatientForShare);
      
      if (txHash) {
        toast.success(`Record shared with patient ${patientName}`);
        setIsShareModalOpen(false);
      }
    } catch (error) {
      console.error('Error sharing record:', error);
      toast.error('Failed to share record');
    } finally {
      setIsSharing(false);
    }
  };
  
  // Function to handle removing a record from the doctor's view
  const handleRemoveRecord = async (record: any) => {
    if (!user) return;
    
    // Confirm before removing
    if (!window.confirm(`Are you sure you want to remove access to "${record.fileName}"? You will no longer be able to view this record.`)) {
      return;
    }
    
    setIsDeleting(true);
    try {
      // Get patient info for confirmation
      const patient = findUserById(record.patientId);
      const patientName = patient ? getUserName(patient) : record.patientId;
      
      // For the current doctor to remove their own access
      // In a real implementation, this would involve the doctor voluntarily
      // revoking their own access to the patient's record
      const txHash = await revokeAccessToRecord(record.cid, user.id);
      
      if (txHash) {
        // Remove the record from local state
        setRecords(records.filter(r => r.id !== record.id));
        
        toast.success(`Removed access to "${record.fileName}" from ${patientName}`);
      }
    } catch (error) {
      console.error('Error removing record access:', error);
      toast.error('Failed to remove record access');
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FileCheck className="h-6 w-6" />
        Patient Records {user.email === 'viraj.22320042@viit.ac.in' && <span className="text-sm font-normal text-muted-foreground">(Dr. Viraj Telhande)</span>}
      </h1>
      
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Shared Medical Records</CardTitle>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search records by patient or file name..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
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
                    <TableHead>Patient</TableHead>
                    <TableHead>Date Shared</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => {
                      const patient = findUserById(record.patientId);
                      
                      return (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{record.fileName}</p>
                              <p className="text-xs text-muted-foreground">{truncateCid(record.cid)}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="link" 
                              className="p-0 h-auto" 
                              onClick={() => toast.info(`View patient profile: ${getUserId(patient)} - ${getUserName(patient)}`)}
                            >
                              {getUserName(patient)}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>{new Date(record.dateShared).toLocaleDateString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {record.tags.map((tag: string, index: number) => (
                                <Badge key={index} variant="outline">
                                  {tag}
                                </Badge>
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
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => handleDownload(record.id)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => handleUpload(record.patientId)}
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => handleShareWithPatient(record)}
                                title="Share with Patient"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                                onClick={() => handleRemoveRecord(record)}
                                title="Remove Record Access"
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No shared records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Record Information</DialogTitle>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="py-2">
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-md">
                  <h3 className="text-lg font-medium mb-2">{selectedRecord.fileName}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Content ID (CID)</p>
                      <p className="font-mono text-sm">{selectedRecord.cid}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Patient</p>
                      <p>{getUserName(findUserById(selectedRecord.patientId))}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date Shared</p>
                      <p>{new Date(selectedRecord.dateShared).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tags</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedRecord.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-secondary/20 rounded-md flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-muted-foreground">File preview would appear here</p>
                    <p className="text-xs text-muted-foreground">(In a real application, this would display the actual file)</p>
                  </div>
                </div>
                
                <div className="col-span-2 mt-4 flex justify-end">
                  <Button 
                    variant="outline" 
                    className="mr-2"
                    onClick={() => setShowViewDialog(false)}
                  >
                    Close
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      setShowViewDialog(false);
                      handleRemoveRecord(selectedRecord);
                    }}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white rounded-full mr-1" />
                    ) : null}
                    Remove Access
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
            <Button onClick={() => handleDownload(selectedRecord.id)}>
              <Download className="mr-1 h-4 w-4" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl sm:max-w-md md:max-w-lg lg:max-w-2xl w-[95vw] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">Upload Document</DialogTitle>
          </DialogHeader>
          
          <div className="py-2 sm:py-4">
            {selectedPatientId && (
              <div className="mb-3 sm:mb-4">
                <p className="text-sm text-muted-foreground">Uploading for patient:</p>
                <p className="font-medium">{getUserName(findUserById(selectedPatientId))}</p>
              </div>
            )}
            
            <FileUpload 
              onFileUpload={handleFileUploaded}
              allowedTypes={['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
              maxSizeMB={10}
              tags={['medical', 'record', 'document']}
              testMode={false}
            />
          </div>
          
          <DialogFooter className="sm:justify-end gap-2 mt-2 sm:mt-4">
            <Button variant="outline" onClick={() => setShowUploadDialog(false)} className="sm:w-auto w-full">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share with Patient Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Medical Record</DialogTitle>
            <DialogDescription>
              Select a patient to share this medical record with
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedRecord && (
              <div className="bg-muted p-3 rounded-md mb-4">
                <p className="font-medium">{selectedRecord.fileName}</p>
                <p className="text-sm text-muted-foreground">{truncateCid(selectedRecord.cid)}</p>
                <p className="text-sm mt-1">Patient: {getUserName(findUserById(selectedRecord.patientId))}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="patient-select" className="text-sm font-medium">
                Select Patient
              </label>
              <Select
                value={selectedPatientForShare}
                onValueChange={setSelectedPatientForShare}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {availablePatients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} ({patient.email})
                    </SelectItem>
                  ))}
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
              Cancel
            </Button>
            <Button 
              onClick={handleShareConfirm}
              disabled={!selectedPatientForShare || isSharing}
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
    </div>
  );
};

export default DoctorRecords; 