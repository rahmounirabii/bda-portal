-- Migration: Add partner roles to user_role enum
-- Date: 2025-12-02
-- Description: Adds ecp_partner and pdp_partner to user_role enum for partner portal support

-- Add new enum values for partner roles
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ecp_partner';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'pdp_partner';

-- Verification
SELECT '✅ Partner roles added to user_role enum!' as status;
