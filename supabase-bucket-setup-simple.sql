-- SQL to create a storage bucket for medical records
-- Run this in your Supabase SQL editor or via the SQL connection
-- IMPORTANT: Run this AFTER the tables setup script

-- Create a new storage bucket for medical records (with conflict handling)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'medical-records',
  'medical-records',
  FALSE, -- Changed to FALSE for better security - files will be accessed via RLS
  FALSE,
  104857600, -- 100MB file size limit
  '{image/png,image/jpeg,image/jpg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain}'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Note: RLS policies for storage.objects are managed by Supabase automatically
-- The bucket is set to private (public = FALSE) which means:
-- 1. Files are not publicly accessible via direct URLs
-- 2. Access is controlled through your application's authentication
-- 3. You can use signed URLs for secure file access

-- For file access control, you'll need to implement it in your application code:
-- 1. Check user permissions before generating signed URLs
-- 2. Use the access_grants table to verify doctor access
-- 3. Generate signed URLs only for authorized users

-- Example of how to generate signed URLs in your app:
-- const { data } = await supabase.storage
--   .from('medical-records')
--   .createSignedUrl('patient_id/record_id/filename.pdf', 3600) // 1 hour expiry

-- File organization should be: patient_id/record_id/filename.pdf
-- Example: '550e8400-e29b-41d4-a716-446655440000/123e4567-e89b-12d3-a456-426614174000/document.pdf'
