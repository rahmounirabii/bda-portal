-- Migration: Add public verification policy for certifications
-- Date: 2025-10-02
-- Description: Allow authenticated users to verify any certification (public verification)

-- =============================================================================
-- ROW LEVEL SECURITY - Public Verification
-- =============================================================================

-- Drop existing restrictive SELECT policies first
DROP POLICY IF EXISTS "Users can view their own certifications" ON public.user_certifications;
DROP POLICY IF EXISTS "Admins can view all certifications" ON public.user_certifications;

-- All authenticated users can view any certification (for verification purposes)
CREATE POLICY "Anyone authenticated can view certifications for verification"
  ON public.user_certifications
  FOR SELECT
  TO authenticated
  USING (true);

-- Note: INSERT, UPDATE, DELETE policies remain admin-only

-- Verification
SELECT '✅ Public certification verification policy added successfully!' as status;
