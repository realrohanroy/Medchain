declare global {
  interface Window {
    ethereum?: any;
  }
}

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  wallet_address?: string;
  created_at?: string;
  updated_at?: string;
  avatar?: string;
  specialty?: string;
  hospital?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
};

export {};
