import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Separator,
  ScrollArea
} from '@/components/ui';
import { AlertCircle, Calendar, FileText, Clock, Info, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { 
  getPatientAccessRequests, 
  getMockPatientAccessRequests,
  getPatientAccessGrants, 
  getMockPatientAccessGrants,
  approveAccessRequest,
  denyAccessRequest,
  revokeAccessGrant,
  AccessRequest,
  AccessGrant
} from '@/services/accessRequestService';

const ReviewAccess: React.FC = () => {
  // Current user ID - would come from auth context in a real app
  const patientId = 'pat_001';

  // State variables
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [accessGrants, setAccessGrants] = useState<AccessGrant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [selectedGrant, setSelectedGrant] = useState<AccessGrant | null>(null);
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch access requests and grants on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch requests and grants in parallel
        const [requests, grants] = await Promise.all([
          getPatientAccessRequests(patientId),
          getPatientAccessGrants(patientId),
        ]);
        
        setAccessRequests(requests);
        setAccessGrants(grants);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Using offline mode.');
        
        // Fallback to mock data
        setAccessRequests(getMockPatientAccessRequests(patientId));
        setAccessGrants(getMockPatientAccessGrants(patientId));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [patientId]);

  // Handle approving a request
  const handleApprove = async (request: AccessRequest) => {
    setActionInProgress(true);
    setSuccessMessage(null);
    
    try {
      await approveAccessRequest(request.id);
      
      // Update the local state
      setAccessRequests(prev => 
        prev.map(req => 
          req.id === request.id 
            ? { ...req, status: 'approved', updatedAt: new Date().toISOString() } 
            : req
        )
      );
      
      // Refresh the grants list
      try {
        const grants = await getPatientAccessGrants(patientId);
        setAccessGrants(grants);
      } catch {
        // Fallback to mock data if the refresh fails
        setAccessGrants(getMockPatientAccessGrants(patientId));
      }
      
      setSuccessMessage(`Access request from ${request.doctor?.fullName} has been approved.`);
    } catch (err) {
      console.error('Error approving request:', err);
      setError('Failed to approve request. Please try again.');
    } finally {
      setActionInProgress(false);
      setSelectedRequest(null);
    }
  };

  // Handle denying a request
  const handleDeny = async (request: AccessRequest) => {
    setActionInProgress(true);
    setSuccessMessage(null);
    
    try {
      await denyAccessRequest(request.id);
      
      // Update the local state
      setAccessRequests(prev => 
        prev.map(req => 
          req.id === request.id 
            ? { ...req, status: 'denied', updatedAt: new Date().toISOString() } 
            : req
        )
      );
      
      setSuccessMessage(`Access request from ${request.doctor?.fullName} has been denied.`);
    } catch (err) {
      console.error('Error denying request:', err);
      setError('Failed to deny request. Please try again.');
    } finally {
      setActionInProgress(false);
      setSelectedRequest(null);
    }
  };

  // Handle revoking a grant
  const handleRevoke = async (grant: AccessGrant) => {
    setActionInProgress(true);
    setSuccessMessage(null);
    
    try {
      await revokeAccessGrant(grant.id);
      
      // Update the local state
      setAccessGrants(prev => prev.filter(g => g.id !== grant.id));
      
      setSuccessMessage(`Access for ${grant.doctor?.fullName} has been revoked.`);
    } catch (err) {
      console.error('Error revoking grant:', err);
      setError('Failed to revoke access. Please try again.');
    } finally {
      setActionInProgress(false);
      setSelectedGrant(null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Manage Medical Record Access</h1>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {successMessage && (
        <Alert variant="success">
          <Check className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests">
            Access Requests {accessRequests.filter(r => r.status === 'pending').length > 0 && 
              <Badge variant="secondary" className="ml-2">
                {accessRequests.filter(r => r.status === 'pending').length}
              </Badge>
            }
          </TabsTrigger>
          <TabsTrigger value="active">
            Active Access {accessGrants.length > 0 && 
              <Badge variant="secondary" className="ml-2">
                {accessGrants.length}
              </Badge>
            }
          </TabsTrigger>
        </TabsList>
        
        {/* Access Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {accessRequests.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No access requests found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accessRequests.map((request) => (
                <Card key={request.id} className={`overflow-hidden ${request.status === 'pending' ? 'border-orange-300' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{request.doctor?.fullName}</CardTitle>
                        <CardDescription>{request.doctor?.specialty} • {request.doctor?.hospital}</CardDescription>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2 space-y-2">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Requested Access</p>
                        <p className="text-sm text-muted-foreground">
                          {request.requestAllRecords 
                            ? 'All medical records' 
                            : `Specific record: ${request.recordId}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Reason</p>
                        <p className="text-sm text-muted-foreground">{request.reason}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Requested On</p>
                        <p className="text-sm text-muted-foreground">{formatDate(request.createdAt)}</p>
                      </div>
                    </div>
                    
                    {request.status !== 'pending' && (
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Updated On</p>
                          <p className="text-sm text-muted-foreground">{formatDate(request.updatedAt)}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  
                  {request.status === 'pending' && (
                    <CardFooter className="flex justify-end gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
                        Respond
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Active Access Tab */}
        <TabsContent value="active" className="space-y-4">
          {accessGrants.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active access grants found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accessGrants.map((grant) => (
                <Card key={grant.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{grant.doctor?.fullName}</CardTitle>
                        <CardDescription>{grant.doctor?.specialty} • {grant.doctor?.hospital}</CardDescription>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2 space-y-2">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Access Level</p>
                        <p className="text-sm text-muted-foreground">
                          {grant.grantAllRecords 
                            ? 'All medical records' 
                            : `Specific record: ${grant.recordId}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Granted On</p>
                        <p className="text-sm text-muted-foreground">{formatDate(grant.createdAt)}</p>
                      </div>
                    </div>
                    
                    {grant.expiresAt && (
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Expires On</p>
                          <p className="text-sm text-muted-foreground">{formatDate(grant.expiresAt)}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex justify-end gap-2 pt-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedGrant(grant)}
                    >
                      Revoke Access
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Respond to Request Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => !actionInProgress && setSelectedRequest(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Respond to Access Request</DialogTitle>
              <DialogDescription>
                Please review the details and decide whether to approve or deny this request.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Doctor Information</h4>
                <p className="text-sm">{selectedRequest.doctor?.fullName}</p>
                <p className="text-sm text-muted-foreground">{selectedRequest.doctor?.specialty} • {selectedRequest.doctor?.hospital}</p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Requested Access</h4>
                <p className="text-sm">
                  {selectedRequest.requestAllRecords 
                    ? 'All medical records' 
                    : `Specific record: ${selectedRequest.recordId}`}
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Reason for Request</h4>
                <ScrollArea className="h-20 rounded-md border p-2">
                  <p className="text-sm">{selectedRequest.reason}</p>
                </ScrollArea>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Request Date</h4>
                <p className="text-sm">{formatDate(selectedRequest.createdAt)}</p>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  By approving this request, you are giving this doctor access to view your 
                  {selectedRequest.requestAllRecords 
                    ? ' entire medical history' 
                    : ' specified medical record'}.
                  This access will be granted for 30 days by default.
                </AlertDescription>
              </Alert>
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="destructive" 
                onClick={() => handleDeny(selectedRequest)}
                disabled={actionInProgress}
              >
                {actionInProgress ? 'Processing...' : 'Deny Request'}
              </Button>
              <Button 
                onClick={() => handleApprove(selectedRequest)}
                disabled={actionInProgress}
              >
                {actionInProgress ? 'Processing...' : 'Approve Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Revoke Access Dialog */}
      {selectedGrant && (
        <Dialog open={!!selectedGrant} onOpenChange={() => !actionInProgress && setSelectedGrant(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revoke Access</DialogTitle>
              <DialogDescription>
                Are you sure you want to revoke access for {selectedGrant.doctor?.fullName}?
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Currently Has Access To</h4>
                <p className="text-sm">
                  {selectedGrant.grantAllRecords 
                    ? 'All medical records' 
                    : `Specific record: ${selectedGrant.recordId}`}
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Access Granted On</h4>
                <p className="text-sm">{formatDate(selectedGrant.createdAt)}</p>
              </div>
              
              {selectedGrant.expiresAt && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Access Expires On</h4>
                  <p className="text-sm">{formatDate(selectedGrant.expiresAt)}</p>
                </div>
              )}
              
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Revoking access will immediately prevent this doctor from viewing your medical records.
                  This action cannot be undone.
                </AlertDescription>
              </Alert>
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => setSelectedGrant(null)}
                disabled={actionInProgress}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleRevoke(selectedGrant)}
                disabled={actionInProgress}
              >
                {actionInProgress ? 'Processing...' : 'Revoke Access'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ReviewAccess; 