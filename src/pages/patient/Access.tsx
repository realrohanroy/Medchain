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
  X, 
  UserCheck, 
  Shield,
  Loader2,
  Plus,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getUserMedicalRecords, findUserById } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useWeb3 } from '@/contexts/Web3Context';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { grantAccessToRecord, revokeAccessToRecord } from '@/services/blockchainService';
import { 
  createAccessRequest, 
  getPatientAccessRequests, 
  getAvailableDoctors
} from '@/services/accessRequestService';
import { getUserName, safeGetUserById } from '@/utils/userUtils';

// Type augmentation for MedicalRecord to include sharedWith and CID
interface EnhancedMedicalRecord {
  id: string;
  fileName: string;
  uploadDate: string;
  tags: string[];
  sharedWith?: string[];
  cid: string;
}

interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization?: string;
  wallet?: string;
  hospital?: string;
}

const PatientAccess: React.FC = () => {
  const { user } = useAuth();
  const { signer, account } = useWeb3();
  const { sendMessage } = useWebSocket();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<EnhancedMedicalRecord | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [requestReason, setRequestReason] = useState('');
  
  useEffect(() => {
    if (user) {
      // Load access requests
      const loadAccessRequests = async () => {
        try {
          const requests = await getPatientAccessRequests(user.id);
          setAccessRequests(requests);
        } catch (error) {
          console.error('Error loading access requests:', error);
          toast.error('Failed to load access requests');
        }
      };
      
      // Load available doctors
      const loadDoctors = async () => {
        try {
          const doctors = await getAvailableDoctors();
          setAvailableDoctors(doctors as Doctor[]);
        } catch (error) {
          console.error('Error loading doctors:', error);
          toast.error('Failed to load doctors');
        }
      };
      
      loadAccessRequests();
      loadDoctors();
    }
  }, [user]);
  
  // WebSocket listener for access request updates
  useEffect(() => {
    if (!user) return;
    
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'ACCESS_REQUEST_UPDATED' && data.payload.patientId === user.id) {
          // Update the request in local state
          setAccessRequests(prevRequests => 
            prevRequests.map(req => {
              if (req.id === data.payload.requestId) {
                return {
                  ...req,
                  status: data.payload.status,
                  rejectionReason: data.payload.rejectionReason
                };
              }
              return req;
            })
          );
          
          // Show a toast notification
          if (data.payload.status === 'Approved') {
            toast.success(`Your access request has been approved by Dr. ${getUserName(safeGetUserById(data.payload.doctorId))}`);
          } else if (data.payload.status === 'Rejected') {
            toast.error(`Your access request has been rejected by Dr. ${getUserName(safeGetUserById(data.payload.doctorId))}`);
          }
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };
    
    // Add event listener
    window.addEventListener('message', handleWebSocketMessage);
    
    // Clean up
    return () => {
      window.removeEventListener('message', handleWebSocketMessage);
    };
  }, [user]);
  
  if (!user) return null;
  
  // Cast the records to our enhanced type that includes sharedWith and CID
  const records = getUserMedicalRecords(user.id) as EnhancedMedicalRecord[];
  
  // Get distinct doctor IDs from all records' sharedWith arrays
  const doctorIds = Array.from(new Set(records.flatMap(r => r.sharedWith || [])));
  
  // Get doctor objects from doctor IDs
  const doctors = doctorIds
    .map(id => safeGetUserById(id))
    .filter(Boolean);
  
  const doctorsNotSharedWith = (recordId: string) => {
    const record = records.find(r => r.id === recordId);
    if (!record) return [];
    
    const sharedWith = record.sharedWith || [];
    
    // Get all doctors and filter them
    const allDoctorsResult = findUserById('all');
    if (!allDoctorsResult) return [];
    
    const allDoctors = Array.isArray(allDoctorsResult) ? allDoctorsResult : [allDoctorsResult];
    return allDoctors.filter(user => user.role === 'doctor' && !sharedWith.includes(user.id));
  };
  
  const filteredRecords = records.filter(record => 
    record.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const openGrantDialog = (record: EnhancedMedicalRecord) => {
    setSelectedRecord(record);
    setShowGrantDialog(true);
  };
  
  const handleGrantAccess = async () => {
    if (!selectedRecord || !selectedDoctor) {
      toast.error('Please select a doctor to grant access');
      return;
    }
    
    if (!signer || !account) {
      toast.error('Please connect your wallet to grant access');
      return;
    }
    
    setIsProcessing(true);
    try {
      // In a real app with real smart contracts, we would use the CID from the record
      // For demo, we're using the blockchain service to simulate the transaction
      const txHash = await grantAccessToRecord(signer, selectedRecord.cid, selectedDoctor);
      
      if (txHash) {
        setTransactionHash(txHash);
        toast.success(`Access granted to the selected doctor for ${selectedRecord.fileName}`);
      }
    } catch (error) {
      console.error('Error granting access:', error);
      toast.error('Failed to grant access');
    } finally {
      setIsProcessing(false);
      // Keep the dialog open to show transaction details
    }
  };
  
  const handleRevokeAccess = async (recordId: string, doctorId: string) => {
    if (!signer || !account) {
      toast.error('Please connect your wallet to revoke access');
      return;
    }
    
    setIsProcessing(true);
    try {
      const record = records.find(r => r.id === recordId);
      if (!record) {
        throw new Error('Record not found');
      }
      
      // In a real app, we would use the actual CID from the record
      const txHash = await revokeAccessToRecord(signer, record.cid, doctorId);
      
      if (txHash) {
        toast.success('Access revoked successfully');
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      toast.error('Failed to revoke access');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const closeGrantDialog = () => {
    setShowGrantDialog(false);
    setSelectedDoctor('');
    setTransactionHash(null);
  };
  
  const openRequestDialog = () => {
    setShowRequestDialog(true);
  };
  
  const handleCreateRequest = async () => {
    if (!selectedDoctor) {
      toast.error('Please select a doctor');
      return;
    }
    
    if (!requestReason.trim()) {
      toast.error('Please provide a reason for the request');
      return;
    }
    
    setIsProcessing(true);
    try {
      const newRequest = await createAccessRequest(
        user.id,
        selectedDoctor,
        requestReason
      );
      
      // Update local state
      setAccessRequests([...accessRequests, newRequest]);
      
      // Send real-time notification
      sendMessage({
        type: 'ACCESS_REQUEST_CREATED',
        payload: {
          requestId: newRequest.id,
          patientId: user.id,
          doctorId: selectedDoctor,
          reason: requestReason
        }
      });
      
      toast.success('Access request created successfully');
      setShowRequestDialog(false);
      setSelectedDoctor('');
      setRequestReason('');
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Failed to create request');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const closeRequestDialog = () => {
    setShowRequestDialog(false);
    setSelectedDoctor('');
    setRequestReason('');
  };
  
  const getStatusBadge = (status: string) => {
    let badgeClass = "";
    switch(status.toLowerCase()) {
      case 'pending':
        badgeClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
        break;
      case 'approved':
        badgeClass = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
        break;
      case 'rejected':
        badgeClass = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
        break;
      default:
        badgeClass = "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
    return badgeClass;
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Medical Records Access Control</h1>
      
      <Tabs defaultValue="records" className="mb-6">
        <TabsList>
          <TabsTrigger value="records">My Records</TabsTrigger>
          <TabsTrigger value="doctors">Authorized Doctors</TabsTrigger>
          <TabsTrigger value="requests">Access Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="records" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search records..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => openRequestDialog()}>
              <Shield className="mr-2 h-4 w-4" />
              Request Access
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>My Medical Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Record Name</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Shared With</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((record) => {
                        const doctorsSharedWith = (record.sharedWith || [])
                          .map(id => safeGetUserById(id))
                          .filter(Boolean);
                        
                        return (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.fileName}</TableCell>
                            <TableCell>{new Date(record.uploadDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {record.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline">{tag}</Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              {doctorsSharedWith.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                  {doctorsSharedWith.map((doctor, index) => (
                                    <div key={index} className="flex items-center gap-1">
                                      <UserCheck className="h-3 w-3 text-green-500" />
                                      <span className="text-sm">{doctor ? getUserName(doctor) : 'Unknown'}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">Not shared</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => openGrantDialog(record)}>
                                <Plus className="mr-1 h-3 w-3" />
                                Grant Access
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
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
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="doctors" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Doctors With Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Records Shared</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctors.length > 0 ? (
                      doctors.map((doctor) => {
                        const recordsSharedWithDoctor = records.filter(r => 
                          r.sharedWith && r.sharedWith.includes(doctor.id)
                        );
                        
                        return (
                          <TableRow key={doctor.id}>
                            <TableCell className="font-medium">{getUserName(doctor)}</TableCell>
                            <TableCell>{doctor.specialization || 'General'}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {recordsSharedWithDoctor.map((record, index) => (
                                  <div key={index} className="flex items-center gap-1">
                                    <span className="text-sm">{record.fileName}</span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {recordsSharedWithDoctor.map((record) => (
                                  <Button 
                                    key={record.id} 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => handleRevokeAccess(record.id, doctor.id)}
                                    disabled={isProcessing}
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <X className="h-3 w-3" />
                                    )}
                                    <span className="ml-1">Revoke {record.fileName}</span>
                                  </Button>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No doctors have access to your records
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Access Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Date Requested</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessRequests.length > 0 ? (
                      accessRequests.map((request) => {
                        const doctorObj = safeGetUserById(request.doctorId);
                        
                        return (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">
                              {doctorObj ? getUserName(doctorObj) : 'Unknown Doctor'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span>{new Date(request.requestDate).toLocaleDateString()}</span>
                              </div>
                            </TableCell>
                            <TableCell>{request.reason}</TableCell>
                            <TableCell>
                              <Badge className={getStatusBadge(request.status)}>
                                {request.status}
                              </Badge>
                              {request.status === 'Rejected' && request.rejectionReason && (
                                <p className="text-xs text-red-500 mt-1">{request.rejectionReason}</p>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No access requests found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Grant Access Dialog */}
      <Dialog open={showGrantDialog} onOpenChange={closeGrantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Access</DialogTitle>
            <DialogDescription>
              Select a doctor to grant access to this medical record
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {selectedRecord && (
              <div className="mb-4 p-3 bg-muted rounded-md">
                <h4 className="font-medium">Selected Record</h4>
                <p>{selectedRecord.fileName}</p>
                <div className="flex gap-1 mt-1">
                  {selectedRecord.tags.map((tag, i) => (
                    <Badge key={i} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="doctor">Doctor</Label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {selectedRecord && doctorsNotSharedWith(selectedRecord.id).map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>{getUserName(doctor)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {transactionHash && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                <h4 className="font-medium text-green-700 dark:text-green-300">Transaction Successful</h4>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1 break-all">
                  Hash: {transactionHash}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeGrantDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleGrantAccess} 
              disabled={isProcessing || !selectedDoctor || !!transactionHash}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Grant Access'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Request Access Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={closeRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Access</DialogTitle>
            <DialogDescription>
              Send a request to a doctor for access to your medical records
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doctor">Select Doctor</Label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {availableDoctors.map(doctor => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name} {doctor.specialization ? `(${doctor.specialization})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Access Request</Label>
              <Textarea 
                placeholder="Explain why you're requesting access..."
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={closeRequestDialog}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRequest}
              disabled={isProcessing || !selectedDoctor || !requestReason.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientAccess;
