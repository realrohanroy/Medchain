import axios from 'axios';
import { toast } from 'sonner';

// Set to false to use real IPFS with Pinata
const USE_MOCK = true;

// Real Pinata credentials
const PINATA_API_KEY = '060530e41cbe68a2f2b8';
const PINATA_SECRET_KEY = '0f1bcc52b19d97742780e5289ab19c84c0a38411fc7225683dff5e999a4b467e';
const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJlOTg0YjFkOC1hYjg2LTRmYzItOGI1MC02N2ZiYTkyOGE4ZWEiLCJlbWFpbCI6InZpcmFqdGVsaGFuZGU1N0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiMDYwNTMwZTQxY2JlNjhhMmYyYjgiLCJzY29wZWRLZXlTZWNyZXQiOiIwZjFiY2M1MmIxOWQ5Nzc0Mjc4MGU1Mjg5YWIxOWM4NGMwYTM4NDExZmM3MjI1NjgzZGZmNWU5OTlhNGI0NjdlIiwiZXhwIjoxNzc3MzI0NjM4fQ.1yilQi6REalkrXUFzWVWRY_4S9TsYX5o54D7x07Le68';

export interface IPFSUploadResult {
  cid: string;
  url: string;
  success: boolean;
}

export const uploadToIPFS = async (file: File): Promise<IPFSUploadResult> => {
  // For demo purposes, use mock implementation
  if (USE_MOCK) {
    return mockUploadToIPFS(file);
  }
  
  try {
    toast.info('Uploading to IPFS via Pinata...');
    
    // Create form data for Pinata
    const formData = new FormData();
    formData.append('file', file);
    
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        type: file.type,
        size: file.size.toString(),
        uploadDate: new Date().toISOString()
      }
    });
    formData.append('pinataMetadata', metadata);
    
    const options = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', options);
    
    // Upload to Pinata
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`,
          // Alternative authorization method if not using JWT
          // 'pinata_api_key': PINATA_API_KEY,
          // 'pinata_secret_api_key': PINATA_SECRET_KEY,
        }
      }
    );
    
    if (response.status !== 200) {
      throw new Error('Failed to upload to Pinata');
    }
    
    const cid = response.data.IpfsHash;
    const url = `https://gateway.pinata.cloud/ipfs/${cid}`;
    
    toast.success('File uploaded to IPFS successfully!');
    return {
      cid,
      url,
      success: true
    };
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    
    // More detailed error message
    let errorMessage = 'Failed to upload to IPFS';
    if (axios.isAxiosError(error)) {
      if (error.response) {
        errorMessage += `: ${error.response.status} - ${error.response.statusText}`;
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        errorMessage += ': No response received from server';
      } else {
        errorMessage += `: ${error.message}`;
      }
    } else if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    
    toast.error(errorMessage);
    
    return {
      cid: '',
      url: '',
      success: false
    };
  }
};

// For development/testing - returns a mock CID without actually uploading
export const mockUploadToIPFS = async (file: File): Promise<IPFSUploadResult> => {
  return new Promise((resolve) => {
    toast.info('Simulating IPFS upload...');
    
    // Simulate network delay
    setTimeout(() => {
      // Generate random CID
      const mockCid = 'Qm' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const url = `https://gateway.pinata.cloud/ipfs/${mockCid}`;
      
      toast.success('Mock file uploaded to IPFS successfully!');
      resolve({
        cid: mockCid,
        url,
        success: true
      });
    }, 1500);
  });
};

export const validateFileForIPFS = (file: File): boolean => {
  // Validate file type - allow PDFs and images only
  const allowedTypes = [
    'application/pdf', 
    'image/jpeg', 
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    toast.error(`Invalid file type. Allowed types: PDF, JPEG, PNG, DOC, DOCX`);
    return false;
  }
  
  // Validate file size - limit to 10MB for demo purposes
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    toast.error(`File size too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
    return false;
  }
  
  return true;
};
