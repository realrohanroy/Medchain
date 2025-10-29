
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/contexts/Web3Context';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface WalletConnectProps {
  onConnect?: () => void;
  className?: string;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect, className }) => {
  const { account, connectWallet, signMessage, connecting } = useWeb3();
  const { loginWithWallet } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  const handleConnect = async () => {
    if (account) {
      // Already connected, need to authenticate
      handleAuthenticate();
    } else {
      // Need to connect first
      await connectWallet();
      if (onConnect) {
        onConnect();
      }
    }
  };
  
  const handleAuthenticate = async () => {
    if (!account) {
      toast.error('Wallet not connected');
      return;
    }
    
    setIsAuthenticating(true);
    try {
      // Create a message to sign - in a real app this would include a nonce from the server
      const message = `Sign this message to authenticate with MedChain.\nWallet: ${account}\nTimestamp: ${Date.now()}`;
      
      // Request user to sign the message
      const signature = await signMessage(message);
      
      if (!signature) {
        throw new Error('Failed to sign message');
      }
      
      // Authenticate with the signature
      const success = await loginWithWallet(account, signature);
      
      if (success) {
        toast.success('Authentication successful!');
      } else {
        toast.error('Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  return (
    <Button
      variant="outline"
      onClick={handleConnect}
      disabled={connecting || isAuthenticating}
      className={className}
    >
      {connecting || isAuthenticating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {connecting ? 'Connecting...' : 'Authenticating...'}
        </>
      ) : (
        <>
          <Wallet className="mr-2 h-4 w-4" />
          {account ? 'Authenticate Wallet' : 'Connect Wallet'}
        </>
      )}
    </Button>
  );
};

export default WalletConnect;
