import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  FileText, 
  Calendar, 
  BarChart2, 
  ClipboardCheck, 
  Home, 
  Settings,
  LogOut
} from 'lucide-react';

const DoctorSidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  if (!user || user.role !== 'doctor') return null;
  
  const isActivePath = (path: string) => {
    return location.pathname === path;
  };
  
  const navItems = [
    {
      name: 'Dashboard',
      path: '/doctor',
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: 'My Patients',
      path: '/doctor/patients',
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: 'Patient Records',
      path: '/doctor/records',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: 'Appointments',
      path: '/doctor/appointments',
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      name: 'Reports & Charts',
      path: '/doctor/reports',
      icon: <BarChart2 className="h-5 w-5" />,
    },
    {
      name: 'Approval Requests',
      path: '/doctor/approvals',
      icon: <ClipboardCheck className="h-5 w-5" />,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ];
  
  return (
    <div className="h-full flex flex-col bg-card border-r w-72 dark:bg-gray-900">
      <div className="flex-1 flex flex-col pt-5 pb-4">
        <div className="flex items-center flex-shrink-0 px-4 mb-5">
          <h1 className="text-xl font-bold text-foreground">Doctor Portal</h1>
        </div>
        <div className="flex-1 flex flex-col">
          <nav className="flex-1 px-3 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  isActivePath(item.path)
                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                    : 'text-muted-foreground hover:bg-muted dark:hover:bg-gray-800',
                  'group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors'
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {item.name}
                </div>
              </Link>
            ))}
          </nav>
          
          <div className="px-3 mt-auto pb-4">
            <button
              onClick={() => logout()}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorSidebar;
