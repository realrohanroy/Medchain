
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProfileRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      if (user.role === 'patient') {
        navigate('/patient/profile', { replace: true });
      } else if (user.role === 'doctor') {
        navigate('/doctor/profile', { replace: true });
      }
    }
  }, [user, navigate]);
  
  // Return null as this is just a redirect component
  return null;
};

export default ProfileRedirect;
