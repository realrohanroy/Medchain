import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  User, 
  Mail, 
  Phone, 
  Home, 
  Calendar, 
  Save, 
  Edit,
  Wallet,
  Upload
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileUpload from '@/components/FileUpload';

const PatientProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, Anytown, USA',
    dob: '1985-06-15',
    bloodType: 'A+',
    allergies: 'None',
    emergencyContact: 'Jane Doe (+1 555-789-0123)',
    bio: 'I am a patient looking to securely manage my medical records.',
    wallet_address: user?.wallet_address || ''
  });
  
  const initials = profileData.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
  
  if (!user) return null;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSave = () => {
    // In a real app, this would call an API to update the profile
    toast.success('Profile updated successfully');
    setIsEditing(false);
  };

  const handleFileUpload = (file: File) => {
    toast.success(`Profile document uploaded: ${file.name}`);
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Profile</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-4 space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              
              <div className="text-center">
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-xs font-mono text-muted-foreground mt-1 break-all px-4">{user.wallet_address ? 
                  `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}` : 
                  'No wallet connected'}</p>
                <p className="text-xs text-muted-foreground mt-2">Member since 2025</p>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Cancel Editing
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Role: {user.role}</span>
                </div>
                <div className="flex items-center">
                  <Wallet className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm truncate">
                    Wallet: {user.wallet_address ? 
                      `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}` : 
                      'No wallet connected'}
                  </span>
                </div>
              </div>
              
              <div className="mt-6">
                <Button variant="secondary" className="w-full" onClick={() => toast.success('Password reset email sent')}>
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Tabs defaultValue="personal">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="medical">Medical</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          Full Name
                        </Label>
                        <Input 
                          id="name"
                          name="name"
                          value={profileData.name}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-100" : ""}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          Email
                        </Label>
                        <Input 
                          id="email"
                          name="email"
                          value={profileData.email}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-100" : ""}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          Phone Number
                        </Label>
                        <Input 
                          id="phone"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-100" : ""}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="dob" className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          Date of Birth
                        </Label>
                        <Input 
                          id="dob"
                          name="dob"
                          type="date"
                          value={profileData.dob}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-100" : ""}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address" className="flex items-center">
                        <Home className="h-4 w-4 mr-2 text-muted-foreground" />
                        Address
                      </Label>
                      <Input 
                        id="address"
                        name="address"
                        value={profileData.address}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={!isEditing ? "bg-gray-100" : ""}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">About Me</Label>
                      <Textarea 
                        id="bio"
                        name="bio"
                        value={profileData.bio}
                        onChange={handleChange}
                        disabled={!isEditing}
                        rows={4}
                        className={!isEditing ? "bg-gray-100" : ""}
                      />
                    </div>
                    
                    {isEditing && (
                      <div className="pt-4">
                        <Button onClick={handleSave}>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Upload Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload onFileUpload={handleFileUpload} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="medical" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Medical Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bloodType">Blood Type</Label>
                        <Input 
                          id="bloodType"
                          name="bloodType"
                          value={profileData.bloodType}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContact">Emergency Contact</Label>
                        <Input 
                          id="emergencyContact"
                          name="emergencyContact"
                          value={profileData.emergencyContact}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="allergies">Allergies</Label>
                      <Textarea 
                        id="allergies"
                        name="allergies"
                        value={profileData.allergies}
                        onChange={handleChange}
                        disabled={!isEditing}
                        rows={3}
                      />
                    </div>
                    
                    {isEditing && (
                      <div className="pt-4">
                        <Button onClick={handleSave}>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </Button>
                      </div>
                    )}
                    
                    <div className="pt-4">
                      <Label>Medical Records</Label>
                      <div className="mt-2">
                        <FileUpload 
                          onFileUpload={file => toast.success(`Medical record uploaded: ${file.name}`)} 
                          allowedTypes={['application/pdf', 'image/jpeg', 'image/png', 'application/msword']}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notification Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    <li className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive email updates about your account</p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="email-notifications"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          defaultChecked
                        />
                      </div>
                    </li>
                    <li className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Access Requests</p>
                        <p className="text-sm text-muted-foreground">Notify when someone requests access to your records</p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="access-requests"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          defaultChecked
                        />
                      </div>
                    </li>
                    <li className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Record Views</p>
                        <p className="text-sm text-muted-foreground">Notify when someone views your medical records</p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="record-views"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          defaultChecked
                        />
                      </div>
                    </li>
                  </ul>
                  
                  <div className="mt-6">
                    <Button onClick={() => toast.success('Settings saved')}>Save Settings</Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Security Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    <li className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                      </div>
                      <div className="flex items-center">
                        <Button variant="outline" onClick={() => toast.info('Two-factor authentication settings would be shown here')}>
                          Set Up
                        </Button>
                      </div>
                    </li>
                    <li className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Connected Devices</p>
                        <p className="text-sm text-muted-foreground">Manage devices that have access to your account</p>
                      </div>
                      <div className="flex items-center">
                        <Button variant="outline" onClick={() => toast.info('Connected devices would be shown here')}>
                          View
                        </Button>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
