
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBar,
  RadialBarChart
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartPie, BarChart3, LineChart as LineChartIcon, Activity, Download, Calendar, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Mock data for charts
const ageGroupData = [
  { name: '<18', count: 4, color: '#4ade80' },
  { name: '18-35', count: 12, color: '#22d3ee' },
  { name: '36-55', count: 18, color: '#818cf8' },
  { name: '56+', count: 8, color: '#fb7185' },
];

const diseaseData = [
  { name: 'Hypertension', count: 15, color: '#f87171' },
  { name: 'Diabetes', count: 10, color: '#fb923c' },
  { name: 'Asthma', count: 8, color: '#4ade80' },
  { name: 'Heart Disease', count: 6, color: '#c084fc' },
  { name: 'Arthritis', count: 5, color: '#60a5fa' },
];

const patientGrowthData = [
  { name: 'Jan', patients: 30 },
  { name: 'Feb', patients: 35 },
  { name: 'Mar', patients: 40 },
  { name: 'Apr', patients: 43 },
  { name: 'May', patients: 45 },
  { name: 'Jun', patients: 50 },
  { name: 'Jul', patients: 52 },
  { name: 'Aug', patients: 56 },
  { name: 'Sep', patients: 58 },
  { name: 'Oct', patients: 60 },
  { name: 'Nov', patients: 62 },
  { name: 'Dec', patients: 65 },
];

const recordStatsData = [
  { name: 'Lab Results', value: 45 },
  { name: 'Prescriptions', value: 30 },
  { name: 'Imaging', value: 15 },
  { name: 'Notes', value: 10 }
];

const appointmentStatsData = [
  { name: 'Jan', checkups: 10, procedures: 5, emergencies: 2 },
  { name: 'Feb', checkups: 12, procedures: 6, emergencies: 1 },
  { name: 'Mar', checkups: 15, procedures: 4, emergencies: 3 },
  { name: 'Apr', checkups: 13, procedures: 7, emergencies: 2 },
  { name: 'May', checkups: 18, procedures: 8, emergencies: 2 },
  { name: 'Jun', checkups: 20, procedures: 9, emergencies: 1 },
];

const genderStatsData = [
  { name: 'Male', value: 42, color: '#3b82f6' },
  { name: 'Female', value: 58, color: '#ec4899' },
];

