import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileText, 
  Calendar, 
  UserCog, 
  FileQuestion, 
  Home, 
  Settings
} from 'lucide-react';

const PatientSidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  if (!user || user.role !== 'patient') return null;
  
  const isActivePath = (path: string) => {
    return location.pathname === path;
  };
  
  const navItems = [
    {
      name: 'Dashboard',
      path: '/patient',
      icon: <Home className="mr-2 h-5 w-5" />,
    },
    {
      name: 'My Records',
      path: '/patient/records',
      icon: <FileText className="mr-2 h-5 w-5" />,
    },
    {
      name: 'Appointments',
      path: '/patient/appointments',
      icon: <Calendar className="mr-2 h-5 w-5" />,
    },
    {
      name: 'Manage Access',
      path: '/patient/access',
      icon: <UserCog className="mr-2 h-5 w-5" />,
    },
    {
      name: 'Access Requests',
      path: '/patient/requests',
      icon: <FileQuestion className="mr-2 h-5 w-5" />,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="mr-2 h-5 w-5" />,
    },
  ];
  
  return (
    <div className="h-full flex flex-col bg-white border-r w-64">
      <div className="flex-1 flex flex-col pt-5 overflow-y-auto">
        <div className="flex-1 flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  isActivePath(item.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md'
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default PatientSidebar;
