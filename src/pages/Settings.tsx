import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  LogOut,
  Settings as SettingsIcon,
  Smartphone,
  Globe,
  Key
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/custom-badge';

const Settings: React.FC = () => {
  const { logout, user } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <SettingsIcon className="h-6 w-6" />
        Settings
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Appearance</CardTitle>
            <CardDescription>Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">Toggle between light and dark mode</p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  className="h-24 border-2"
                  onClick={() => setTheme('light')}
                >
                  <div className="w-full space-y-2">
                    <Sun className="mx-auto h-5 w-5" />
                    <p>Light Mode</p>
                  </div>
                </Button>
                
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  className="h-24 border-2"
                  onClick={() => setTheme('dark')}
                >
                  <div className="w-full space-y-2">
                    <Moon className="mx-auto h-5 w-5" />
                    <p>Dark Mode</p>
                  </div>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notifications</CardTitle>
            <CardDescription>Configure how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Get notified about important updates</p>
                  </div>
                </div>
                <Switch id="email-notifications" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Record Access</p>
                    <p className="text-sm text-muted-foreground">Get notified when your records are accessed</p>
                  </div>
                </div>
                <Switch id="record-access" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Appointment Reminders</p>
                    <p className="text-sm text-muted-foreground">Get notified before your appointments</p>
                  </div>
                </div>
                <Switch id="appointment-reminders" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">App Notifications</p>
                    <p className="text-sm text-muted-foreground">Enable in-app notifications</p>
                  </div>
                </div>
                <Switch id="app-notifications" defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Security</CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Change Password</p>
                    <p className="text-sm text-muted-foreground">Update your account password</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.info('Change password feature would be implemented here')}>
                  Change
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.info('Two-factor authentication feature would be implemented here')}>
                  Setup
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Device Management</p>
                    <p className="text-sm text-muted-foreground">Manage devices that can access your account</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.info('Device management feature would be implemented here')}>
                  Manage
                </Button>
              </div>
            </div>
            
            <div className="border-t mt-6 pt-6">
              <Label className="font-medium mb-2">Login Sessions</Label>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                  <div>
                    <p className="font-medium">Current Session</p>
                    <p className="text-xs text-muted-foreground">Web Browser • {new Date().toLocaleString()}</p>
                  </div>
                  <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-900">
                    Active
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Language</p>
                    <p className="text-sm text-muted-foreground">Select your preferred language</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => toast.info('Language settings would be implemented here')}
                >
                  English (US)
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Logout</p>
                    <p className="text-sm text-muted-foreground">Sign out of your account</p>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            </div>
            
            <div className="border-t mt-6 pt-6">
              <h3 className="font-medium mb-2">Connected Accounts</h3>
              <div className="space-y-3">
                {user && (
                  <div className="p-3 border rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Blockchain Wallet</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {user.wallet_address ? 
                            `${user.wallet_address.slice(0, 8)}...${user.wallet_address.slice(-6)}` : 
                            'No wallet connected'}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toast.info('Wallet management feature would be implemented here')}
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
