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
  Send,
  Clock,
  FileQuestion,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  InfoIcon,
  ExternalLink
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getUserName, safeGetUserById } from '@/utils/userUtils';
import { 
  createAccessRequest, 
  getPatientAccessRequests, 
  getAvailableDoctors,
  updateAccessRequest 
} from '@/services/accessRequestService';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Define the interface for access requests
interface AccessRequest {
  id: string;
  patientId: string;
  doctorId: string;
  requestDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
  rejectionReason?: string;
}

// Define the interface for doctors
interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization?: string;
  wallet?: string;
  hospital?: string;
}

const PatientRequests: React.FC = () => {
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Load access requests and available doctors on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Load access requests
        const requests = await getPatientAccessRequests(user.id);
        setAccessRequests(requests);
        
        // Load available doctors
        const doctors = await getAvailableDoctors();
        setAvailableDoctors(doctors as Doctor[]);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
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
  
  const pendingRequests = accessRequests.filter(req => req.status === 'Pending');
  const approvedRequests = accessRequests.filter(req => req.status === 'Approved');
  const rejectedRequests = accessRequests.filter(req => req.status === 'Rejected');
  
  const filteredRequests = accessRequests.filter(req => {
    const doctor = safeGetUserById(req.doctorId);
    const doctorName = doctor ? doctor.name : 'Unknown Doctor';
    
    return (
      doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  const handleSendRequest = async () => {
    if (!selectedDoctor) {
      toast.error('Please select a doctor');
      return;
    }
    
    if (!requestReason.trim()) {
      toast.error('Please provide a reason for your request');
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
      setAccessRequests(prev => [...prev, newRequest]);
      
      // Send WebSocket notification
      sendMessage({
        type: 'ACCESS_REQUEST_CREATED',
        payload: {
          requestId: newRequest.id,
          patientId: user.id,
          doctorId: selectedDoctor,
          reason: requestReason
        }
      });
      
      toast.success('Access request sent successfully');
      setShowRequestDialog(false);
      setSelectedDoctor('');
      setRequestReason('');
    } catch (error) {
      console.error('Error sending request:', error);
      toast.error('Failed to send request');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleCancelRequest = async (requestId: string) => {
    setIsProcessing(true);
    try {
      // Update the request to be canceled (we'll use Rejected status)
      const updatedRequest = await updateAccessRequest(requestId, 'Rejected');
      
      // Update local state
      setAccessRequests(requests => 
        requests.map(req => req.id === updatedRequest.id ? {
          ...updatedRequest,
          rejectionReason: 'Canceled by patient'
        } : req)
      );
      
      // Send WebSocket notification
      sendMessage({
        type: 'ACCESS_REQUEST_UPDATED',
        payload: {
          requestId: updatedRequest.id,
          patientId: user.id,
          doctorId: updatedRequest.doctorId,
          status: 'Rejected',
          rejectionReason: 'Canceled by patient'
        }
      });
      
      toast.success('Request canceled successfully');
      setShowDetailsDialog(false);
    } catch (error) {
      console.error('Error canceling request:', error);
      toast.error('Failed to cancel request');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleViewDetails = (request: AccessRequest) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
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
        <FileQuestion className="h-6 w-6" />
        Access Requests
      </h1>
      
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Request access to medical records from your doctors.
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
        <Button onClick={() => setShowRequestDialog(true)}>
          <Send className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>
      
      <div className="mb-4 relative">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search requests..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <RequestsTable 
            requests={filteredRequests} 
            handleViewDetails={handleViewDetails}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          />
        </TabsContent>
        
        <TabsContent value="pending" className="mt-4">
          <RequestsTable 
            requests={filteredRequests.filter(req => req.status === 'Pending')} 
            handleViewDetails={handleViewDetails}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          />
        </TabsContent>
        
        <TabsContent value="approved" className="mt-4">
          <RequestsTable 
            requests={filteredRequests.filter(req => req.status === 'Approved')} 
            handleViewDetails={handleViewDetails}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          />
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-4">
          <RequestsTable 
            requests={filteredRequests.filter(req => req.status === 'Rejected')} 
            handleViewDetails={handleViewDetails}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          />
        </TabsContent>
      </Tabs>
      
      {/* New Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Access Request</DialogTitle>
            <DialogDescription>
              Request access to your medical records from a doctor
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Doctor</label>
              <Select 
                value={selectedDoctor} 
                onValueChange={setSelectedDoctor}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a doctor" />
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
              <label className="text-sm font-medium">Reason for Request</label>
              <Textarea 
                placeholder="Please explain why you need access to your medical records"
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Provide details about the specific records you need access to and why.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRequestDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendRequest}
              disabled={isProcessing || !selectedDoctor || !requestReason.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Request Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Access Request Details</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Doctor</p>
                  <p>{safeGetUserById(selectedRequest.doctorId)?.name || 'Unknown Doctor'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Request Date</p>
                  <p>{format(new Date(selectedRequest.requestDate), 'PPP')}</p>
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
                <p className="text-sm font-medium">Reason for Request</p>
                <p className="mt-1 p-2 bg-muted rounded-md">{selectedRequest.reason}</p>
              </div>
              
              {selectedRequest.status === 'Rejected' && selectedRequest.rejectionReason && (
                <div>
                  <p className="text-sm font-medium text-red-500">Rejection Reason</p>
                  <p className="mt-1 p-2 bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-300 rounded-md">
                    {selectedRequest.rejectionReason}
                  </p>
                </div>
              )}
              
              {selectedRequest.status === 'Pending' && (
                <div className="flex justify-end mt-4">
                  <Button 
                    variant="destructive" 
                    onClick={() => handleCancelRequest(selectedRequest.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Request
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {selectedRequest.status === 'Approved' && (
                <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-md mt-2">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Access Granted
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                    You now have access to your medical records. You can view them in the Records section.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-2 text-green-800 border-green-300 hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-900/50"
                    onClick={() => window.location.href = '/patient/records'}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Records
                  </Button>
                </div>
              )}
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
  handleViewDetails, 
  getStatusColor,
  getStatusIcon
}: { 
  requests: AccessRequest[], 
  handleViewDetails: (request: AccessRequest) => void,
  getStatusColor: (status: string) => string,
  getStatusIcon: (status: string) => React.ReactNode
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length > 0 ? (
                requests.map((request) => {
                  const doctor = safeGetUserById(request.doctorId);
                  const doctorName = doctor ? doctor.name : 'Unknown Doctor';
                  
                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{doctorName}</TableCell>
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
                                onClick={() => handleViewDetails(request)}
                                className="h-8 w-8 p-0"
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
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <FileQuestion className="h-8 w-8 mb-2" />
                      No requests found
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientRequests;
