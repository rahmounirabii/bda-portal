-- ============================================================================
-- Fix pdp_partner role to pdp
-- Date: 2024-12-24
-- Description: Update any users with legacy 'pdp_partner' role to use 'pdp'
-- ============================================================================

-- Update users with pdp_partner role to pdp
UPDATE users
SET role = 'pdp'
WHERE role = 'pdp_partner';

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % users from pdp_partner to pdp role', updated_count;
END $$;

-- Verification
SELECT 'Users by role after fix:' as info;
SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC;
