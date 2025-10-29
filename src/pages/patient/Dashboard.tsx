import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Calendar, FileText, UserCheck, Loader2 } from 'lucide-react';
import { 
  getUserNotifications,  
  findUserById
} from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Link } from 'react-router-dom';
import { getUserName, safeGetUserById } from '@/utils/userUtils';
import { getAppointments } from '@/services/appointmentService';
import { getPatientAccessRequests } from '@/services/accessRequestService';
import { getPatientMedicalRecords } from '@/services/recordsService';
import { toast } from 'sonner';

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Load appointments
        const { data: appointmentsData, error: appointmentsError } = await getAppointments(user.id, 'patient');
        if (appointmentsError) {
          throw new Error(appointmentsError);
        }
        setAppointments(appointmentsData || []);
        
        // Load access requests
        const requests = await getPatientAccessRequests(user.id);
        setAccessRequests(requests);
        
        // Load medical records
        const { data: recordsData, error: recordsError } = await getPatientMedicalRecords(user.id);
        if (recordsError) {
          console.error('Error loading medical records:', recordsError);
        }
        setRecords(recordsData || []);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
    
    // Set up WebSocket message listener
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        console.log('WebSocket message received in PatientDashboard:', event.data);
        const message = JSON.parse(event.data);
        
        if (message.type === 'APPOINTMENT_CREATED' || message.type === 'APPOINTMENT_UPDATED') {
          // Reload appointments to get the latest data
          const loadAppointments = async () => {
            if (!user) return;
            
            try {
              const { data, error } = await getAppointments(user.id, 'patient');
              
              if (error) {
                throw new Error(error);
              }
              
              setAppointments(data || []);
            } catch (error) {
              console.error('Error loading appointments:', error);
            }
          };
          
          loadAppointments();
          
          // Show toast notification for appointment updates
          if (message.type === 'APPOINTMENT_CREATED' && message.payload.patientId === user.id) {
            toast.info('New appointment has been scheduled for you');
          } else if (message.type === 'APPOINTMENT_UPDATED' && message.payload.patientId === user.id) {
            if (message.payload.status === 'Accepted') {
              toast.success('Your appointment has been confirmed');
            } else if (message.payload.status === 'Cancelled') {
              toast.error('Your appointment has been cancelled');
            }
          }
        } else if (message.type === 'ACCESS_REQUEST_CREATED' || message.type === 'ACCESS_REQUEST_UPDATED') {
          // Reload access requests to get the latest data
          const loadAccessRequests = async () => {
            if (!user) return;
            
            try {
              const requests = await getPatientAccessRequests(user.id);
              setAccessRequests(requests);
              
              // Show toast notification for request updates
              if (message.type === 'ACCESS_REQUEST_CREATED' && message.payload.patientId === user.id) {
                toast.info('New access request received');
              } else if (message.type === 'ACCESS_REQUEST_UPDATED' && message.payload.patientId === user.id) {
                const { status } = message.payload;
                toast.info(`Access request status updated to: ${status}`);
              }
            } catch (error) {
              console.error('Error loading access requests:', error);
            }
          };
          
          loadAccessRequests();
        } else if (message.type === 'FILE_SHARED' && message.payload.patient_id === user.id) {
          // Reload medical records when a new file is shared
          const loadRecords = async () => {
            if (!user) return;
            
            try {
              const { data, error } = await getPatientMedicalRecords(user.id);
              if (error) {
                throw new Error(error);
              }
              
              setRecords(data || []);
              toast.info('New medical record has been added to your profile');
            } catch (error) {
              console.error('Error loading medical records:', error);
            }
          };
          
          loadRecords();
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
  
  const notifications = getUserNotifications(user.id).slice(0, 3);
  
  const upcomingAppointments = appointments.filter(
    apt => new Date(apt.datetime) > new Date()
  );
  
  const pendingAccessRequests = accessRequests.filter(req => req.status === 'Pending');
  
  const recentRecords = records.slice(0, 3);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Patient Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Medical Records</CardTitle>
            <CardDescription>Your uploaded health records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{records.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Total records</div>
            <Link to="/patient/records">
              <Button className="w-full mt-4" variant="outline">View All Records</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
            <CardDescription>Your scheduled appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{upcomingAppointments.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Scheduled</div>
            <Link to="/patient/appointments">
              <Button className="w-full mt-4" variant="outline">Manage Appointments</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Access Requests</CardTitle>
            <CardDescription>Pending record access requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {pendingAccessRequests.length}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Pending</div>
            <Link to="/patient/access">
              <Button className="w-full mt-4" variant="outline">Manage Access</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.slice(0, 3).map((appointment) => {
                  // Use the doctor information from appointment data
                  const doctor = appointment.doctor || safeGetUserById(appointment.doctor_id);
                  return (
                    <div key={appointment.id} className="flex justify-between items-center border-b pb-3">
                      <div>
                        <p className="font-medium">{doctor?.name || doctor?.full_name || 'Unknown Doctor'}</p>
                        <p className="text-sm text-gray-500">{appointment.reason}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(appointment.datetime).toLocaleDateString()} at{' '}
                          {new Date(appointment.datetime).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      <Badge
                        className={
                          appointment.status === 'Accepted' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                            : appointment.status === 'Cancelled'
                              ? 'bg-red-100 text-red-800 hover:bg-red-100'
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                        }
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <p>No upcoming appointments</p>
              </div>
            )}
            <Link to="/patient/appointments">
              <Button variant="link" className="mt-4 p-0">View all appointments</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Recent Medical Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentRecords.length > 0 ? (
              <div className="space-y-4">
                {recentRecords.map((record) => (
                  <div key={record.id} className="border-b pb-3">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">{record.file_name || record.fileName}</p>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-400">
                        Uploaded on {new Date(record.created_at || record.uploadDate).toLocaleDateString()}
                      </p>
                      <div className="flex space-x-1">
                        {(record.tags || []).map((tag, i) => (
                          <span 
                            key={i}
                            className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <p>No medical records found</p>
              </div>
            )}
            <Link to="/patient/records">
              <Button variant="link" className="mt-4 p-0">View all records</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCheck className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className="flex items-start border-b pb-3">
                    <div className="flex-1">
                      <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientDashboard;
