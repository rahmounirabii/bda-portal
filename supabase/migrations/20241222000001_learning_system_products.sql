-- ============================================================================
-- Learning System Products & Access Migration
-- Implements language-based (EN/AR) Learning System access
-- Date: 2024-12-22
-- ============================================================================

-- ============================================================================
-- 1. Create learning_system_products table
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_system_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  woocommerce_product_id INTEGER UNIQUE NOT NULL,
  woocommerce_product_name TEXT NOT NULL,
  woocommerce_product_sku TEXT,
  language TEXT NOT NULL CHECK (language IN ('EN', 'AR')),
  includes_curriculum BOOLEAN DEFAULT true NOT NULL,
  includes_question_bank BOOLEAN DEFAULT true NOT NULL,
  includes_flashcards BOOLEAN DEFAULT true NOT NULL,
  validity_months INTEGER DEFAULT 12 NOT NULL CHECK (validity_months > 0),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_learning_products_wc_id ON learning_system_products(woocommerce_product_id);
CREATE INDEX idx_learning_products_language ON learning_system_products(language);
CREATE INDEX idx_learning_products_active ON learning_system_products(is_active);

-- Updated at trigger
CREATE TRIGGER learning_system_products_updated_at
  BEFORE UPDATE ON learning_system_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE learning_system_products ENABLE ROW LEVEL SECURITY;

-- Admins can manage products
CREATE POLICY "Admins can manage learning system products"
  ON learning_system_products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Users can view active products
CREATE POLICY "Users can view active learning system products"
  ON learning_system_products
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================================
-- 2. Modify user_curriculum_access table
-- ============================================================================

-- Add new columns
ALTER TABLE user_curriculum_access
  ADD COLUMN IF NOT EXISTS language TEXT CHECK (language IN ('EN', 'AR'));

ALTER TABLE user_curriculum_access
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'store_purchase';

ALTER TABLE user_curriculum_access
  ADD COLUMN IF NOT EXISTS includes_question_bank BOOLEAN DEFAULT true;

ALTER TABLE user_curriculum_access
  ADD COLUMN IF NOT EXISTS includes_flashcards BOOLEAN DEFAULT true;

-- Backfill existing records with default language
UPDATE user_curriculum_access
SET language = 'EN'
WHERE language IS NULL;

-- Make language NOT NULL after backfill
ALTER TABLE user_curriculum_access
  ALTER COLUMN language SET NOT NULL;

-- Drop old unique constraint if exists
ALTER TABLE user_curriculum_access
  DROP CONSTRAINT IF EXISTS unique_user_cert_access;

-- Add new unique constraint for user + language
ALTER TABLE user_curriculum_access
  ADD CONSTRAINT unique_user_language UNIQUE (user_id, language);

-- Add index for language-based queries
CREATE INDEX IF NOT EXISTS idx_user_curriculum_access_language ON user_curriculum_access(language);
CREATE INDEX IF NOT EXISTS idx_user_curriculum_access_user_lang ON user_curriculum_access(user_id, language);

-- ============================================================================
-- 3. Create database function for granting Learning System access
-- ============================================================================

