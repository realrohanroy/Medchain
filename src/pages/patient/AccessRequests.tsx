import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getPatientAccessRequests, 
  getPatientAccessGrants,
  updateAccessRequestStatus,
  revokeAccessGrant,
  getMockPatientAccessRequests,
  getMockPatientAccessGrants,
  type AccessRequest,
  type AccessGrant
} from '@/services/accessRequestService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle, XCircle, AlertCircle, Eye, FileText, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from 'sonner';

export default function AccessRequests() {
  const { user } = useAuth();
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [accessGrants, setAccessGrants] = useState<AccessGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests');
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [selectedGrant, setSelectedGrant] = useState<AccessGrant | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  
  // Fetch access requests and grants
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Try to fetch from the database
        let requests: AccessRequest[] = [];
        let grants: AccessGrant[] = [];
        
        try {
          requests = await getPatientAccessRequests(user.id);
          grants = await getPatientAccessGrants(user.id);
        } catch (error) {
          console.error('Error fetching from database, falling back to mock data:', error);
          // Fallback to mock data if database call fails
          requests = getMockPatientAccessRequests(user.id);
          grants = getMockPatientAccessGrants(user.id);
        }
        
        setAccessRequests(requests);
        setAccessGrants(grants);
      } catch (error) {
        console.error('Error fetching access data:', error);
        toast.error('Failed to load access requests and grants');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user?.id]);
  
  // Handle approving an access request
  const handleApprove = async (requestId: string) => {
    if (!user?.id) return;
    
    try {
      const success = await updateAccessRequestStatus(requestId, 'approved', user.id);
      if (success) {
        // Update local state
        setAccessRequests(prev => 
          prev.map(req => 
            req.id === requestId ? { ...req, status: 'approved' } : req
          )
        );
        
        // Re-fetch grants to get the newly created one
        const grants = await getPatientAccessGrants(user.id);
        setAccessGrants(grants);
        
        setShowRequestDialog(false);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    }
  };
  
  // Handle denying an access request
  const handleDeny = async (requestId: string) => {
    if (!user?.id) return;
    
    try {
      const success = await updateAccessRequestStatus(requestId, 'denied', user.id);
      if (success) {
        // Update local state
        setAccessRequests(prev => 
          prev.map(req => 
            req.id === requestId ? { ...req, status: 'denied' } : req
          )
        );
        setShowRequestDialog(false);
      }
    } catch (error) {
      console.error('Error denying request:', error);
      toast.error('Failed to deny request');
    }
  };
  
  // Handle revoking access grant
  const handleRevoke = async (grantId: string) => {
    if (!user?.id) return;
    
    try {
      const success = await revokeAccessGrant(grantId, user.id);
      if (success) {
        // Update local state
        setAccessGrants(prev => prev.filter(grant => grant.id !== grantId));
        setShowGrantDialog(false);
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      toast.error('Failed to revoke access');
    }
  };
  
  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
  
  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading access requests...</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Manage Medical Record Access</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="requests" className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Access Requests
            {accessRequests.filter(req => req.status.toLowerCase() === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {accessRequests.filter(req => req.status.toLowerCase() === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="grants" className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            Active Grants
            {accessGrants.length > 0 && (
              <Badge className="ml-2 bg-blue-500">
                {accessGrants.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="requests">
          {accessRequests.length === 0 ? (
            <div className="text-center py-10">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Access Requests</h3>
              <p className="text-sm text-muted-foreground">
                When doctors request access to your medical records, they will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accessRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle>{request.doctor?.fullName || `Doctor ID: ${request.doctorId}`}</CardTitle>
                      {getStatusBadge(request.status)}
                    </div>
                    <CardDescription>
                      {request.doctor?.specialty || 'Unknown Specialty'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">Request: 
                      {request.requestAllRecords 
                        ? ' All medical records'
                        : ` Specific record ${request.recordId?.substring(0, 8)}`
                      }
                    </p>
                    <p className="text-sm mt-2">Reason for request: </p>
                    <p className="text-sm bg-secondary p-2 rounded mt-1">{request.reason}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Requested on {formatDate(request.createdAt)}
                    </p>
                  </CardContent>
                  <CardFooter className="bg-muted/40 pt-3">
                    {request.status.toLowerCase() === 'pending' ? (
                      <div className="w-full flex gap-2">
                        <Button 
                          variant="default" 
                          className="flex-1"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRequestDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      </div>
                    ) : (
                      <div className="w-full">
                        <p className="text-xs">
                          {request.status.toLowerCase() === 'approved' 
                            ? 'You approved this request. The doctor now has access.'
                            : 'You denied this request. The doctor does not have access.'}
                        </p>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="grants">
          {accessGrants.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Active Grants</h3>
              <p className="text-sm text-muted-foreground">
                When you approve access requests, doctors will be able to view your medical records.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accessGrants.map((grant) => (
                <Card key={grant.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle>{grant.doctor?.fullName || `Doctor ID: ${grant.doctorId}`}</CardTitle>
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" /> Active
                      </Badge>
                    </div>
                    <CardDescription>
                      {grant.doctor?.specialty || 'Unknown Specialty'}
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
                      variant="destructive" 
                      className="w-full"
                      onClick={() => {
                        setSelectedGrant(grant);
                        setShowGrantDialog(true);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Revoke Access
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Request Review Dialog */}
      {selectedRequest && (
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Access Request from Doctor</DialogTitle>
              <DialogDescription>
                Review this request for access to your medical records
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <h4 className="text-sm font-medium">Doctor Information</h4>
                <p className="text-sm">{selectedRequest.doctor?.fullName || `ID: ${selectedRequest.doctorId}`}</p>
                <p className="text-sm">{selectedRequest.doctor?.specialty || 'Unknown Specialty'}</p>
                <p className="text-sm">{selectedRequest.doctor?.email || 'No email provided'}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Request Details</h4>
                <p className="text-sm">
                  {selectedRequest.requestAllRecords 
                    ? 'Requesting access to ALL your medical records' 
                    : `Requesting access to a specific record (${selectedRequest.recordId?.substring(0, 8)})`
                  }
                </p>
                <p className="text-sm mt-2">Reason provided:</p>
                <Alert>
                  <AlertDescription>
                    {selectedRequest.reason}
                  </AlertDescription>
                </Alert>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Requested on</h4>
                <p className="text-sm">{formatDate(selectedRequest.createdAt)}</p>
              </div>
              
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  By approving this request, you are giving this doctor access to your medical records.
                  You can revoke access at any time.
                </AlertDescription>
              </Alert>
            </div>
            
            <DialogFooter>
              <div className="flex w-full gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleDeny(selectedRequest.id)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Deny
                </Button>
                <Button 
                  variant="default" 
                  className="flex-1"
                  onClick={() => handleApprove(selectedRequest.id)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Grant Revocation Dialog */}
      {selectedGrant && (
        <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revoke Access</DialogTitle>
              <DialogDescription>
                Are you sure you want to revoke access for this doctor?
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <h4 className="text-sm font-medium">Doctor Information</h4>
                <p className="text-sm">{selectedGrant.doctor?.fullName || `ID: ${selectedGrant.doctorId}`}</p>
                <p className="text-sm">{selectedGrant.doctor?.specialty || 'Unknown Specialty'}</p>
                <p className="text-sm">{selectedGrant.doctor?.email || 'No email provided'}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Access Details</h4>
                <p className="text-sm">
                  {selectedGrant.grantAllRecords 
                    ? 'Currently has access to ALL your medical records' 
                    : `Currently has access to a specific record (${selectedGrant.recordId?.substring(0, 8)})`
                  }
                </p>
              </div>
              
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  This action will immediately revoke the doctor's access to your medical records.
                  They will need to request access again if needed.
                </AlertDescription>
              </Alert>
            </div>
            
            <DialogFooter>
              <div className="flex w-full gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowGrantDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => handleRevoke(selectedGrant.id)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Revoke Access
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 