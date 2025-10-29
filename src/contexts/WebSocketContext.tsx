import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

type WebSocketMessage = {
  type: 'ACCESS_REQUEST_CREATED' | 'ACCESS_REQUEST_UPDATED' | 'APPOINTMENT_CREATED' | 'APPOINTMENT_UPDATED' | 'FILE_SHARED';
  payload: any;
};

type WebSocketContextType = {
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
  connected: boolean;
};

const WebSocketContext = createContext<WebSocketContextType>({
  sendMessage: () => {},
  lastMessage: null,
  connected: false,
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Simulate connection
    setTimeout(() => {
      setConnected(true);
      toast.success('Real-time connection established');
    }, 500);

    return () => {
      setConnected(false);
    };
  }, [user]);

  const handleMessage = (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      console.log('WebSocket message received:', message);

      switch (message.type) {
        case 'ACCESS_REQUEST_CREATED':
          if (user?.role === 'doctor') {
            toast.info('New access request received');
          }
          break;
        case 'ACCESS_REQUEST_UPDATED':
          if (user?.role === 'doctor') {
            const { status } = message.payload;
            if (status === 'Approved') {
              toast.success('Access request has been approved');
            } else if (status === 'Rejected') {
              toast.error('Access request has been rejected');
            }
          }
          break;
        case 'APPOINTMENT_CREATED':
          if (user?.role === 'doctor' && message.payload.doctorId === user.id) {
            // Patient has scheduled a new appointment with this doctor
            toast.info(`New appointment scheduled by ${message.payload.patientName || 'a patient'}`);
            
            // The message event will be picked up by listeners in Dashboard.tsx and Patients.tsx
            // to update the relevant components with the new patient data
            
            // Re-dispatch a more specific version of the message to the window for components to pick up
            const localEvent = new MessageEvent('message', {
              data: JSON.stringify({
                ...message,
                payload: {
                  ...message.payload,
                  receivedAt: new Date().toISOString(),
                  forDoctor: true
                }
              })
            });
            window.dispatchEvent(localEvent);
          } else if (user?.role === 'patient' && message.payload.patientId === user.id) {
            // Doctor has scheduled an appointment for this patient
            toast.info('New appointment created by your doctor');
          }
          break;
        case 'APPOINTMENT_UPDATED':
          if (user?.role === 'doctor') {
            const { status } = message.payload;
            if (status === 'Cancelled') {
              toast.error('Appointment has been cancelled');
            }
          } else if (user?.role === 'patient') {
            const { status } = message.payload;
            if (status === 'Accepted') {
              toast.success('Your appointment has been accepted');
            } else if (status === 'Cancelled') {
              toast.error('Your appointment has been cancelled');
            }
          }
          break;
        case 'FILE_SHARED':
          if (user?.role === 'patient' && message.payload.patient_id === user.id) {
            toast.info('New file shared with you');
          }
          break;
        default:
          console.log('Unknown message type:', message.type);
      }

      setLastMessage(message);
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (connected) {
      // Enhance the message with sender and receiver info
      const enhancedMessage = {
        ...message,
        payload: {
          ...message.payload,
          senderRole: user?.role,
          senderId: user?.id,
          sentAt: new Date().toISOString()
        }
      };
      
      // Simulate message handling with a delay
      setTimeout(() => {
        handleMessage(new MessageEvent('message', {
          data: JSON.stringify(enhancedMessage)
        }));
      }, 100);
    } else {
      console.error('WebSocket not connected');
    }
  };

  return (
    <WebSocketContext.Provider value={{ sendMessage, lastMessage, connected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext); 