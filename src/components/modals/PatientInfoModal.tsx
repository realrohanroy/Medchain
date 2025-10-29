
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getUserById } from '@/services/userService';

interface PatientInfoModalProps {
  open: boolean;
  onClose: () => void;
  patientId: string | null;
}

interface PatientProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  wallet_address?: string;
  created_at: string;
}

const PatientInfoModal: React.FC<PatientInfoModalProps> = ({
  open,
  onClose,
  patientId
}) => {
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchPatientInfo = async () => {
      if (patientId && open) {
        setLoading(true);
        try {
          const { data, error } = await getUserById(patientId);
          if (error) throw new Error(error);
          if (data) {
            setPatient(data as PatientProfile);
          }
        } catch (error) {
          console.error('Error fetching patient info:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchPatientInfo();
  }, [patientId, open]);

  if (!patientId || !open) return null;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle>Patient Information</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="py-6 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : patient ? (
          <div className="grid gap-6 py-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={patient.avatar || ""} />
                <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{patient.name}</h3>
                <p className="text-sm text-muted-foreground">{patient.email}</p>
              </div>
            </div>
            
            <div className="grid gap-2">
              <div className="flex justify-between items-center py-2 border-b dark:border-gray-800">
                <span className="text-sm text-muted-foreground">Patient ID</span>
                <span className="font-medium">{patient.id}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b dark:border-gray-800">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  Active
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b dark:border-gray-800">
                <span className="text-sm text-muted-foreground">Joined Date</span>
                <span className="font-medium">
                  {new Date(patient.created_at).toLocaleDateString()}
                </span>
              </div>
              
              {patient.wallet_address && (
                <div className="flex justify-between items-center py-2 border-b dark:border-gray-800">
                  <span className="text-sm text-muted-foreground">Wallet</span>
                  <span className="font-medium font-mono text-xs">
                    {`${patient.wallet_address.substring(0, 6)}...${patient.wallet_address.substring(patient.wallet_address.length - 4)}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            <p>No patient information found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PatientInfoModal;
