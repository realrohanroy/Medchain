
import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Eye, 
  Download,
  FileCheck,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getUserMedicalRecords, findUserById } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { getUserName } from '@/utils/userUtils';

// Mock data for shared records
const mockSharedRecords = [
  {
    id: 'sr1',
    fileName: 'Blood Test Results.pdf',
    doctorId: 'doc1',
    originalOwnerId: 'user2',
    dateShared: '2025-04-15',
    cid: 'Qma1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
    tags: ['Blood Test', 'Lab Results'],
    status: 'Active'
  },
  {
    id: 'sr2',
    fileName: 'X-Ray Image.jpg',
    doctorId: 'doc1',
    originalOwnerId: 'user2',
    dateShared: '2025-04-10',
    cid: 'Qmb2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1',
    tags: ['X-Ray', 'Chest'],
    status: 'Active'
  },
  {
    id: 'sr3',
    fileName: 'Prescription.pdf',
    doctorId: 'doc2',
    originalOwnerId: 'user2',
    dateShared: '2025-04-05',
    cid: 'Qmc3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2',
    tags: ['Prescription', 'Medication'],
    status: 'Revoked'
  }
];

const PatientShared: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  
  if (!user) return null;
  
  const filteredRecords = mockSharedRecords.filter(record => 
    record.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const truncateCid = (cid: string) => {
    return `${cid.slice(0, 6)}...${cid.slice(-4)}`;
  };
  
  const handleView = (record: any) => {
    setSelectedRecord(record);
    setShowViewDialog(true);
  };
  
  const handleDownload = (recordId: string) => {
    toast.success('Downloading file (simulated)');
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FileCheck className="h-6 w-6" />
        Records Shared with Me
      </h1>
      
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Shared Medical Records</CardTitle>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search records..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Shared By</TableHead>
                  <TableHead>Date Shared</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => {
                    const originalOwner = findUserById(record.originalOwnerId);
                    
                    return (
                      <TableRow key={record.id} className={record.status === 'Revoked' ? 'opacity-60' : ''}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.fileName}</p>
                            <p className="text-xs text-muted-foreground">{truncateCid(record.cid)}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getUserName(originalOwner)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>{new Date(record.dateShared).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={record.status === 'Active' ? 'default' : 'secondary'}
                            className={record.status === 'Revoked' ? 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400' : ''}
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleView(record)}
                              disabled={record.status === 'Revoked'}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDownload(record.id)}
                              disabled={record.status === 'Revoked'}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No shared records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Record Information</DialogTitle>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="py-2">
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-md">
                  <h3 className="text-lg font-medium mb-2">{selectedRecord.fileName}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Content ID (CID)</p>
                      <p className="font-mono text-sm">{selectedRecord.cid}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Shared By</p>
                      <p>{getUserName(findUserById(selectedRecord.originalOwnerId))}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date Shared</p>
                      <p>{new Date(selectedRecord.dateShared).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge 
                        variant={selectedRecord.status === 'Active' ? 'default' : 'secondary'}
                        className={selectedRecord.status === 'Revoked' ? 'bg-gray-200 text-gray-700' : ''}
                      >
                        {selectedRecord.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tags</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedRecord.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-secondary/20 rounded-md flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-muted-foreground">File preview would appear here</p>
                    <p className="text-xs text-muted-foreground">(In a real application, this would display the actual file)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
            {selectedRecord && (
              <Button 
                onClick={() => handleDownload(selectedRecord.id)}
                disabled={selectedRecord.status === 'Revoked'}
              >
                <Download className="mr-1 h-4 w-4" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientShared;
