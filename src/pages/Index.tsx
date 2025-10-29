
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LandingPage from './LandingPage';

const Index = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isAuthenticated) {
      // Redirect based on user role
      navigate(user?.role === 'patient' ? '/patient' : '/doctor');
    }
  }, [isAuthenticated, navigate, user]);
  
  return <LandingPage />;
};

export default Index;
