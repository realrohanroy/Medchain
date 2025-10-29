import Web3 from 'web3';
import { toast } from 'sonner';
import MedicalRecordsABI from '../contracts/MedicalRecords.json';

// Configuration
const CONTRACT_ADDRESS = '0xBda5b9794f10d42e20298cA37c927d6140EbeC1b';
const USE_MOCK = true; // Set to false when you want to use actual blockchain

// Free public testnet RPC URLs
const RPC_URLS = [
  'https://rpc-mumbai.maticvigil.com', // Polygon Mumbai
  'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // Sepolia (public key)
  'https://eth-goerli.public.blastapi.io' // Goerli
];

// Simple helper to get web3 instance
const getWeb3 = async () => {
  // Check if MetaMask is available
  if (window.ethereum) {
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      return new Web3(window.ethereum);
    } catch (error) {
      console.error("User denied account access:", error);
      throw new Error("Please allow MetaMask access to continue");
    }
  }
  // If no injected web3 instance is detected, fall back to a public provider
  else {
    // Try each RPC URL until one works
    for (const rpcUrl of RPC_URLS) {
      try {
        const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
        // Test the connection
        await web3.eth.getBlockNumber();
        console.log(`Connected to ${rpcUrl}`);
        return web3;
      } catch (error) {
        console.warn(`Failed to connect to ${rpcUrl}`);
      }
    }
    throw new Error("Failed to connect to any blockchain provider");
  }
};

// Simple contract interface
const getContract = async () => {
  const web3 = await getWeb3();
  return new web3.eth.Contract(MedicalRecordsABI.abi as any, CONTRACT_ADDRESS);
};

// Mock implementation for addMedicalRecord
const mockAddMedicalRecord = async (cid: string, fileName: string, tags: string[]) => {
  return new Promise<string>((resolve) => {
    toast.info('Simulating blockchain transaction...');
    
    // Simulate network delay
    setTimeout(() => {
      const mockTxHash = '0x' + Array.from({ length: 64 }).map(() => 
        Math.floor(Math.random() * 16).toString(16)).join('');
      
      toast.success('Record added to blockchain (mock)');
      resolve(mockTxHash);
    }, 2000);
  });
};

// Add a medical record
export const addMedicalRecord = async (
  cid: string, 
  fileName: string, 
  tags: string[]
): Promise<string | null> => {
  if (USE_MOCK) {
    return mockAddMedicalRecord(cid, fileName, tags);
  }

  try {
    toast.info('Adding record to blockchain...');
    
    const web3 = await getWeb3();
    const contract = await getContract();
    const accounts = await web3.eth.getAccounts();
    
    if (!accounts || accounts.length === 0) {
      toast.error('No accounts found. Please connect your wallet');
      return null;
    }
    
    // Call the contract function
    const result = await contract.methods.addRecord(cid, fileName, tags)
      .send({ from: accounts[0] });
    
    toast.success('Record added to blockchain!');
    return result.transactionHash;
  } catch (error: any) {
    console.error('Error adding record:', error);
    toast.error(`Failed to add record: ${error.message}`);
    return null;
  }
};

// Grant access to a record
export const grantAccessToRecord = async (
  cid: string,
  doctorAddress: string
): Promise<string | null> => {
  if (USE_MOCK) {
    return mockAddMedicalRecord(cid, "Grant Access", []);
  }

  try {
    toast.info('Granting access to record...');
    
    const web3 = await getWeb3();
    const contract = await getContract();
    const accounts = await web3.eth.getAccounts();
    
    if (!accounts || accounts.length === 0) {
      toast.error('No accounts found. Please connect your wallet');
      return null;
    }
    
    const result = await contract.methods.grantAccess(cid, doctorAddress)
      .send({ from: accounts[0] });
    
    toast.success('Access granted successfully!');
    return result.transactionHash;
  } catch (error: any) {
    console.error('Error granting access:', error);
    toast.error(`Failed to grant access: ${error.message}`);
    return null;
  }
};

// Revoke access to a record
export const revokeAccessToRecord = async (
  cid: string,
  doctorAddress: string
): Promise<string | null> => {
  if (USE_MOCK) {
    return mockAddMedicalRecord(cid, "Revoke Access", []);
  }

  try {
    toast.info('Revoking access to record...');
    
    const web3 = await getWeb3();
    const contract = await getContract();
    const accounts = await web3.eth.getAccounts();
    
    if (!accounts || accounts.length === 0) {
      toast.error('No accounts found. Please connect your wallet');
      return null;
    }
    
    const result = await contract.methods.revokeAccess(cid, doctorAddress)
      .send({ from: accounts[0] });
    
    toast.success('Access revoked successfully!');
    return result.transactionHash;
  } catch (error: any) {
    console.error('Error revoking access:', error);
    toast.error(`Failed to revoke access: ${error.message}`);
    return null;
  }
};

// Simple function to check wallet connection
export const connectWallet = async (): Promise<string | null> => {
  try {
    if (!window.ethereum) {
      toast.error('MetaMask not found. Please install MetaMask');
      return null;
    }
    
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    
    if (accounts && accounts.length > 0) {
      toast.success('Wallet connected!');
      return accounts[0];
    }
    
    return null;
  } catch (error: any) {
    console.error('Error connecting wallet:', error);
    toast.error(`Failed to connect wallet: ${error.message}`);
    return null;
  }
}; 