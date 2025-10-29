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
  Building, 
  Award, 
  Clock,
  Save, 
  Edit,
  Wallet,
  Briefcase
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { getDoctorPatients } from '@/lib/mockData';

const DoctorProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+1 (555) 987-6543',
    address: '456 Medical Center Blvd, Anytown, USA',
    specialty: 'Cardiology',
    licenseNumber: 'MD12345678',
    hospitalAffiliation: 'Anytown General Hospital',
    bio: 'Board certified cardiologist with over 10 years of experience in treating complex cardiac conditions.',
    education: 'University of Medical Sciences, MD (2010)',
    availableHours: 'Monday-Friday: 9:00 AM - 5:00 PM',
    wallet_address: user?.wallet_address || ''
  });
  
  const initials = profileData.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
  
  if (!user) return null;
  
  const patientCount = getDoctorPatients(user.id).length;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSave = () => {
    // In a real app, this would call an API to update the profile
    toast.success('Profile updated successfully');
    setIsEditing(false);
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Doctor Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Profile</CardTitle>
              <CardDescription>Your professional information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-4 space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              
              <div className="text-center">
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{profileData.specialty}</p>
                <div className="mt-1 flex justify-center">
                  <Badge variant="secondary">{user.role}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Licensed since 2010</p>
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
              <CardTitle className="text-lg">Stats</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Patients</p>
                  <p className="text-2xl font-bold">{patientCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Records</p>
                  <p className="text-2xl font-bold">187</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Years Active</p>
                  <p className="text-2xl font-bold">15</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Approvals</p>
                  <p className="text-2xl font-bold">42</p>
                </div>
              </div>
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
                  <Award className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">License: {profileData.licenseNumber}</span>
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
          <Tabs defaultValue="professional">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="professional">Professional</TabsTrigger>
              <TabsTrigger value="practice">Practice</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="professional" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Professional Information</CardTitle>
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
                        <Label htmlFor="specialty" className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                          Specialty
                        </Label>
                        <Input 
                          id="specialty"
                          name="specialty"
                          value={profileData.specialty}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-100" : ""}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="licenseNumber" className="flex items-center">
                          <Award className="h-4 w-4 mr-2 text-muted-foreground" />
                          License Number
                        </Label>
                        <Input 
                          id="licenseNumber"
                          name="licenseNumber"
                          value={profileData.licenseNumber}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-100" : ""}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="education">Education & Certifications</Label>
                      <Input 
                        id="education"
                        name="education"
                        value={profileData.education}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={!isEditing ? "bg-gray-100" : ""}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Professional Summary</Label>
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
            </TabsContent>
            
            <TabsContent value="practice" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Practice Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="hospitalAffiliation" className="flex items-center">
                          <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                          Hospital Affiliation
                        </Label>
                        <Input 
                          id="hospitalAffiliation"
                          name="hospitalAffiliation"
                          value={profileData.hospitalAffiliation}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-100" : ""}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          Office Phone
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
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address" className="flex items-center">
                        <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                        Office Address
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
                      <Label htmlFor="availableHours" className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        Available Hours
                      </Label>
                      <Input 
                        id="availableHours"
                        name="availableHours"
                        value={profileData.availableHours}
                        onChange={handleChange}
                        disabled={!isEditing}
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
                  <CardTitle className="text-lg">Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">Jane Doe, RN</p>
                          <p className="text-sm text-muted-foreground">Nurse</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>JS</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">John Smith</p>
                          <p className="text-sm text-muted-foreground">Receptionist</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                    
                    <Button variant="outline" className="w-full" onClick={() => toast.info('Team management feature would be shown here')}>
                      Manage Team
                    </Button>
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
                        <p className="font-medium">New Access Requests</p>
                        <p className="text-sm text-muted-foreground">Notify when a patient requests access</p>
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
                        <p className="font-medium">Appointment Notifications</p>
                        <p className="text-sm text-muted-foreground">Notify about new and changed appointments</p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="appointment-notifications"
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
                        <p className="font-medium">Login History</p>
                        <p className="text-sm text-muted-foreground">View recent login activity</p>
                      </div>
                      <div className="flex items-center">
                        <Button variant="outline" onClick={() => toast.info('Login history would be shown here')}>
                          View
                        </Button>
                      </div>
                    </li>
                    <li className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Advanced Security</p>
                        <p className="text-sm text-muted-foreground">Configure IP restrictions and session timeouts</p>
                      </div>
                      <div className="flex items-center">
                        <Button variant="outline" onClick={() => toast.info('Advanced security settings would be shown here')}>
                          Configure
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

export default DoctorProfile;
