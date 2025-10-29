import { ethers } from 'ethers';
import { toast } from 'sonner';
import MedicalRecordsABI from '../contracts/MedicalRecords.json';

// Set to false to enable real blockchain functionality
const USE_MOCK = true; // Using mock implementation until Ganache is properly configured

// Contract configuration
// Updated to use local Ganache
const CONTRACT_ADDRESS = '0xBda5b9794f10d42e20298cA37c927d6140EbeC1b'; // You'll deploy your contract to Ganache

// Using local Ganache
const DEFAULT_NETWORK_ID = '1337'; // Default Ganache network ID
const RPC_URL = 'http://127.0.0.1:7545'; // Updated more reliable Ganache RPC URL
const FALLBACK_RPC_URL = 'http://localhost:7545'; // Fallback URL

export interface MedicalRecord {
  cid: string;
  fileName: string;
  timestamp: number;
  tags: string[];
  authorizedDoctors: string[];
}

// Check if MetaMask is installed
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

// Get a provider - either from MetaMask or fallback to RPC URL
export const getProvider = async (): Promise<ethers.BrowserProvider | ethers.JsonRpcProvider> => {
  if (isMetaMaskInstalled()) {
    try {
      // First try to use MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      return provider;
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      // Fallback to RPC
      try {
        // Try main RPC URL first
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        // Test the connection
        await provider.getBlockNumber();
        return provider;
      } catch (error) {
        console.error('Error connecting to primary RPC:', error);
        // Try fallback RPC URL
        try {
          console.log('Attempting fallback RPC connection...');
          const fallbackProvider = new ethers.JsonRpcProvider(FALLBACK_RPC_URL);
          await fallbackProvider.getBlockNumber();
          return fallbackProvider;
        } catch (fallbackError) {
          console.error('Error connecting to fallback RPC:', fallbackError);
          toast.error('Could not connect to local blockchain. Is Ganache running?');
          throw new Error('Failed to connect to any RPC endpoint');
        }
      }
    }
  } else {
    // Use RPC provider directly without MetaMask
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      await provider.getBlockNumber(); // Test connection
      return provider;
    } catch (error) {
      // Try fallback URL
      try {
        console.log('Attempting fallback RPC connection...');
        const fallbackProvider = new ethers.JsonRpcProvider(FALLBACK_RPC_URL);
        await fallbackProvider.getBlockNumber();
        return fallbackProvider;
      } catch (fallbackError) {
        console.error('All RPC connections failed:', fallbackError);
        toast.error('Could not connect to local blockchain. Is Ganache running?');
        throw new Error('Failed to connect to any RPC endpoint');
      }
    }
  }
};

// Get the medical records contract
export const getMedicalRecordsContract = (
  providerOrSigner: ethers.BrowserProvider | ethers.JsonRpcProvider | ethers.JsonRpcSigner
) => {
  return new ethers.Contract(
    CONTRACT_ADDRESS,
    MedicalRecordsABI.abi,
    providerOrSigner
  );
};

// Check if the user is on the correct network
export const checkAndSwitchNetwork = async (): Promise<boolean> => {
  if (!isMetaMaskInstalled()) return false;
  
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId !== `0x${parseInt(DEFAULT_NETWORK_ID).toString(16)}`) {
      try {
        // Try to switch to Ganache network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${parseInt(DEFAULT_NETWORK_ID).toString(16)}` }],
        });
        return true;
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            // Add Ganache network to MetaMask
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${parseInt(DEFAULT_NETWORK_ID).toString(16)}`,
                  chainName: 'Ganache Local',
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: [RPC_URL]
                }
              ]
            });
            
            // After adding, try to switch again
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${parseInt(DEFAULT_NETWORK_ID).toString(16)}` }],
            });
            
            return true;
          } catch (addError) {
            console.error('Error adding Ganache network:', addError);
            toast.error('Failed to add Ganache network to your wallet');
            return false;
          }
        } else {
          toast.error('Failed to switch network');
        }
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};

