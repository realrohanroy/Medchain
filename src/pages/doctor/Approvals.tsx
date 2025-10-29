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
  Clock,
  ShieldCheck,
  Check,
  X,
  User,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  InfoIcon,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { findUserById } from '@/lib/mockData';
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { getUserName, safeGetUserById } from '@/utils/userUtils';
import { getDoctorAccessRequests, updateAccessRequest } from '@/services/accessRequestService';
import { format } from 'date-fns';

// Add proper type for access request
interface AccessRequest {
  id: string;
  patientId: string;
  doctorId: string;
  requestDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
  rejectionReason?: string;
}

interface Patient {
  id: string;
  name: string;
  email: string;
  role: 'patient';
  dateOfBirth?: string;
  phoneNumber?: string;
  address?: string;
  walletAddress?: string;
}

const DoctorApprovals: React.FC = () => {
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showPatientDialog, setShowPatientDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [responseNote, setResponseNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Load access requests on component mount
  useEffect(() => {
    const loadAccessRequests = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const requests = await getDoctorAccessRequests(user.id);
        setAccessRequests(requests);
      } catch (error) {
        console.error('Error loading access requests:', error);
        toast.error('Failed to load access requests');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAccessRequests();
  }, [user]);
  
  // WebSocket listener for access request updates
  useEffect(() => {
    if (!user) return;
    
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        console.log('WebSocket message received in DoctorApprovals:', event.data);
        const data = JSON.parse(event.data);
        
        if (data.type === 'ACCESS_REQUEST_CREATED' && data.payload.doctorId === user.id) {
          // Fetch the patient info
          const patient = safeGetUserById(data.payload.patientId);
          const patientName = patient ? patient.name : 'A patient';
          
          // Create a new request object and add it to the state
          const newRequest: AccessRequest = {
            id: data.payload.requestId,
            patientId: data.payload.patientId,
            doctorId: user.id,
            requestDate: new Date().toISOString().split('T')[0],
            status: 'Pending',
            reason: data.payload.reason
          };
          
          setAccessRequests(prev => [newRequest, ...prev]);
          
          // Show a toast notification
          toast.info(
            <div className="flex flex-col gap-1">
              <p className="font-medium">New Access Request</p>
              <p className="text-sm">{patientName} has requested access to their medical records</p>
            </div>,
            {
              action: {
                label: "View",
                onClick: () => {
                  setSelectedRequest(newRequest);
                  setShowRequestDialog(true);
                },
              },
            }
          );
        } else if (data.type === 'ACCESS_REQUEST_UPDATED') {
          console.log('ACCESS_REQUEST_UPDATED received:', data.payload);
          
          // Check if this update is for the current doctor
          if (data.payload.doctorId === user.id) {
            console.log('Updating request in state:', data.payload.requestId);
            
            // Update the request in local state
            setAccessRequests(prevRequests => {
              const updatedRequests = prevRequests.map(req => {
                if (req.id === data.payload.requestId) {
                  console.log('Found matching request, updating status to:', data.payload.status);
                  return {
                    ...req,
                    status: data.payload.status,
                    rejectionReason: data.payload.rejectionReason
                  };
                }
                return req;
              });
              
              console.log('Updated requests:', updatedRequests);
              return updatedRequests;
            });
            
            // Show a toast notification
            const patient = safeGetUserById(data.payload.patientId);
            const patientName = patient ? patient.name : 'A patient';
            
            if (data.payload.status === 'Approved') {
              toast.success(`Access request for ${patientName} has been approved`);
            } else if (data.payload.status === 'Rejected') {
              toast.error(`Access request for ${patientName} has been rejected`);
            }
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
  
  const filteredRequests = accessRequests.filter(req => {
    const patient = safeGetUserById(req.patientId);
    const patientName = patient ? patient.name : 'Unknown Patient';
    
    return (
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  const pendingRequests = filteredRequests.filter(req => req.status === 'Pending');
  const approvedRequests = filteredRequests.filter(req => req.status === 'Approved');
  const rejectedRequests = filteredRequests.filter(req => req.status === 'Rejected');
  
  const viewPatientDetails = (patientId: string) => {
    const patient = safeGetUserById(patientId);
    setSelectedPatient(patient);
    setShowPatientDialog(true);
  };
  
  const viewRequestDetails = (request: AccessRequest) => {
    setSelectedRequest(request);
    setResponseNote('');
    setShowRequestDialog(true);
  };
  
  const handleApproveRequest = async () => {
    if (!selectedRequest || !user) return;
    
    setIsProcessing(true);
    try {
      // Update the request status
      const updatedRequest = await updateAccessRequest(selectedRequest.id, 'Approved');
      
      // Update local state
      setAccessRequests(requests => 
        requests.map(req => req.id === updatedRequest.id ? updatedRequest : req)
      );
      
      // Send WebSocket notification
      console.log('Sending ACCESS_REQUEST_UPDATED message for approval:', {
        requestId: updatedRequest.id,
        patientId: updatedRequest.patientId,
        doctorId: updatedRequest.doctorId,
        status: 'Approved'
      });
      
      sendMessage({
        type: 'ACCESS_REQUEST_UPDATED',
        payload: {
          requestId: updatedRequest.id,
          patientId: updatedRequest.patientId,
          doctorId: updatedRequest.doctorId,
          status: 'Approved'
        }
      });
      
      toast.success('Request approved successfully');
      setShowRequestDialog(false);
      setResponseNote('');
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleRejectRequest = async () => {
    if (!selectedRequest || !user) return;
    
    if (!responseNote.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setIsProcessing(true);
    try {
      // Update the request status with rejection reason
      const updatedRequest = await updateAccessRequest(selectedRequest.id, 'Rejected', responseNote);
      
      // Update local state
      setAccessRequests(requests => 
        requests.map(req => req.id === updatedRequest.id ? updatedRequest : req)
      );
      
      // Send WebSocket notification
      console.log('Sending ACCESS_REQUEST_UPDATED message for rejection:', {
        requestId: updatedRequest.id,
        patientId: updatedRequest.patientId,
        doctorId: updatedRequest.doctorId,
        status: 'Rejected',
        rejectionReason: responseNote
      });
      
      sendMessage({
        type: 'ACCESS_REQUEST_UPDATED',
        payload: {
          requestId: updatedRequest.id,
          patientId: updatedRequest.patientId,
          doctorId: updatedRequest.doctorId,
          status: 'Rejected',
          rejectionReason: responseNote
        }
      });
      
      toast.success('Request rejected successfully');
      setShowRequestDialog(false);
      setResponseNote('');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return '';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Pending': return <Clock className="h-4 w-4" />;
      case 'Approved': return <CheckCircle2 className="h-4 w-4" />;
      case 'Rejected': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading access requests...</span>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ShieldCheck className="h-6 w-6" />
        Access Approvals
      </h1>
      
      <div className="mb-6">
        <p className="text-muted-foreground">
          Review and respond to patient requests for access to their medical records.
        </p>
        <div className="flex items-center gap-4 mt-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending: {pendingRequests.length}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Approved: {approvedRequests.length}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Rejected: {rejectedRequests.length}
          </Badge>
        </div>
      </div>
      
      <div className="mb-4 relative">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by patient name or reason..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <Tabs defaultValue="pending" className="mb-6">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-1">
            <Badge 
              className={pendingRequests.length > 0 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" : ""}
              variant={pendingRequests.length > 0 ? "default" : "outline"}
            >
              {pendingRequests.length}
            </Badge>
            Pending Requests
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-4">
          <RequestsTable 
            requests={pendingRequests} 
            viewRequestDetails={viewRequestDetails}
            viewPatientDetails={viewPatientDetails}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          />
        </TabsContent>
        
        <TabsContent value="approved" className="mt-4">
          <RequestsTable 
            requests={approvedRequests} 
            viewRequestDetails={viewRequestDetails}
            viewPatientDetails={viewPatientDetails}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          />
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-4">
          <RequestsTable 
            requests={rejectedRequests} 
            viewRequestDetails={viewRequestDetails}
            viewPatientDetails={viewPatientDetails}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          />
        </TabsContent>
        
        <TabsContent value="all" className="mt-4">
          <RequestsTable 
            requests={filteredRequests} 
            viewRequestDetails={viewRequestDetails}
            viewPatientDetails={viewPatientDetails}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          />
        </TabsContent>
      </Tabs>
      
      {/* Request Detail Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Access Request Details</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Patient</p>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{safeGetUserById(selectedRequest.patientId)?.name || 'Unknown Patient'}</p>
                    <Button 
                      variant="link" 
                      className="h-auto p-0 text-sm text-muted-foreground"
                      onClick={() => viewPatientDetails(selectedRequest.patientId)}
                    >
                      View Patient Details
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Request Date</p>
                  <p className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {format(new Date(selectedRequest.requestDate), 'PPP')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge 
                    className={cn(
                      "flex items-center gap-1 mt-1",
                      getStatusColor(selectedRequest.status)
                    )}
                  >
                    {getStatusIcon(selectedRequest.status)} {selectedRequest.status}
                  </Badge>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium">Request Reason</p>
                <p className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">{selectedRequest.reason}</p>
              </div>
              
              {selectedRequest.status === 'Rejected' && selectedRequest.rejectionReason && (
                <div>
                  <p className="text-sm font-medium text-red-500">Rejection Reason</p>
                  <p className="mt-1 p-3 bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-300 rounded-md">
                    {selectedRequest.rejectionReason}
                  </p>
                </div>
              )}
              
              {selectedRequest.status === 'Pending' && (
                <>
                  <div className="pt-2">
                    <label className="text-sm font-medium mb-1 block">Response Note (required for rejection)</label>
                    <Textarea 
                      placeholder="Enter notes or reason for rejection..."
                      value={responseNote}
                      onChange={(e) => setResponseNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="destructive" 
                      onClick={handleRejectRequest}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          Reject
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={handleApproveRequest}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
              
              {selectedRequest.status === 'Approved' && (
                <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Access Granted
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                    You've granted this patient access to their medical records.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-2 text-green-800 border-green-300 hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-900/50"
                    onClick={() => window.location.href = '/doctor/records'}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Manage Records
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Patient Detail Dialog */}
      <Dialog open={showPatientDialog} onOpenChange={setShowPatientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">{selectedPatient.name}</h3>
                  <p className="text-muted-foreground">{selectedPatient.role}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{selectedPatient.email}</p>
                </div>
                {selectedPatient.phoneNumber && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p>{selectedPatient.phoneNumber}</p>
                  </div>
                )}
                {selectedPatient.dateOfBirth && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                    <p>{selectedPatient.dateOfBirth}</p>
                  </div>
                )}
                {selectedPatient.address && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p>{selectedPatient.address}</p>
                  </div>
                )}
                {selectedPatient.walletAddress && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Wallet Address</p>
                    <p className="font-mono text-sm break-all">{selectedPatient.walletAddress}</p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowPatientDialog(false)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => window.location.href = '/doctor/records?patient=' + selectedPatient.id}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Patient Records
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Table component to avoid repetition
const RequestsTable = ({ 
  requests, 
  viewRequestDetails,
  viewPatientDetails,
  getStatusColor,
  getStatusIcon
}: { 
  requests: AccessRequest[], 
  viewRequestDetails: (request: AccessRequest) => void,
  viewPatientDetails: (patientId: string) => void,
  getStatusColor: (status: string) => string,
  getStatusIcon: (status: string) => React.ReactNode
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        {requests.length === 0 ? (
          <div className="rounded-md border flex flex-col items-center justify-center p-8 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-medium text-lg">No requests found</h3>
            <p className="text-muted-foreground">
              {requests.length === 0 && "No access requests match your search criteria."}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const patient = safeGetUserById(request.patientId);
                  const patientName = patient ? patient.name : 'Unknown Patient';
                  
                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{patientName}</div>
                            <Button 
                              variant="link" 
                              className="h-auto p-0 text-xs text-muted-foreground"
                              onClick={() => viewPatientDetails(request.patientId)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(request.requestDate), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={request.reason}>
                          {request.reason}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "flex items-center gap-1",
                            getStatusColor(request.status)
                          )}
                        >
                          {getStatusIcon(request.status)} {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => viewRequestDetails(request)}
                                className={cn(
                                  "h-8 w-8 p-0",
                                  request.status === 'Pending' ? "text-primary hover:text-primary" : ""
                                )}
                              >
                                <InfoIcon className="h-4 w-4" />
                                <span className="sr-only">View Details</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Request Details</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DoctorApprovals;
