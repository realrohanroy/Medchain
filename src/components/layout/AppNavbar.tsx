
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { Bell, Wallet, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { notifications } from '@/lib/mockData';

const AppNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { account, connectWallet, disconnectWallet } = useWeb3();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!user) return null;

  const displayName = user.name || (user as any).full_name || user.email || 'User';
  const userInitials = displayName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('') || 'U';

  const userNotifications = notifications.filter(n => n.userId === user.id);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    disconnectWallet();
  };
  
  const truncateAddress = (address: string) => {
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <span className="text-blue-600 text-xl font-bold">MedChain</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            {account && (
              <div className="mr-4 flex items-center px-3 py-2 rounded-md bg-primary/10">
                <Wallet className="h-4 w-4 mr-2 text-primary" />
                <span className="text-xs font-mono">{truncateAddress(account)}</span>
              </div>
            )}
            
            {!account && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mr-4"
                onClick={connectWallet}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            )}
          
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <h3 className="font-medium text-sm px-2 py-2 border-b">Notifications</h3>
                <div className="max-h-64 overflow-y-auto">
                  {userNotifications.length > 0 ? (
                    userNotifications.map((notification) => (
                      <DropdownMenuItem key={notification.id} className="cursor-pointer p-3 border-b">
                        <div className={`${notification.read ? 'opacity-70' : 'font-medium'}`}>
                          <p className="text-sm">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="py-4 text-center text-sm text-gray-500">
                      No notifications
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="ml-3 relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center">
                    <span className="mr-2 text-sm hidden sm:inline-block">{displayName}</span>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Link to="/profile" className="w-full">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/settings" className="w-full">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AppNavbar;
