import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  createAccessRequest, 
  getDoctorAccessRequests,
  getDoctorAccessGrants,
  type AccessRequest,
  type AccessGrant,
  getMockDoctorAccessRequests,
  getMockDoctorAccessGrants,
  cancelAccessRequest,
  getPatients,
  getMockPatients,
  Patient
} from '@/services/accessRequestService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Clock, CheckCircle, XCircle, FileText, Send, InfoIcon, AlertCircle, Calendar, Info, Flag, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { format } from 'date-fns';

export default function RequestAccess() {
  const { user } = useAuth();
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [accessGrants, setAccessGrants] = useState<AccessGrant[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('request');
  
  // New request form state
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [requestAllRecords, setRequestAllRecords] = useState(true);
  const [specificRecordId, setSpecificRecordId] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock patient list for demo purposes
  const mockPatients = [
    { id: 'pat_001', name: 'John Doe', email: 'john.doe@example.com' },
    { id: 'pat_002', name: 'Jane Smith', email: 'jane.smith@example.com' },
    { id: 'pat_003', name: 'Robert Johnson', email: 'robert.j@example.com' },
    { id: 'pat_004', name: 'Emily Davis', email: 'emily.davis@example.com' },
  ];
  
  // Fetch access requests and grants
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Try to fetch from the database
        let requests: AccessRequest[] = [];
        let grants: AccessGrant[] = [];
        let patientsList: Patient[] = [];
        
        try {
          requests = await getDoctorAccessRequests(user.id);
          grants = await getDoctorAccessGrants(user.id);
          patientsList = await getPatients();
        } catch (error) {
          console.error('Error fetching from database, falling back to mock data:', error);
          // Fallback to mock data if database call fails
          requests = getMockDoctorAccessRequests(user.id);
          grants = getMockDoctorAccessGrants(user.id);
          patientsList = getMockPatients();
        }
        
        setAccessRequests(requests);
        setAccessGrants(grants);
        setPatients(patientsList);
      } catch (error) {
        console.error('Error fetching access data:', error);
        toast.error('Failed to load access requests and grants');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user?.id]);
  
  // Handle submitting a new access request
  const handleSubmitRequest = async () => {
    if (!user?.id) return;
    
    if (!selectedPatientId) {
      toast.error('Please select a patient');
      return;
    }
    
    if (!requestAllRecords && !specificRecordId) {
      toast.error('Please provide a record ID or select all records');
      return;
    }
    
    if (!requestReason.trim()) {
      toast.error('Please provide a reason for requesting access');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await createAccessRequest({
        doctorId: user.id,
        patientId: selectedPatientId,
        requestAllRecords,
        recordId: requestAllRecords ? undefined : specificRecordId,
        reason: requestReason,
      });
      
      if (success) {
        toast.success('Access request submitted successfully');
        
        // Refresh the list of requests
        const updatedRequests = await getDoctorAccessRequests(user.id);
        setAccessRequests(updatedRequests);
        
        // Reset form and close dialog
        resetForm();
        setShowNewRequestDialog(false);
      }
    } catch (error) {
      console.error('Error submitting access request:', error);
      toast.error('Failed to submit access request');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset the new request form
  const resetForm = () => {
    setSelectedPatientId('');
    setRequestAllRecords(true);
    setSpecificRecordId('');
    setRequestReason('');
  };
  
  // Handle selecting a patient
  const handlePatientSelect = (selectedId: string) => {
    setSelectedPatientId(selectedId);
  };
  
  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };
  
  // Get badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'denied':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> Denied</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };
  
  // Filter patients based on search term
  const filteredPatients = patients.filter(patient => 
    patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle canceling an access request
  const handleCancelRequest = async (request: AccessRequest) => {
    setIsSubmitting(true);
    
    try {
      await cancelAccessRequest(request.id);
      
      // Update the local state
      setAccessRequests(prev => prev.filter(req => req.id !== request.id));
      
      toast.success('Access request canceled successfully');
    } catch (err) {
      console.error('Error canceling request:', err);
      toast.error('Failed to cancel request');
    } finally {
      setIsSubmitting(false);
      setSelectedRequest(null);
    }
  };
  
  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading access information...</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Patient Record Access</h1>
        <Button 
          onClick={() => setShowNewRequestDialog(true)}
          className="flex items-center"
        >
          <Send className="w-4 h-4 mr-2" />
          Request New Access
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="request" className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            My Requests
            {accessRequests.filter(req => req.status.toLowerCase() === 'pending').length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {accessRequests.filter(req => req.status.toLowerCase() === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            Active Access
            {accessGrants.length > 0 && (
              <Badge className="ml-2 bg-blue-500">
                {accessGrants.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="request">
          {accessRequests.length === 0 ? (
            <div className="text-center py-10">
              <Send className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Access Requests</h3>
              <p className="text-sm text-muted-foreground">
                You haven't requested access to any patient records yet.
              </p>
              <Button 
                onClick={() => setShowNewRequestDialog(true)}
                className="mt-4"
              >
                Request Access
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accessRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle>{request.patient?.fullName || `Patient ID: ${request.patientId}`}</CardTitle>
                      {getStatusBadge(request.status)}
                    </div>
                    <CardDescription>
                      {request.patient?.email || 'No email provided'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">Requested: 
                      {request.requestAllRecords 
                        ? ' All medical records'
                        : ` Specific record ${request.recordId?.substring(0, 8)}`
                      }
                    </p>
                    <p className="text-sm mt-2">Reason provided: </p>
                    <p className="text-sm bg-secondary p-2 rounded mt-1">{request.reason}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Requested on {formatDate(request.createdAt)}
                    </p>
                  </CardContent>
                  <CardFooter className="bg-muted/40 pt-3">
                    <div className="w-full">
                      <p className="text-xs">
                        {request.status.toLowerCase() === 'pending' 
                          ? 'Awaiting patient approval. They will be notified of your request.'
                          : request.status.toLowerCase() === 'approved'
                            ? 'Request approved. You now have access to these records.'
                            : 'Request denied. Please contact the patient directly if needed.'}
                      </p>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="access">
          {accessGrants.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Active Access</h3>
              <p className="text-sm text-muted-foreground">
                You don't currently have access to any patient records.
                Request access to view patient medical information.
              </p>
              <Button 
                onClick={() => setShowNewRequestDialog(true)}
                className="mt-4"
              >
                Request Access
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accessGrants.map((grant) => (
                <Card key={grant.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle>{grant.patient?.fullName || `Patient ID: ${grant.patientId}`}</CardTitle>
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" /> Active
                      </Badge>
                    </div>
                    <CardDescription>
                      {grant.patient?.email || 'No email provided'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">Access to: 
                      {grant.grantAllRecords 
                        ? ' All medical records' 
                        : ` Specific record ${grant.recordId?.substring(0, 8)}`
                      }
                    </p>
                    <p className="text-xs mt-2">
                      Access granted on {formatDate(grant.createdAt)}
                    </p>
                    {grant.expiresAt && (
                      <p className="text-xs text-muted-foreground">
                        Expires on {formatDate(grant.expiresAt)}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="bg-muted/40 pt-3">
                    <Button 
                      variant="default" 
                      className="w-full"
                      onClick={() => {
                        // Navigate to medical records view
                        // Could link to the patient's records that the doctor has access to
                        toast.info('Navigating to patient records would happen here');
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Records
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* New Request Dialog */}
      <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Access to Patient Records</DialogTitle>
            <DialogDescription>
              Submit a request to access patient medical records.
              The patient will be notified and can approve or deny your request.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="patient-search">Search Patient</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="patient-search"
                  placeholder="Search by name or ID"
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="h-[200px] overflow-y-auto border rounded-md p-2">
              {filteredPatients.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <p>No patients found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-secondary/50 ${
                        selectedPatientId === patient.id ? 'bg-secondary' : ''
                      }`}
                      onClick={() => setSelectedPatientId(patient.id)}
                    >
                      <div>
                        <p className="font-medium">{patient.fullName}</p>
                        <p className="text-sm text-muted-foreground">ID: {patient.id}</p>
                      </div>
                      {selectedPatientId === patient.id && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedPatientId && (
              <>
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="request-all-records">Request All Records</Label>
                      <p className="text-sm text-muted-foreground">
                        Toggle to request access to all patient records
                      </p>
                    </div>
                    <Switch
                      id="request-all-records"
                      checked={requestAllRecords}
                      onCheckedChange={setRequestAllRecords}
                    />
                  </div>
                  
                  {!requestAllRecords && (
                    <div className="space-y-2">
                      <Label htmlFor="specific-record">Specific Record ID</Label>
                      <Input
                        id="specific-record"
                        placeholder="Enter record ID"
                        value={specificRecordId}
                        onChange={(e) => setSpecificRecordId(e.target.value)}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="request-reason">Reason for Access</Label>
                    <Textarea
                      id="request-reason"
                      placeholder="Explain why you need access to this patient's records"
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Important Notice</AlertTitle>
                    <AlertDescription>
                      The patient will be notified of your request. Only request access to records
                      necessary for patient care. All access is logged and audited.
                    </AlertDescription>
                  </Alert>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setShowNewRequestDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Cancel Request Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => !isSubmitting && setSelectedRequest(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Access Request</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel your access request to {selectedRequest.patient?.fullName}'s records?
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Requested Access</h4>
                <p className="text-sm">
                  {selectedRequest.requestAllRecords 
                    ? 'All medical records' 
                    : `Specific record: ${selectedRequest.recordId}`}
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Reason Provided</h4>
                <p className="text-sm">{selectedRequest.reason}</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Requested On</h4>
                <p className="text-sm">{formatDate(selectedRequest.createdAt)}</p>
              </div>
              
              <Alert>
                <Flag className="h-4 w-4" />
                <AlertTitle>Note</AlertTitle>
                <AlertDescription>
                  You can submit a new request after canceling this one.
                </AlertDescription>
              </Alert>
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => setSelectedRequest(null)}
                disabled={isSubmitting}
              >
                Keep Request
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleCancelRequest(selectedRequest)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Cancel Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 