CREATE OR REPLACE FUNCTION grant_learning_system_access(
  p_user_id UUID,
  p_language TEXT,
  p_woocommerce_order_id INTEGER,
  p_woocommerce_product_id INTEGER,
  p_purchased_at TIMESTAMPTZ,
  p_validity_months INTEGER DEFAULT 12,
  p_includes_question_bank BOOLEAN DEFAULT true,
  p_includes_flashcards BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_access_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_cert_type certification_type;
BEGIN
  -- Calculate expiry date
  v_expires_at := p_purchased_at + (p_validity_months || ' months')::INTERVAL;

  -- Determine certification type based on user's existing data or default to CP
  SELECT certification_type INTO v_cert_type
  FROM user_curriculum_access
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_cert_type IS NULL THEN
    v_cert_type := 'CP'; -- Default
  END IF;

  -- Insert or update access record
  INSERT INTO user_curriculum_access (
    user_id,
    certification_type,
    language,
    woocommerce_order_id,
    woocommerce_product_id,
    purchased_at,
    expires_at,
    is_active,
    source,
    includes_question_bank,
    includes_flashcards
  )
  VALUES (
    p_user_id,
    v_cert_type,
    p_language,
    p_woocommerce_order_id,
    p_woocommerce_product_id,
    p_purchased_at,
    v_expires_at,
    true,
    'store_purchase',
    p_includes_question_bank,
    p_includes_flashcards
  )
  ON CONFLICT (user_id, language)
  DO UPDATE SET
    woocommerce_order_id = EXCLUDED.woocommerce_order_id,
    woocommerce_product_id = EXCLUDED.woocommerce_product_id,
    purchased_at = EXCLUDED.purchased_at,
    expires_at = EXCLUDED.expires_at,
    is_active = true,
    includes_question_bank = EXCLUDED.includes_question_bank,
    includes_flashcards = EXCLUDED.includes_flashcards,
    updated_at = NOW()
  RETURNING id INTO v_access_id;

  -- Initialize user progress for the certification type
  PERFORM initialize_user_progress(p_user_id, v_cert_type);

  RETURN v_access_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION grant_learning_system_access TO authenticated;
GRANT EXECUTE ON FUNCTION grant_learning_system_access TO service_role;

-- ============================================================================
-- 4. Create function to check Learning System access by language
-- ============================================================================

CREATE OR REPLACE FUNCTION check_learning_system_access(
  p_user_id UUID,
  p_language TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_access user_curriculum_access;
  v_result JSONB;
BEGIN
  -- Get access record
  SELECT * INTO v_access
  FROM user_curriculum_access
  WHERE user_id = p_user_id
    AND language = p_language
    AND is_active = true
    AND expires_at > NOW();

  IF v_access.id IS NULL THEN
    -- No active access
    RETURN jsonb_build_object(
      'has_access', false,
      'reason', 'no_active_access'
    );
  END IF;

  -- Build result
  v_result := jsonb_build_object(
    'has_access', true,
    'access_id', v_access.id,
    'language', v_access.language,
    'expires_at', v_access.expires_at,
    'includes_question_bank', v_access.includes_question_bank,
    'includes_flashcards', v_access.includes_flashcards,
    'certification_type', v_access.certification_type
  );

  RETURN v_result;
END;
$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION check_learning_system_access TO authenticated;

-- ============================================================================
-- 5. Create function to get all user's Learning System accesses
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_learning_system_accesses(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_accesses JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'language', language,
      'expires_at', expires_at,
      'is_active', is_active AND expires_at > NOW(),
      'includes_curriculum', includes_curriculum,
      'includes_question_bank', includes_question_bank,
      'includes_flashcards', includes_flashcards,
      'purchased_at', purchased_at,
      'certification_type', certification_type
    )
  )
  INTO v_accesses
  FROM user_curriculum_access
  WHERE user_id = p_user_id
    AND is_active = true
    AND expires_at > NOW();

  IF v_accesses IS NULL THEN
    v_accesses := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'accesses', v_accesses,
    'has_en', EXISTS (
      SELECT 1 FROM user_curriculum_access
      WHERE user_id = p_user_id
        AND language = 'EN'
        AND is_active = true
        AND expires_at > NOW()
    ),
    'has_ar', EXISTS (
      SELECT 1 FROM user_curriculum_access
      WHERE user_id = p_user_id
        AND language = 'AR'
        AND is_active = true
        AND expires_at > NOW()
    )
  );
END;
$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION get_user_learning_system_accesses TO authenticated;

-- ============================================================================
-- 6. Create admin view for Learning System access management
-- ============================================================================

CREATE OR REPLACE VIEW admin_learning_system_access AS
SELECT
  uca.id,
  uca.user_id,
  u.email,
  u.first_name,
  u.last_name,
  uca.language,
  uca.certification_type,
  uca.purchased_at,
  uca.expires_at,
  uca.is_active,
  uca.is_active AND uca.expires_at > NOW() AS currently_active,
  uca.includes_question_bank,
  uca.includes_flashcards,
  uca.woocommerce_order_id,
  uca.woocommerce_product_id,
  uca.source,
  uca.created_at
FROM user_curriculum_access uca
JOIN users u ON u.id = uca.user_id
ORDER BY uca.created_at DESC;

-- Grant access to admins
GRANT SELECT ON admin_learning_system_access TO authenticated;

-- ============================================================================
-- 7. Insert default Learning System products (examples)
-- ============================================================================

-- Note: Update these product IDs to match actual WooCommerce products
-- These are examples - replace with actual WooCommerce product IDs from your store
INSERT INTO learning_system_products (
  woocommerce_product_id,
  woocommerce_product_name,
  woocommerce_product_sku,
  language,
  includes_curriculum,
  includes_question_bank,
  includes_flashcards,
  validity_months,
  is_active
) VALUES
  (999999, 'BDA Learning System - English', 'BDA-LS-EN', 'EN', true, true, true, 12, false),
  (999998, 'BDA Learning System - Arabic', 'BDA-LS-AR', 'AR', true, true, true, 12, false)
ON CONFLICT (woocommerce_product_id) DO NOTHING;

-- NOTE: The above products are set to is_active=false by default
-- Use the admin UI to configure the actual WooCommerce product IDs and activate them

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE learning_system_products IS 'WooCommerce products for BDA Learning System (EN/AR)';
COMMENT ON COLUMN user_curriculum_access.language IS 'Language of Learning System access: EN or AR';
COMMENT ON COLUMN user_curriculum_access.source IS 'Source of access grant: store_purchase, admin_grant, etc.';
COMMENT ON FUNCTION grant_learning_system_access IS 'Grant Learning System access after WooCommerce purchase';
COMMENT ON FUNCTION check_learning_system_access IS 'Check if user has active Learning System access for specific language';
COMMENT ON FUNCTION get_user_learning_system_accesses IS 'Get all active Learning System accesses for a user';
