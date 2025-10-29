import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User as UserIcon, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { findUserById } from '@/lib/mockData';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { getUserName, safeGetUserById } from '@/utils/userUtils';
import { getAppointments, createAppointment, updateAppointment } from '@/services/appointmentService';
import { getPatientAccessRequests } from '@/services/accessRequestService';

// Define interfaces
interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  datetime: string;
  reason: string;
  status: 'Pending' | 'Accepted' | 'Cancelled' | 'Completed';
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

// Time slots for appointment scheduling
const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM'
];

const DoctorAppointments = () => {
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [showNewAppointmentDialog, setShowNewAppointmentDialog] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [myPatients, setMyPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
    date: new Date(),
    time: '',
    reason: ''
  });
  
  // Load appointments and patients on component mount
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
        
        // Get patients who have requested access to this doctor
        const accessRequests = await getPatientAccessRequests(user.id);
        const patientIds = Array.from(new Set(accessRequests.map(req => req.patientId)));
        
        // Find patients from IDs
        const patients: Patient[] = [];
        for (const id of patientIds) {
          const patient = safeGetUserById(id);
          if (patient && patient.role === 'patient') {
            patients.push(patient as Patient);
          }
        }
        
        setMyPatients(patients);
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
  
  // Get appointments for the selected date
  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.datetime);
      return isSameDay(appointmentDate, date);
    });
  };
  
  const selectedDateAppointments = date ? getAppointmentsForDate(date) : [];
  
  // Calculate week days for week view
  const weekDays = Array(7).fill(0).map((_, i) => addDays(currentWeekStart, i));
  
  // Navigation handlers
  const nextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const prevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const nextDay = () => setDate(date ? addDays(date, 1) : new Date());
  const prevDay = () => setDate(date ? subDays(date, 1) : new Date());
  
  // View detail of an appointment
  const viewAppointmentDetail = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
  };
  
  // Format appointment time for display
  const formatAppointmentTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };
  
  // Update appointment status (Accept/Reject)
  const updateAppointmentStatus = async (status: 'Accepted' | 'Cancelled') => {
    if (!selectedAppointment || !user) return;
    
    setIsProcessing(true);
    try {
      // Update the appointment
      const { data, error } = await updateAppointment(selectedAppointment.id, {
        status
      });
      
      if (error) throw new Error(error);
      
      // Update local state
      setAppointments(appointments.map(apt => 
        apt.id === selectedAppointment.id ? { ...apt, status } : apt
      ));
      
      // Send WebSocket notification
      sendMessage({
        type: 'APPOINTMENT_UPDATED',
        payload: {
          appointmentId: selectedAppointment.id,
          patientId: selectedAppointment.patientId,
          doctorId: user.id,
          status
        }
      });
      
      toast.success(`Appointment ${status.toLowerCase()}`);
      setShowAppointmentDetails(false);
    } catch (error) {
      console.error(`Error ${status.toLowerCase()} appointment:`, error);
      toast.error(`Failed to ${status.toLowerCase()} appointment`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle creating a new appointment
  const handleCreateAppointment = async () => {
    if (!newAppointment.patientId || !newAppointment.time || !newAppointment.reason || !user) {
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
      
      // Get patient info for notification
      const patient = myPatients.find(p => p.id === newAppointment.patientId);
      
      // Create appointment
      const { data, error } = await createAppointment({
        patient_id: newAppointment.patientId,
        doctor_id: user.id,
        datetime: dateTime.toISOString(),
        reason: newAppointment.reason,
        status: 'Accepted' // Doctor-created appointments are auto-accepted
      });
      
      if (error) throw new Error(error);
      
      // Add to local state
      if (data) {
        setAppointments([...appointments, data as unknown as Appointment]);
        
        // Send WebSocket notification with patient name for better UI
        sendMessage({
          type: 'APPOINTMENT_CREATED',
          payload: {
            appointmentId: data.id,
            patientId: newAppointment.patientId,
            patientName: patient?.name || patient?.fullName,
            doctorId: user.id,
            doctorName: user.name || user.fullName,
            datetime: dateTime.toISOString(),
            reason: newAppointment.reason,
            status: 'Accepted'
          }
        });
      }
      
      toast.success('Appointment created successfully');
      setShowNewAppointmentDialog(false);
      setNewAppointment({
        patientId: '',
        date: new Date(),
        time: '',
        reason: ''
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Failed to create appointment');
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
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-6 w-6" />
          Appointments
        </h1>
        <Button onClick={() => setShowNewAppointmentDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>
      
      <div className="mb-6 flex flex-col lg:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Calendar</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="border rounded-md p-1">
              <div className="flex justify-between items-center p-3 border-b">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={currentView === 'day' ? 'bg-primary text-primary-foreground' : ''}
                    onClick={() => setCurrentView('day')}
                  >
                    Day
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={currentView === 'week' ? 'bg-primary text-primary-foreground' : ''}
                    onClick={() => setCurrentView('week')}
                  >
                    Week
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={currentView === 'month' ? 'bg-primary text-primary-foreground' : ''}
                    onClick={() => setCurrentView('month')}
                  >
                    Month
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={currentView === 'day' ? prevDay : prevWeek}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {currentView === 'day' && date && format(date, 'MMMM d, yyyy')}
                    {currentView === 'week' && `${format(currentWeekStart, 'MMM d')} - ${format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}`}
                    {currentView === 'month' && date && format(date, 'MMMM yyyy')}
                  </span>
                  <Button variant="ghost" size="icon" onClick={currentView === 'day' ? nextDay : nextWeek}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setDate(new Date());
                    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
                  }}>
                    Today
                  </Button>
                </div>
              </div>
              
              {currentView === 'month' && (
                <div className="p-3">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md pointer-events-auto"
                  />
                </div>
              )}
              
              {currentView === 'week' && (
                <div className="grid grid-cols-7 gap-2 p-3">
                  {weekDays.map((day, i) => {
                    const dayAppointments = getAppointmentsForDate(day);
                    const isToday = isSameDay(day, new Date());
                    const isSelected = date && isSameDay(day, date);
                    
                    return (
                      <div 
                        key={i} 
                        className={cn(
                          "min-h-[120px] rounded-md border p-2 cursor-pointer hover:bg-muted/50 transition-colors",
                          isToday && "border-primary",
                          isSelected && "bg-muted"
                        )}
                        onClick={() => setDate(day)}
                      >
                        <div className={cn(
                          "text-center p-1 rounded-md mb-1",
                          isToday && "bg-primary text-primary-foreground"
                        )}>
                          <div className="text-xs">{format(day, 'EEE')}</div>
                          <div className="text-lg font-semibold">{format(day, 'd')}</div>
                        </div>
                        
                        {dayAppointments.length > 0 ? (
                          <div className="space-y-1">
                            {dayAppointments.slice(0, 3).map((apt, j) => {
                              // Get patient name from the appointment data first, fallback to user lookup
                              const patient = apt.patient || safeGetUserById(apt.patient_id || apt.patientId);
                              const patientName = patient ? (patient.name || patient.full_name || "Patient") : 
                                (apt.patientName || (apt.patient_id ? `${apt.patient_id}` : 'Patient'));
                              
                              return (
                                <div 
                                  key={j}
                                  className={cn(
                                    "text-xs px-1 py-0.5 rounded truncate",
                                    apt.status === 'Accepted' ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" :
                                    apt.status === 'Cancelled' ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" :
                                    apt.status === 'Completed' ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" :
                                    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                  )}
                                  title={`${patientName}: ${apt.reason}`}
                                >
                                  {formatAppointmentTime(apt.datetime)} - {patientName.split(' ')[0]}
                                </div>
                              );
                            })}
                            {dayAppointments.length > 3 && (
                              <div className="text-xs text-center text-muted-foreground">
                                +{dayAppointments.length - 3} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-center text-muted-foreground mt-4">
                            No appointments
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {currentView === 'day' && date && (
                <div className="p-3 space-y-4">
                  <div className="text-center font-medium">
                    {format(date, 'EEEE, MMMM d, yyyy')}
                  </div>
                  
                  <div className="space-y-2">
                    {selectedDateAppointments.length > 0 ? (
                      selectedDateAppointments
                        .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
                        .map((appointment, i) => {
                          // Get patient name from the appointment data first, fallback to user lookup
                          const patient = appointment.patient || safeGetUserById(appointment.patient_id || appointment.patientId);
                          const patientName = patient ? (patient.name || patient.full_name || "Patient") : 
                            (appointment.patientName || (appointment.patient_id ? `${appointment.patient_id}` : 'Patient'));
                          
                          return (
                            <div 
                              key={i} 
                              className={cn(
                                "border rounded-md p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                                appointment.status === 'Accepted' ? "border-green-500" :
                                appointment.status === 'Cancelled' ? "border-red-500" :
                                appointment.status === 'Completed' ? "border-blue-500" :
                                "border-yellow-500"
                              )}
                              onClick={() => viewAppointmentDetail(appointment)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium">{formatAppointmentTime(appointment.datetime)}</div>
                                  <div className="text-sm">{patientName}</div>
                                  <div className="text-sm text-muted-foreground mt-1">{appointment.reason}</div>
                                </div>
                                <Badge 
                                  className={cn(
                                    appointment.status === 'Accepted' ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" :
                                    appointment.status === 'Cancelled' ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" :
                                    appointment.status === 'Completed' ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" :
                                    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                  )}
                                >
                                  {appointment.status}
                                </Badge>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="text-center text-muted-foreground py-6 border rounded-md">
                        No appointments scheduled for this day
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Appointment Details Dialog */}
      <Dialog open={showAppointmentDetails} onOpenChange={setShowAppointmentDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Patient</p>
                  <p>
                    {selectedAppointment.patientName || 
                     (selectedAppointment.patient
                      ? (selectedAppointment.patient.name || selectedAppointment.patient.full_name)
                      : safeGetUserById(selectedAppointment.patient_id || selectedAppointment.patientId)?.name || 
                        (selectedAppointment.patient_id ? selectedAppointment.patient_id : 'Patient'))}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge 
                    className={cn(
                      selectedAppointment.status === 'Accepted' ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" :
                      selectedAppointment.status === 'Cancelled' ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" :
                      selectedAppointment.status === 'Completed' ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" :
                      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                    )}
                  >
                    {selectedAppointment.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p>{format(new Date(selectedAppointment.datetime), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Time</p>
                  <p>{format(new Date(selectedAppointment.datetime), 'h:mm a')}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium">Reason</p>
                <p className="mt-1 p-2 bg-muted rounded-md">{selectedAppointment.reason}</p>
              </div>
              
              {selectedAppointment.status === 'Pending' && (
                <div className="flex justify-end space-x-2 mt-4">
                  <Button 
                    variant="destructive" 
                    onClick={() => updateAppointmentStatus('Cancelled')}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        Decline
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={() => updateAppointmentStatus('Accepted')}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Accept
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* New Appointment Dialog */}
      <Dialog open={showNewAppointmentDialog} onOpenChange={setShowNewAppointmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule New Appointment</DialogTitle>
            <DialogDescription>
              Create a new appointment with a patient
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Patient</label>
              <Select 
                value={newAppointment.patientId} 
                onValueChange={(value) => setNewAppointment({...newAppointment, patientId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {myPatients.map(patient => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
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
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newAppointment.date ? (
                      format(newAppointment.date, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
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
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map(time => (
                    <SelectItem key={time} value={formatTimeForBackend(time)}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                placeholder="Reason for appointment"
                value={newAppointment.reason}
                onChange={(e) => setNewAppointment({...newAppointment, reason: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowNewAppointmentDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAppointment}
              disabled={isProcessing || !newAppointment.patientId || !newAppointment.time || !newAppointment.reason}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Appointment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorAppointments;