// Add a medical record to the blockchain
export const addMedicalRecord = async (
  signer: ethers.JsonRpcSigner,
  cid: string,
  fileName: string,
  tags: string[]
): Promise<string | null> => {
  // For demo purposes, use mock implementation
  if (USE_MOCK) {
    return mockAddMedicalRecord(cid, fileName, tags);
  }
  
  try {
    // Check network first
    const networkCorrect = await checkAndSwitchNetwork();
    if (!networkCorrect) {
      toast.error('Please connect to the Ganache network');
      return null;
    }
    
    const contract = getMedicalRecordsContract(signer);
    
    toast.info('Adding medical record to blockchain...');
    
    // Gas estimation
    const gasEstimate = await contract.addRecord.estimateGas(cid, fileName, tags);
    
    // Add 20% buffer to the gas estimate
    const gasLimit = Math.ceil(Number(gasEstimate) * 1.2);
    
    const tx = await contract.addRecord(cid, fileName, tags, {
      gasLimit
    });
    
    toast.info(`Transaction submitted: ${tx.hash}`);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    if (receipt.status === 0) {
      throw new Error('Transaction failed');
    }
    
    toast.success('Medical record added successfully!');
    
    return tx.hash;
  } catch (error: any) {
    console.error('Error adding medical record:', error);
    
    let errorMessage = 'Failed to add medical record';
    
    if (error?.message) {
      if (error.message.includes('user rejected transaction')) {
        errorMessage = 'Transaction was rejected';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction';
      } else {
        errorMessage += `: ${error.message}`;
      }
    }
    
    toast.error(errorMessage);
    return null;
  }
};

// For development/testing - returns a mock transaction hash without blockchain interaction
export const mockAddMedicalRecord = async (
  cid: string,
  fileName: string,
  tags: string[]
): Promise<string> => {
  return new Promise((resolve) => {
    toast.info('Simulating blockchain transaction...');
    
    // Simulate network delay
    setTimeout(() => {
      // Generate a random transaction hash
      const mockTxHash = '0x' + Array.from({ length: 64 }).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      
      toast.success('Mock record added to blockchain!');
      resolve(mockTxHash);
    }, 2000);
  });
};

export const verifyDoctor = async (
  signer: ethers.JsonRpcSigner,
  doctorAddress: string
): Promise<string | null> => {
  try {
    const networkCorrect = await checkAndSwitchNetwork();
    if (!networkCorrect) {
      toast.error('Please connect to the correct network');
      return null;
    }
    
    const contract = getMedicalRecordsContract(signer);
    
    toast.info('Verifying doctor on blockchain...');
    
    const tx = await contract.verifyDoctor(doctorAddress);
    
    toast.info(`Transaction submitted: ${tx.hash}`);
    
    const receipt = await tx.wait();
    
    if (receipt.status === 0) {
      throw new Error('Transaction failed');
    }
    
    toast.success('Doctor verified successfully!');
    
    return tx.hash;
  } catch (error: any) {
    console.error('Error verifying doctor:', error);
    
    let errorMessage = 'Failed to verify doctor';
    if (error?.message) {
      errorMessage += `: ${error.message}`;
    }
    
    toast.error(errorMessage);
    return null;
  }
};

export const isDoctorVerified = async (
  provider: ethers.BrowserProvider,
  doctorAddress: string
): Promise<boolean> => {
  try {
    const contract = getMedicalRecordsContract(provider);
    return await contract.verifiedDoctors(doctorAddress);
  } catch (error) {
    console.error('Error checking doctor verification:', error);
    return false;
  }
};

export const grantAccessToRecord = async (
  signer: ethers.JsonRpcSigner,
  cid: string,
  doctorAddress: string
): Promise<string | null> => {
  try {
    const contract = getMedicalRecordsContract(signer);
    
    toast.info('Granting access to record...');
    
    const tx = await contract.grantAccess(cid, doctorAddress);
    
    toast.info(`Transaction submitted: ${tx.hash}`);
    
    await tx.wait();
    
    toast.success('Access granted successfully!');
    
    return tx.hash;
  } catch (error) {
    console.error('Error granting access:', error);
    toast.error('Failed to grant access');
    return null;
  }
};

export const revokeAccessToRecord = async (
  signer: ethers.JsonRpcSigner,
  cid: string,
  doctorAddress: string
): Promise<string | null> => {
  try {
    const contract = getMedicalRecordsContract(signer);
    
    toast.info('Revoking access to record...');
    
    const tx = await contract.revokeAccess(cid, doctorAddress);
    
    toast.info(`Transaction submitted: ${tx.hash}`);
    
    await tx.wait();
    
    toast.success('Access revoked successfully!');
    
    return tx.hash;
  } catch (error) {
    console.error('Error revoking access:', error);
    toast.error('Failed to revoke access');
    return null;
  }
};

export const getPatientRecords = async (
  provider: ethers.BrowserProvider,
  patientAddress: string
): Promise<MedicalRecord[]> => {
  try {
    const contract = getMedicalRecordsContract(provider);
    
    const records = await contract.getPatientRecords(patientAddress);
    
    return records.map((record: any) => ({
      cid: record.cid,
      fileName: record.fileName,
      timestamp: Number(record.timestamp),
      tags: record.tags,
      authorizedDoctors: record.authorizedDoctors
    }));
  } catch (error) {
    console.error('Error getting patient records:', error);
    toast.error('Failed to get patient records');
    return [];
  }
};
