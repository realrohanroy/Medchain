import React, { useState, useCallback } from 'react';
import { Upload, Check, X, Loader2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { uploadToIPFS, mockUploadToIPFS } from '@/services/ipfsService';
import { addMedicalRecord, connectWallet } from '@/services/web3Service';

interface FileUploadProps {
  onFileUpload?: (file: File, cid: string) => void;
  allowedTypes?: string[];
  maxSizeMB?: number;
  tags?: string[];
  testMode?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'],
  maxSizeMB = 5,
  tags = ['medical', 'record'],
  testMode = false
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);
  
  const validateFile = useCallback((file: File) => {
    if (!allowedTypes.includes(file.type)) {
      toast.error(`File type not supported. Please upload: ${allowedTypes.join(', ')}`);
      return false;
    }
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Max size: ${maxSizeMB}MB`);
      return false;
    }
    
    return true;
  }, [allowedTypes, maxSizeMB]);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  }, [validateFile]);
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  }, [validateFile]);
  
  const handleConnectWallet = useCallback(async () => {
    const account = await connectWallet();
    if (account) {
      setWalletConnected(true);
    }
  }, []);
  
  const handleUpload = useCallback(async () => {
    if (!file) return;
    
    // Check if wallet is connected
    if (!testMode && !walletConnected) {
      toast.warning('Please connect your wallet to upload files');
      try {
        await handleConnectWallet();
        // After connecting, we don't proceed with upload yet
        // User needs to click upload again after wallet connection
        return;
      } catch (error) {
        toast.error('Failed to connect wallet. Please try again.');
        return;
      }
    }
    
    setUploading(true);
    setUploadProgress(10);
    
    try {
      let txHash;
      let cid;
      
      // Step 1: Upload to IPFS
      setUploadProgress(20);
      const result = await uploadToIPFS(file);
      setUploadProgress(50);
      
      if (!result.success) {
        throw new Error('Failed to upload to IPFS');
      }
      
      cid = result.cid;
      
      // Step 2: Add record to blockchain
      setUploadProgress(70);
      txHash = await addMedicalRecord(result.cid, file.name, tags);
      setUploadProgress(90);
      
      if (!txHash) {
        throw new Error('Failed to add record to blockchain');
      }
      
      setTransactionHash(txHash);
      setUploadProgress(100);
      
      // Callback
      if (onFileUpload) {
        onFileUpload(file, cid);
      }
      
      toast.success('File uploaded and record added to blockchain!');
      
      // Reset after successful upload
      setTimeout(() => {
        setFile(null);
        setTransactionHash(null);
        setUploading(false);
        setUploadProgress(0);
      }, 3000);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to complete upload process: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Reset states immediately on error
      setUploading(false);
      setUploadProgress(0);
      setFile(null);
      setTransactionHash(null);
    }
  }, [file, walletConnected, tags, onFileUpload, handleConnectWallet, testMode]);
  
  const handleCancel = useCallback(() => {
    setFile(null);
    setTransactionHash(null);
  }, []);
  
  // Function to manually trigger file input click
  const triggerFileInput = useCallback(() => {
    document.getElementById('file-upload-input')?.click();
  }, []);
  
  return (
    <div className="w-full">
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors ${
            dragging 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 dark:border-gray-700'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-1 sm:space-y-2">
            <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mb-1 sm:mb-2" />
            <h3 className="font-medium text-sm sm:text-base">Drag and drop file here</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              or browse from your computer
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max file size: {maxSizeMB}MB
            </p>
            <p className="text-xs text-muted-foreground">
              Accepted formats: {allowedTypes.map(type => type.split('/')[1]).join(', ')}
            </p>
          </div>
          
          <div className="mt-3 sm:mt-4">
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept={allowedTypes.join(',')}
              id="file-upload-input"
            />
            <Button 
              type="button" 
              variant="outline" 
              className="w-full sm:w-auto text-sm"
              onClick={triggerFileInput}
            >
              <Upload className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Browse Files
            </Button>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm sm:text-base truncate max-w-[150px] sm:max-w-[250px] md:max-w-[350px]">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>
                {!uploading && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleCancel}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                )}
              </div>
              
              {uploading && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5 dark:bg-gray-700">
                    <div 
                      className="bg-primary h-2 sm:h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {uploadProgress < 30 ? 'Preparing file...' : 
                     uploadProgress < 60 ? 'Uploading to IPFS...' : 
                     uploadProgress < 90 ? 'Adding to Blockchain...' : 
                     'Finalizing...'}
                  </p>
                </div>
              )}
              
              {transactionHash && (
                <div className="p-2 bg-primary/10 rounded-md">
                  <p className="text-xs font-mono break-all">
                    <span className="font-medium">Transaction: </span>
                    <span className="text-primary">
                      {transactionHash}
                    </span>
                  </p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                {!testMode && !walletConnected && !uploading && (
                  <Button 
                    onClick={handleConnectWallet}
                    variant="outline"
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <Wallet className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Connect Wallet
                  </Button>
                )}
                <Button 
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Upload to Blockchain
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUpload;
