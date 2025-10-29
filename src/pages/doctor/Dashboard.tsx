import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar, 
  FileText, 
  ClipboardCheck 
} from 'lucide-react';
import { 
  getUserMedicalRecords,
  getUserNotifications
} from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getAppointments } from '@/services/appointmentService';
import { getDoctorAccessRequests } from '@/services/accessRequestService';
import { getDoctorPatients } from '@/services/patientService';
import { toast } from 'sonner';

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [accessRequests, setAccessRequests] = React.useState<any[]>([]);
  const [patients, setPatients] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Load appointments
        const { data: appointmentsData, error: appointmentsError } = await getAppointments(user.id, 'doctor');
        if (appointmentsError) {
          throw new Error(appointmentsError);
        }
        setAppointments(appointmentsData || []);
        
        // Load access requests
        const requests = await getDoctorAccessRequests(user.id);
        setAccessRequests(requests);
        
        // Load patients
        const { data: patientsData, error: patientsError } = await getDoctorPatients(user.id);
        if (patientsError) {
          console.error('Error loading patients:', patientsError);
        }
        setPatients(patientsData || []);
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
        console.log('WebSocket message received in DoctorDashboard:', event.data);
        const message = JSON.parse(event.data);
        
        if (message.type === 'APPOINTMENT_CREATED' || message.type === 'APPOINTMENT_UPDATED') {
          // Reload appointments to get the latest data
          const loadAppointments = async () => {
            if (!user) return;
            
            try {
              const { data, error } = await getAppointments(user.id, 'doctor');
              
              if (error) {
                throw new Error(error);
              }
              
              setAppointments(data || []);
              
              // Also reload patients list as it may have changed due to new appointment
              const { data: patientsData } = await getDoctorPatients(user.id);
              setPatients(patientsData || []);
            } catch (error) {
              console.error('Error loading appointments:', error);
            }
          };
          
          loadAppointments();
          
          // Show toast notification for new appointments
          if (message.type === 'APPOINTMENT_CREATED') {
            toast.info('New appointment scheduled');
          }
        } else if (message.type === 'ACCESS_REQUEST_CREATED' || message.type === 'ACCESS_REQUEST_UPDATED') {
          // Reload access requests to get the latest data
          const loadAccessRequests = async () => {
            if (!user) return;
            
            try {
              const requests = await getDoctorAccessRequests(user.id);
              setAccessRequests(requests);
              
              // Show toast notification for new requests
              if (message.type === 'ACCESS_REQUEST_CREATED') {
                toast.info('New access request received');
              } else if (message.type === 'ACCESS_REQUEST_UPDATED') {
                const { status } = message.payload;
                if (status === 'Approved') {
                  toast.success('Access request has been approved');
                } else if (status === 'Rejected') {
                  toast.error('Access request has been rejected');
                }
              }
              
              // Reload patients list as it may have changed due to new access request
              const { data: patientsData } = await getDoctorPatients(user.id);
              setPatients(patientsData || []);
            } catch (error) {
              console.error('Error loading access requests:', error);
            }
          };
          
          loadAccessRequests();
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
  
  const notifications = getUserNotifications(user.id);
  
  // Filter appointments for today and upcoming
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.datetime);
    aptDate.setHours(0, 0, 0, 0);
    return aptDate.getTime() === today.getTime();
  });
  
  const upcomingAppointments = appointments.filter(apt => {
    return new Date(apt.datetime) > new Date();
  });
  
  // Filter access requests by status
  const pendingRequests = accessRequests.filter(req => req.status === 'Pending');
  
  // Data for circle charts
  const ageGroupData = [
    { name: '<18', value: 4, color: '#ff6384' },
    { name: '18-35', value: 12, color: '#36a2eb' },
    { name: '36-55', value: 18, color: '#ffce56' },
    { name: '56+', value: 8, color: '#4bc0c0' },
  ];
  
  const diseaseData = [
    { name: 'Hypertension', value: 15, color: '#ff6384' },
    { name: 'Diabetes', value: 10, color: '#36a2eb' },
    { name: 'Asthma', value: 8, color: '#ffce56' },
    { name: 'Heart Disease', value: 6, color: '#4bc0c0' },
    { name: 'Arthritis', value: 5, color: '#9966ff' },
  ];

  const genderDistribution = [
    { name: 'Male', value: 20, color: '#3B82F6' },
    { name: 'Female', value: 22, color: '#EC4899' },
    { name: 'Other', value: 3, color: '#10B981' },
  ];
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Doctor Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">My Patients</CardTitle>
            <CardDescription>Total patients under your care</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{patients.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Active patients</div>
            <Link to="/doctor/patients">
              <Button className="w-full mt-4" variant="outline">View Patients</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Today's Schedule</CardTitle>
            <CardDescription>Appointments for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayAppointments.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Appointments</div>
            <Link to="/doctor/appointments">
              <Button className="w-full mt-4" variant="outline">View Schedule</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pending Approvals</CardTitle>
            <CardDescription>Access requests pending review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {pendingRequests.length}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Requests</div>
            <Link to="/doctor/approvals">
              <Button className="w-full mt-4" variant="outline">Review Requests</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Shared Records</CardTitle>
            <CardDescription>Records shared with you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {getUserMedicalRecords(user.id).length}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Available records</div>
            <Link to="/doctor/records">
              <Button className="w-full mt-4" variant="outline">View Records</Button>
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
                {upcomingAppointments.slice(0, 5).map((appointment) => {
                  // Find patient information from the patients state or the appointment data
                  const patient = appointment.patient || patients.find(p => p.id === appointment.patient_id);
                  const patientName = patient
                    ? (patient.name || patient.full_name)
                    : appointment.patient_id
                      ? `Patient ${appointment.patient_id}`
                      : 'Patient';
                  
                  return (
                    <div key={appointment.id} className="flex justify-between items-center border-b pb-3">
                      <div>
                        <p className="font-medium">{patientName}</p>
                        <p className="text-sm text-gray-500">{appointment.reason}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(appointment.datetime).toLocaleDateString()} at{' '}
                          {new Date(appointment.datetime).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <div
                          className={`px-2 py-1 text-xs rounded-full ${
                            appointment.status === 'Accepted' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {appointment.status}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <p>No upcoming appointments</p>
              </div>
            )}
            <Link to="/doctor/appointments">
              <Button variant="link" className="mt-4 p-0">View full schedule</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardCheck className="mr-2 h-5 w-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="border-b pb-3">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <p>No recent activities</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Patient Age Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ageGroupData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ageGroupData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} patients`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Common Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={diseaseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {diseaseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} patients`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorDashboard;
