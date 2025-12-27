-- Migration: Create Resources Storage Bucket
-- Date: 2025-10-02
-- Description: Create Supabase Storage bucket for resources with RLS policies

-- Create storage bucket for resources
INSERT INTO storage.buckets (id, name)
VALUES ('resources', 'resources')
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for storage.objects

-- Allow authenticated users to read/download resources
CREATE POLICY "Authenticated users can download resources"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'resources');

-- Allow admins to upload resources
CREATE POLICY "Admins can upload resources"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resources' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Allow admins to update resources
CREATE POLICY "Admins can update resources"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'resources' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Allow admins to delete resources
CREATE POLICY "Admins can delete resources"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resources' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Verification
SELECT '✅ Resources storage bucket created with RLS policies!' as status;
