-- SQL to create necessary tables for the medical records system
-- Run this in your Supabase SQL editor

-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
  specialty TEXT, -- For doctors
  wallet_address TEXT UNIQUE, -- For Web3 integration
  phone TEXT, -- Optional phone number
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for profiles (basic policies only)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);
  
-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (for registration)
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admin users can read all profiles (for admin dashboard)
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create medical_records table
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  cid TEXT NOT NULL, -- Content identifier (for blockchain storage)
  storage_path TEXT, -- Path in Supabase storage
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for medical_records (basic policies only)
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Patients can read their own medical records
CREATE POLICY "Patients can read their own medical records"
  ON public.medical_records
  FOR SELECT
  USING (auth.uid() = patient_id);

-- Patients can insert their own medical records
CREATE POLICY "Patients can insert their own medical records"
  ON public.medical_records
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- Patients can update their own medical records
CREATE POLICY "Patients can update their own medical records"
  ON public.medical_records
  FOR UPDATE
  USING (auth.uid() = patient_id);

-- Patients can delete their own medical records
CREATE POLICY "Patients can delete their own medical records"
  ON public.medical_records
  FOR DELETE
  USING (auth.uid() = patient_id);

-- Create access_requests table
CREATE TABLE IF NOT EXISTS public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  record_id UUID REFERENCES public.medical_records(id) ON DELETE CASCADE,
  request_all_records BOOLEAN DEFAULT FALSE,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, patient_id, record_id)
);

-- Add RLS policies for access_requests
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Doctors can create access requests
CREATE POLICY "Doctors can create access requests"
  ON public.access_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = doctor_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'doctor'
    )
  );

-- Doctors can read their own access requests
CREATE POLICY "Doctors can read their own access requests"
  ON public.access_requests
  FOR SELECT
  USING (auth.uid() = doctor_id);

-- Patients can read access requests for their records
CREATE POLICY "Patients can read access requests for their records"
  ON public.access_requests
  FOR SELECT
  USING (auth.uid() = patient_id);

-- Patients can update access requests for their records (to approve/deny)
CREATE POLICY "Patients can update access requests for their records"
  ON public.access_requests
  FOR UPDATE
  USING (auth.uid() = patient_id);

-- Create access_grants table
CREATE TABLE IF NOT EXISTS public.access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.access_requests(id) ON DELETE SET NULL,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  record_id UUID REFERENCES public.medical_records(id) ON DELETE CASCADE,
  grant_all_records BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(doctor_id, patient_id, record_id)
);

-- Add RLS policies for access_grants
ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;

-- Patients can read access grants they've given
CREATE POLICY "Patients can read access grants they've given"
  ON public.access_grants
  FOR SELECT
  USING (auth.uid() = patient_id);

-- Patients can insert access grants for their records
CREATE POLICY "Patients can insert access grants for their records"
  ON public.access_grants
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- Patients can update access grants (to revoke)
CREATE POLICY "Patients can update access grants they've given"
  ON public.access_grants
  FOR UPDATE
  USING (auth.uid() = patient_id);

-- Doctors can read access grants they've received
CREATE POLICY "Doctors can read access grants they've received"
  ON public.access_grants
  FOR SELECT
  USING (auth.uid() = doctor_id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_entity_id UUID,
  related_entity_type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert notifications (for system notifications)
CREATE POLICY "Users can insert their own notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address ON public.profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_upload_date ON public.medical_records(upload_date);

CREATE INDEX IF NOT EXISTS idx_access_requests_doctor_id ON public.access_requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_patient_id ON public.access_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.access_requests(status);

CREATE INDEX IF NOT EXISTS idx_access_grants_doctor_id ON public.access_grants(doctor_id);
CREATE INDEX IF NOT EXISTS idx_access_grants_patient_id ON public.access_grants(patient_id);
CREATE INDEX IF NOT EXISTS idx_access_grants_expires_at ON public.access_grants(expires_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Trigger to create notification when access request is created
CREATE OR REPLACE FUNCTION create_access_request_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, related_entity_id, related_entity_type)
  VALUES (
    NEW.patient_id,
    'New Access Request',
    COALESCE((SELECT full_name FROM public.profiles WHERE id = NEW.doctor_id), 'A doctor') || ' has requested access to your medical records.',
    NEW.id,
    'access_request'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_access_request_created ON public.access_requests;
CREATE TRIGGER on_access_request_created
  AFTER INSERT ON public.access_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_access_request_notification();

-- Trigger to create notification when access request is approved/denied
CREATE OR REPLACE FUNCTION notify_access_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO public.notifications (user_id, title, message, related_entity_id, related_entity_type)
    VALUES (
      NEW.doctor_id,
      'Access Request ' || INITCAP(NEW.status),
      'Your access request to ' || COALESCE((SELECT full_name FROM public.profiles WHERE id = NEW.patient_id), 'a patient') || '''s medical records has been ' || NEW.status || '.',
      NEW.id,
      'access_request'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_access_request_status_changed ON public.access_requests;
CREATE TRIGGER on_access_request_status_changed
  AFTER UPDATE ON public.access_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_access_request_status_change();

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- NOW ADD THE COMPLEX POLICIES THAT DEPEND ON ACCESS_GRANTS TABLE

-- Add the doctor access policy for medical_records after access_grants table is created
CREATE POLICY "Doctors can read records they have access to"
  ON public.medical_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.access_grants ag
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE ag.doctor_id = auth.uid()
      AND ag.record_id = public.medical_records.id
      AND p.role = 'doctor'
      AND (ag.expires_at IS NULL OR ag.expires_at > NOW())
      AND ag.revoked_at IS NULL
    )
  );

-- Add the doctor access policy for profiles after access_grants table is created
CREATE POLICY "Doctors can read patient profiles they have access to"
  ON public.profiles
  FOR SELECT
  USING (
    role = 'patient' AND
    EXISTS (
      SELECT 1 FROM public.access_grants ag
      WHERE ag.patient_id = id 
      AND ag.doctor_id = auth.uid()
      AND (ag.expires_at IS NULL OR ag.expires_at > NOW())
      AND ag.revoked_at IS NULL
    )
  );

-- Trigger to create notification when a new medical record is uploaded
-- This must come after access_grants table is created
CREATE OR REPLACE FUNCTION notify_medical_record_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all doctors who have access to this patient's records
  INSERT INTO public.notifications (user_id, title, message, related_entity_id, related_entity_type)
  SELECT 
    ag.doctor_id,
    'New Medical Record Available',
    COALESCE((SELECT full_name FROM public.profiles WHERE id = NEW.patient_id), 'A patient') || ' has uploaded a new medical record.',
    NEW.id,
    'medical_record'
  FROM public.access_grants ag
  WHERE ag.patient_id = NEW.patient_id
    AND (ag.record_id IS NULL OR ag.record_id = NEW.id OR ag.grant_all_records = TRUE)
    AND (ag.expires_at IS NULL OR ag.expires_at > NOW())
    AND ag.revoked_at IS NULL;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_medical_record_uploaded ON public.medical_records;
CREATE TRIGGER on_medical_record_uploaded
  AFTER INSERT ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION notify_medical_record_upload();
