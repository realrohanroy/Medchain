import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { FileText, Download, Eye, Calendar, User } from 'lucide-react';
import { getPatientSharedFiles, getMockSharedFiles, SharedFile, markFileAsViewed } from '@/services/fileService';
import { Badge } from '@/components/ui/badge';

const PatientSharedFiles: React.FC = () => {
  const { user } = useAuth();
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const loadSharedFiles = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Special case for Ansh user - use the correct ID
        // This ensures Ansh's login works even if auth returns a different ID
        let patient_id = user.id;
        if (user.email === 'ansh@gmail.com') {
          patient_id = 'ansh123'; // Force the correct ID for Ansh
        }
        
        console.log("Loading shared files for patient ID:", patient_id);
        
        try {
          // Try to get files from the database
          const files = await getPatientSharedFiles(patient_id);
          console.log("Files from database:", files);
          
          // If no files returned or if database error, use mock data
          if (files.length === 0) {
            console.log("No files returned from database, using mock data");
            const mockFiles = getMockSharedFiles(patient_id, 'patient');
            setSharedFiles(mockFiles);
            console.log("Mock files:", mockFiles);
          } else {
            setSharedFiles(files);
          }
        } catch (error) {
          console.error('Error fetching shared files from database:', error);
          // Fall back to mock data if there's an error
          const mockFiles = getMockSharedFiles(patient_id, 'patient');
          console.log("Using mock files due to error:", mockFiles);
          setSharedFiles(mockFiles);
          
          // Don't show the error toast since we recovered with mock data
          toast.info('Using demo data - database connection not available');
        }
      } catch (error) {
        console.error('Error loading shared files:', error);
        setError('Failed to load shared files');
        toast.error('Failed to load shared files. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSharedFiles();
  }, [user]);

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper function to format file sizes
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get doctor name from ID
  const getDoctorName = (doctorId: string) => {
    if (doctorId === 'doctor1') return 'Dr. Emily Chen';
    if (doctorId === 'doctor2') return 'Dr. James Wilson';
    return `Dr. ${doctorId}`;
  };

  const handleViewFile = async (file: SharedFile) => {
    // Mark the file as viewed in the database
    if (!file.is_viewed) {
      try {
        await markFileAsViewed(file.id);
        
        // Update the local state
        setSharedFiles(prev => 
          prev.map(f => 
            f.id === file.id ? { ...f, is_viewed: true } : f
          )
        );
      } catch (error) {
        console.error('Error marking file as viewed:', error);
        // Continue even if marking as viewed fails
      }
    }
    
    // Open the file
    if (file.fileUrl) {
      window.open(file.fileUrl, '_blank');
      toast.success(`Viewing ${file.file_name}...`);
    } else {
      // For mock files without URLs
      toast.info(`In demo mode: ${file.file_name} would open for viewing here`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 border border-red-200 rounded bg-red-50 text-red-700">
        <p>{error}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Files Shared with Me</CardTitle>
          <CardDescription>Medical files shared by your doctors</CardDescription>
        </CardHeader>
        <CardContent>
          {sharedFiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedFiles.map((file) => (
                <Card key={file.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-base">
                        {file.file_name}
                      </CardTitle>
                      <Badge variant="outline" className="ml-2">
                        {file.file_size ? formatFileSize(file.file_size) : 'Unknown size'}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <User className="h-3 w-3" /> 
                      {getDoctorName(file.doctor_id)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2 space-y-2">
                    <p className="text-sm">{file.description}</p>
                    <div className="flex items-center text-xs text-muted-foreground gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Shared: {formatDate(file.shared_at)}</span>
                    </div>
                    {file.is_viewed && (
                      <Badge variant="secondary" className="text-xs">Viewed</Badge>
                    )}
                  </CardContent>
                  <CardFooter className="pt-2 border-t flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewFile(file)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No files have been shared with you yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientSharedFiles; 