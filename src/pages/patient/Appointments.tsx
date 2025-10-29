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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Search, X, Plus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { getUserName, safeGetUserById } from '@/utils/userUtils';
import { getAppointments, createAppointment, updateAppointment } from '@/services/appointmentService';
import { getAvailableDoctors } from '@/services/accessRequestService';

// Define interfaces
interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  datetime: string;
  reason: string;
  status: 'Pending' | 'Accepted' | 'Cancelled' | 'Completed';
}

interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization?: string;
  wallet?: string;
  hospital?: string;
}

const PatientAppointments: React.FC = () => {
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    doctorId: '',
    date: new Date(),
    time: '',
    reason: ''
  });
  
  // Load appointments and available doctors on component mount
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
        
        // Load available doctors
        const doctors = await getAvailableDoctors();
        setAvailableDoctors(doctors as Doctor[]);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load appointments');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user]);
  
  if (!user) return null;
  
  const availableTimes = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM'
  ];
  
  const filteredAppointments = appointments.filter(appointment => {
    const doctor = safeGetUserById(appointment.doctorId);
    const doctorName = doctor ? doctor.name : 'Unknown Doctor';
    
    return (
      doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    
    setIsProcessing(true);
    try {
      // Update appointment status
      const { data, error } = await updateAppointment(selectedAppointment.id, {
        status: 'Cancelled'
      });
      
      if (error) throw new Error(error);
      
      // Update local state
      setAppointments(appointments.map(apt => 
        apt.id === selectedAppointment.id ? { ...apt, status: 'Cancelled' } : apt
      ));
      
      // Send WebSocket notification
      sendMessage({
        type: 'APPOINTMENT_UPDATED',
        payload: {
          appointmentId: selectedAppointment.id,
          patientId: user.id,
          doctorId: selectedAppointment.doctorId,
          status: 'Cancelled'
        }
      });
      
      toast.success('Appointment cancelled successfully');
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const openCancelDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelDialog(true);
  };
  
  const handleBookAppointment = async () => {
    if (!newAppointment.doctorId || !newAppointment.time || !newAppointment.reason) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsProcessing(true);
    try {
      // Format datetime string
      const dateTime = new Date(newAppointment.date);
      const [hours, minutes] = newAppointment.time.split(':');
      dateTime.setHours(parseInt(hours, 10));
      dateTime.setMinutes(parseInt(minutes, 10));
      
      // Create appointment
      const { data, error } = await createAppointment({
        patient_id: user.id,
        doctor_id: newAppointment.doctorId,
        datetime: dateTime.toISOString(),
        reason: newAppointment.reason,
        status: 'Pending'
      });
      
      if (error) throw new Error(error);
      
      // Add to local state
      if (data) {
        setAppointments([...appointments, data as unknown as Appointment]);
        
        // Send WebSocket notification with patient name for better doctor UI
        sendMessage({
          type: 'APPOINTMENT_CREATED',
          payload: {
            appointmentId: data.id,
            patientId: user.id,
            patientName: user.name || user.fullName,
            doctorId: newAppointment.doctorId,
            datetime: dateTime.toISOString(),
            reason: newAppointment.reason
          }
        });
      }
      
      toast.success('Appointment request sent successfully');
      setShowBookDialog(false);
      setNewAppointment({
        doctorId: '',
        date: new Date(),
        time: '',
        reason: ''
      });
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to book appointment');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const formatTimeForBackend = (timeString: string) => {
    // Convert "09:00 AM" to "09:00" format
    const [time, period] = timeString.split(' ');
    let [hours, minutes] = time.split(':').map(part => parseInt(part, 10));
    
    if (period === 'PM' && hours < 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading appointments...</span>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Appointments</h1>
        <Button onClick={() => setShowBookDialog(true)}>
          <Calendar className="mr-2 h-4 w-4" />
          Request Appointment
        </Button>
      </div>
      
      <div className="flex items-center mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search appointments..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((appointment) => {
                    const doctor = safeGetUserById(appointment.doctorId);
                    const appointmentDate = new Date(appointment.datetime);
                    const isPast = appointmentDate < new Date();
                    
                    return (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-medium">{doctor ? doctor.name : 'Unknown Doctor'}</TableCell>
                        <TableCell>
                          {appointmentDate.toLocaleDateString()}{' '}
                          {appointmentDate.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </TableCell>
                        <TableCell>{appointment.reason}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              appointment.status === 'Accepted' 
                                ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-900' 
                                : appointment.status === 'Cancelled'
                                  ? 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-900'
                                  : appointment.status === 'Completed'
                                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-900'
                                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-900'
                            }
                          >
                            {appointment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {!isPast && appointment.status !== 'Cancelled' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openCancelDialog(appointment)}
                              className="text-red-500 hover:text-red-700"
                              disabled={isProcessing}
                            >
                              {isProcessing && selectedAppointment?.id === appointment.id ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <X className="mr-1 h-4 w-4" />
                              )}
                              Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No appointments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-4">
              Are you sure you want to cancel this appointment?
            </p>
            
            {selectedAppointment && (
              <div className="bg-muted p-4 rounded-md mb-4">
                <p><strong>Doctor:</strong> {safeGetUserById(selectedAppointment.doctorId)?.name || 'Unknown Doctor'}</p>
                <p><strong>Date:</strong> {new Date(selectedAppointment.datetime).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {new Date(selectedAppointment.datetime).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</p>
                <p><strong>Reason:</strong> {selectedAppointment.reason}</p>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowCancelDialog(false)}
                disabled={isProcessing}
              >
                Keep Appointment
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleCancelAppointment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Yes, Cancel'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book New Appointment</DialogTitle>
            <DialogDescription>
              Request an appointment with a doctor
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Doctor</label>
              <Select 
                value={newAppointment.doctorId} 
                onValueChange={(value) => setNewAppointment({...newAppointment, doctorId: value})}
              >
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
              <label className="text-sm font-medium">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {newAppointment.date ? (
                      format(newAppointment.date, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={newAppointment.date}
                    onSelect={(date) => date && setNewAppointment({...newAppointment, date})}
                    initialFocus
                    disabled={(date) => 
                      date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                      date.getDay() === 0 || 
                      date.getDay() === 6
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Time</label>
              <Select 
                value={newAppointment.time} 
                onValueChange={(value) => setNewAppointment({...newAppointment, time: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a time" />
                </SelectTrigger>
                <SelectContent>
                  {availableTimes.map(time => (
                    <SelectItem key={time} value={formatTimeForBackend(time)}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Visit</label>
              <Textarea 
                placeholder="Describe the reason for your appointment"
                value={newAppointment.reason}
                onChange={(e) => setNewAppointment({...newAppointment, reason: e.target.value})}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowBookDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBookAppointment}
              disabled={isProcessing || !newAppointment.doctorId || !newAppointment.time || !newAppointment.reason}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                'Book Appointment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientAppointments;