const DoctorReports: React.FC = () => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState('year');
  
  if (!user) return null;
  
  const handleExport = (reportType: string) => {
    toast.success(`Exporting ${reportType} report as CSV`);
  };
  
  const COLORS = ['#4ade80', '#22d3ee', '#818cf8', '#fb7185', '#f97316', '#8b5cf6'];
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ChartPie className="h-6 w-6" />
          Reports & Analytics
        </h1>
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => handleExport('all')}>
            <Download className="mr-2 h-4 w-4" />
            Export Reports
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Patients</CardTitle>
            <CardDescription>All registered patients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">65</div>
              <div className="text-sm text-green-500 font-medium flex items-center">
                +8% from previous {timeframe}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Medical Records</CardTitle>
            <CardDescription>Total records shared</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">187</div>
              <div className="text-sm text-green-500 font-medium flex items-center">
                +12% from previous {timeframe}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Appointments</CardTitle>
            <CardDescription>Total appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">42</div>
              <div className="text-sm text-green-500 font-medium flex items-center">
                +5% from previous {timeframe}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="demographics" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="demographics" className="flex items-center gap-1">
            <ChartPie className="h-4 w-4" />
            Patient Demographics
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            Records Analysis
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            Appointment Trends
          </TabsTrigger>
          <TabsTrigger value="growth" className="flex items-center gap-1">
            <LineChartIcon className="h-4 w-4" />
            Practice Growth
          </TabsTrigger>
        </TabsList>
        
        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Patient Age Distribution</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageGroupData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Patients">
                        {ageGroupData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderStatsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {genderStatsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} patients`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Common Medical Conditions</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={diseaseData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Patients">
                        {diseaseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Records Tab */}
        <TabsContent value="records" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Records by Type</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={recordStatsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {recordStatsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} records`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Records Added Over Time</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={patientGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="patients" 
                        name="Records" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Records Access Metrics</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="20%" 
                      outerRadius="90%" 
                      barSize={20} 
                      data={diseaseData}
                    >
                      <RadialBar
                        label={{ position: 'insideStart', fill: '#fff' }}
                        background
                        dataKey="count"
                        name="Access Count"
                      >
                        {diseaseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </RadialBar>
                      <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                      <Tooltip />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Appointment Types</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={appointmentStatsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="checkups" name="Check-ups" fill="#4ade80" />
                      <Bar dataKey="procedures" name="Procedures" fill="#818cf8" />
                      <Bar dataKey="emergencies" name="Emergencies" fill="#fb7185" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Appointment Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Completed', value: 68, color: '#4ade80' },
                          { name: 'Scheduled', value: 25, color: '#60a5fa' },
                          { name: 'Cancelled', value: 7, color: '#f87171' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: 'Completed', value: 68, color: '#4ade80' },
                          { name: 'Scheduled', value: 25, color: '#60a5fa' },
                          { name: 'Cancelled', value: 7, color: '#f87171' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} appointments`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Appointment Trends</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={appointmentStatsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="checkups" 
                        name="Check-ups" 
                        stroke="#4ade80" 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="procedures" 
                        name="Procedures" 
                        stroke="#818cf8" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="emergencies" 
                        name="Emergencies" 
                        stroke="#fb7185" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Growth Tab */}
        <TabsContent value="growth" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Patient Growth</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={patientGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="patients" 
                        name="Total Patients" 
                        stroke="#4ade80" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Records per Patient</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Min', value: 1 },
                      { name: 'Average', value: 3.5 },
                      { name: 'Max', value: 8 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Records" fill="#60a5fa" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Monthly Activity Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { name: 'Jan', patients: 30, records: 47, appointments: 22 },
                      { name: 'Feb', patients: 35, records: 55, appointments: 25 },
                      { name: 'Mar', patients: 40, records: 65, appointments: 30 },
                      { name: 'Apr', patients: 43, records: 75, appointments: 28 },
                      { name: 'May', patients: 45, records: 85, appointments: 32 },
                      { name: 'Jun', patients: 50, records: 100, appointments: 35 },
                      { name: 'Jul', patients: 52, records: 110, appointments: 37 },
                      { name: 'Aug', patients: 56, records: 125, appointments: 40 },
                      { name: 'Sep', patients: 58, records: 140, appointments: 42 },
                      { name: 'Oct', patients: 60, records: 160, appointments: 38 },
                      { name: 'Nov', patients: 62, records: 175, appointments: 41 },
                      { name: 'Dec', patients: 65, records: 187, appointments: 42 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="patients" 
                        name="Patients" 
                        stackId="1"
                        stroke="#4ade80" 
                        fill="#4ade80" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="records" 
                        name="Records" 
                        stackId="2"
                        stroke="#60a5fa" 
                        fill="#60a5fa" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="appointments" 
                        name="Appointments" 
                        stackId="3"
                        stroke="#c084fc" 
                        fill="#c084fc" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Downloadable Reports</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:border-primary cursor-pointer" onClick={() => handleExport('Patient Activity')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Patient Activity</h3>
                <p className="text-sm text-muted-foreground">CSV</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:border-primary cursor-pointer" onClick={() => handleExport('Appointment Summary')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-secondary/10">
                <Calendar className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h3 className="font-medium">Appointment Summary</h3>
                <p className="text-sm text-muted-foreground">CSV</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:border-primary cursor-pointer" onClick={() => handleExport('Medical Records Log')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-accent/10">
                <Activity className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-medium">Medical Records Log</h3>
                <p className="text-sm text-muted-foreground">CSV</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:border-primary cursor-pointer" onClick={() => handleExport('Patient Demographics')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <ChartPie className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Patient Demographics</h3>
                <p className="text-sm text-muted-foreground">CSV</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DoctorReports;
