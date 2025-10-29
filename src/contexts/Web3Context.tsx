import React, { createContext, useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  connecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signMessage: (message: string) => Promise<string | null>;
}

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  account: null,
  chainId: null,
  connecting: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  signMessage: async () => null,
});

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const { logout } = useAuth();

  // Initialize provider if window.ethereum is available
  useEffect(() => {
    const initializeWeb3 = async () => {
      try {
        if (typeof window !== 'undefined' && window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(provider);

          // Check if already connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const signer = await provider.getSigner();
            setAccount(accounts[0]);
            setSigner(signer);
            
            const network = await provider.getNetwork();
            setChainId(Number(network.chainId));
            
            toast.success('Wallet connected');
          }
        } else {
          console.log('MetaMask not installed - Web3 features will be limited');
        }
      } catch (error) {
        console.error('Error initializing Web3:', error);
      }
    };
    
    initializeWeb3();
  }, []);

  // Event listeners for wallet state changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          setAccount(null);
          setSigner(null);
          logout();
          toast.info('Wallet disconnected');
        } else if (accounts[0] !== account) {
          // User switched account
          setAccount(accounts[0]);
          toast.info('Account changed');
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        
        // Force refresh on chain change
        toast.info('Network changed, refreshing...');
        window.location.reload();
      };

      const handleDisconnect = (error: { code: number; message: string }) => {
        console.error('Wallet disconnected:', error);
        setAccount(null);
        setSigner(null);
        logout();
        toast.error('Wallet disconnected');
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      };
    }
  }, [account, logout]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not installed. Please install MetaMask to continue.');
      return;
    }

    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        setProvider(provider);
        setSigner(signer);
        setAccount(accounts[0]);
        
        const network = await provider.getNetwork();
        setChainId(Number(network.chainId));
        
        toast.success('Wallet connected successfully!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    logout();
    toast.info('Wallet disconnected');
  };

  const signMessage = async (message: string): Promise<string | null> => {
    if (!signer) {
      toast.error('Wallet not connected');
      return null;
    }
    
    try {
      const signature = await signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      toast.error('Failed to sign message');
      return null;
    }
  };

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        account,
        chainId,
        connecting,
        connectWallet,
        disconnectWallet,
        signMessage,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);

export default Web3Context;
