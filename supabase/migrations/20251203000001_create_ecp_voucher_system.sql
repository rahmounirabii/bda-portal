-- =============================================================================
-- ECP Voucher System - Individual Voucher Tracking
-- =============================================================================
-- This migration creates tables for tracking individual exam vouchers,
-- voucher requests, and voucher assignments to candidates.
-- =============================================================================

-- =============================================================================
-- Voucher Status Type
-- =============================================================================

-- Drop old enum if it has wrong values and recreate
DO $$
BEGIN
  -- Check if voucher_status exists but without 'available' value
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'voucher_status') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'voucher_status') AND enumlabel = 'available') THEN
      -- Drop dependent objects first
      DROP TABLE IF EXISTS public.ecp_vouchers CASCADE;
      DROP TYPE IF EXISTS voucher_status CASCADE;
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'voucher_status') THEN
    CREATE TYPE voucher_status AS ENUM ('available', 'assigned', 'used', 'expired', 'cancelled');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'voucher_request_status') THEN
    CREATE TYPE voucher_request_status AS ENUM ('pending', 'approved', 'paid', 'fulfilled', 'cancelled', 'refunded');
  END IF;
END $$;

-- =============================================================================
-- TABLE: ecp_vouchers
-- Individual exam vouchers with tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ecp_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  allocation_id UUID REFERENCES public.ecp_voucher_allocations(id) ON DELETE SET NULL,

  -- Voucher details
  voucher_code VARCHAR(50) UNIQUE NOT NULL,
  certification_type certification_type NOT NULL,
  status voucher_status NOT NULL DEFAULT 'available',

  -- Assignment
  assigned_to_email VARCHAR(255),
  assigned_to_name VARCHAR(255),
  trainee_id UUID REFERENCES public.ecp_trainees(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  assigned_by UUID REFERENCES public.users(id),

  -- Usage
  used_at TIMESTAMPTZ,
  exam_attempt_id UUID, -- Reference to the exam attempt when used

  -- Validity
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL,

  -- Purchase info
  order_id VARCHAR(100), -- WooCommerce order ID
  order_reference VARCHAR(100),
  purchased_at TIMESTAMPTZ,
  unit_price DECIMAL(10, 2),

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE: ecp_voucher_requests
-- Partner requests for new vouchers (manual or API)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ecp_voucher_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Request details
  request_number VARCHAR(50) UNIQUE NOT NULL,
  certification_type certification_type NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 150.00,
  total_amount DECIMAL(10, 2) NOT NULL,

  -- Status
  status voucher_request_status NOT NULL DEFAULT 'pending',

  -- Payment
  payment_method VARCHAR(50), -- 'invoice', 'card', 'bank_transfer'
  payment_reference VARCHAR(100),
  paid_at TIMESTAMPTZ,

  -- Fulfillment
  fulfilled_at TIMESTAMPTZ,
  fulfilled_by UUID REFERENCES public.users(id),
  vouchers_generated INTEGER DEFAULT 0,

  -- WooCommerce integration
  woocommerce_order_id VARCHAR(100),
  woocommerce_invoice_url TEXT,

  -- Admin
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_ecp_vouchers_partner ON public.ecp_vouchers(partner_id);
CREATE INDEX IF NOT EXISTS idx_ecp_vouchers_status ON public.ecp_vouchers(status);
CREATE INDEX IF NOT EXISTS idx_ecp_vouchers_cert_type ON public.ecp_vouchers(certification_type);
CREATE INDEX IF NOT EXISTS idx_ecp_vouchers_trainee ON public.ecp_vouchers(trainee_id);
CREATE INDEX IF NOT EXISTS idx_ecp_vouchers_code ON public.ecp_vouchers(voucher_code);
CREATE INDEX IF NOT EXISTS idx_ecp_vouchers_valid_until ON public.ecp_vouchers(valid_until);
CREATE INDEX IF NOT EXISTS idx_ecp_vouchers_assigned_email ON public.ecp_vouchers(assigned_to_email);

CREATE INDEX IF NOT EXISTS idx_ecp_voucher_requests_partner ON public.ecp_voucher_requests(partner_id);
CREATE INDEX IF NOT EXISTS idx_ecp_voucher_requests_status ON public.ecp_voucher_requests(status);
CREATE INDEX IF NOT EXISTS idx_ecp_voucher_requests_number ON public.ecp_voucher_requests(request_number);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamp trigger for ecp_vouchers
DROP TRIGGER IF EXISTS update_ecp_vouchers_updated_at ON public.ecp_vouchers;
CREATE TRIGGER update_ecp_vouchers_updated_at
  BEFORE UPDATE ON public.ecp_vouchers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for ecp_voucher_requests
DROP TRIGGER IF EXISTS update_ecp_voucher_requests_updated_at ON public.ecp_voucher_requests;
CREATE TRIGGER update_ecp_voucher_requests_updated_at
  BEFORE UPDATE ON public.ecp_voucher_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.ecp_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecp_voucher_requests ENABLE ROW LEVEL SECURITY;

-- ECP partners can view their own vouchers
CREATE POLICY "ECP partners can view their vouchers"
  ON public.ecp_vouchers FOR SELECT
  TO authenticated
  USING (
    partner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ECP partners can update their own vouchers (for assignment)
CREATE POLICY "ECP partners can update their vouchers"
  ON public.ecp_vouchers FOR UPDATE
  TO authenticated
  USING (partner_id = auth.uid())
  WITH CHECK (partner_id = auth.uid());

-- Admins can manage all vouchers
CREATE POLICY "Admins can manage all vouchers"
  ON public.ecp_vouchers FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- ECP partners can view their own voucher requests
CREATE POLICY "ECP partners can view their voucher requests"
  ON public.ecp_voucher_requests FOR SELECT
  TO authenticated
  USING (
    partner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ECP partners can create voucher requests
CREATE POLICY "ECP partners can create voucher requests"
  ON public.ecp_voucher_requests FOR INSERT
  TO authenticated
  WITH CHECK (partner_id = auth.uid());

-- ECP partners can update their pending requests (cancel only)
CREATE POLICY "ECP partners can update their pending requests"
  ON public.ecp_voucher_requests FOR UPDATE
  TO authenticated
  USING (partner_id = auth.uid() AND status = 'pending')
  WITH CHECK (partner_id = auth.uid());

-- Admins can manage all voucher requests
CREATE POLICY "Admins can manage all voucher requests"
  ON public.ecp_voucher_requests FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Drop existing function if it has wrong return type
DROP FUNCTION IF EXISTS generate_voucher_code(certification_type);

-- Generate unique voucher code
CREATE OR REPLACE FUNCTION generate_voucher_code(p_cert_type certification_type)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_prefix VARCHAR(10);
  v_year VARCHAR(4);
  v_sequence INTEGER;
  v_code VARCHAR(50);
BEGIN
  -- Set prefix based on certification type
  v_prefix := CASE p_cert_type
    WHEN 'CP' THEN 'BDA-CP'
    WHEN 'SCP' THEN 'BDA-SCP'
    ELSE 'BDA-EX'
  END;

  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Get next sequence number for this type and year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(voucher_code FROM LENGTH(v_prefix) + 6 FOR 4) AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM public.ecp_vouchers
  WHERE voucher_code LIKE v_prefix || '-' || v_year || '-%';

  -- Generate code: BDA-CP-2024-0001
  v_code := v_prefix || '-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');

  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Generate voucher request number
CREATE OR REPLACE FUNCTION generate_voucher_request_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  v_year VARCHAR(4);
  v_sequence INTEGER;
  v_number VARCHAR(50);
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Get next sequence number for this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(request_number FROM 5 FOR 6) AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM public.ecp_voucher_requests
  WHERE request_number LIKE 'VR-' || v_year || '-%';

  -- Generate number: VR-2024-000001
  v_number := 'VR-' || v_year || '-' || LPAD(v_sequence::TEXT, 6, '0');

  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Create vouchers from a fulfilled request
CREATE OR REPLACE FUNCTION fulfill_voucher_request(p_request_id UUID, p_admin_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_request RECORD;
  v_count INTEGER := 0;
  v_code VARCHAR(50);
  v_valid_until DATE;
BEGIN
  -- Get request details
  SELECT * INTO v_request
  FROM public.ecp_voucher_requests
  WHERE id = p_request_id AND status = 'paid';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not in paid status';
  END IF;

  -- Set validity (1 year from today)
  v_valid_until := CURRENT_DATE + INTERVAL '1 year';

  -- Generate vouchers
  FOR i IN 1..v_request.quantity LOOP
    v_code := generate_voucher_code(v_request.certification_type);

    INSERT INTO public.ecp_vouchers (
      partner_id,
      voucher_code,
      certification_type,
      status,
      valid_from,
      valid_until,
      order_id,
      order_reference,
      purchased_at,
      unit_price
    ) VALUES (
      v_request.partner_id,
      v_code,
      v_request.certification_type,
      'available',
      CURRENT_DATE,
      v_valid_until,
      v_request.woocommerce_order_id,
      v_request.request_number,
      NOW(),
      v_request.unit_price
    );

    v_count := v_count + 1;
  END LOOP;

  -- Update request
  UPDATE public.ecp_voucher_requests
  SET
    status = 'fulfilled',
    fulfilled_at = NOW(),
    fulfilled_by = p_admin_id,
    vouchers_generated = v_count
  WHERE id = p_request_id;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Assign voucher to candidate
CREATE OR REPLACE FUNCTION assign_voucher(
  p_voucher_id UUID,
  p_email VARCHAR(255),
  p_name VARCHAR(255),
  p_trainee_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_voucher RECORD;
BEGIN
  -- Get and lock voucher
  SELECT * INTO v_voucher
  FROM public.ecp_vouchers
  WHERE id = p_voucher_id AND status = 'available'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voucher not available for assignment';
  END IF;

  -- Check if expired
  IF v_voucher.valid_until < CURRENT_DATE THEN
    UPDATE public.ecp_vouchers SET status = 'expired' WHERE id = p_voucher_id;
    RAISE EXCEPTION 'Voucher has expired';
  END IF;

  -- Update voucher
  UPDATE public.ecp_vouchers
  SET
    status = 'assigned',
    assigned_to_email = p_email,
    assigned_to_name = p_name,
    trainee_id = p_trainee_id,
    assigned_at = NOW(),
    assigned_by = auth.uid()
  WHERE id = p_voucher_id;

  -- If trainee_id provided, update trainee record
  IF p_trainee_id IS NOT NULL THEN
    UPDATE public.ecp_trainees
    SET exam_voucher_id = p_voucher_id
    WHERE id = p_trainee_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unassign voucher
CREATE OR REPLACE FUNCTION unassign_voucher(p_voucher_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_voucher RECORD;
BEGIN
  -- Get voucher
  SELECT * INTO v_voucher
  FROM public.ecp_vouchers
  WHERE id = p_voucher_id AND status = 'assigned';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voucher not found or not assigned';
  END IF;

  -- Clear trainee reference if exists
  IF v_voucher.trainee_id IS NOT NULL THEN
    UPDATE public.ecp_trainees
    SET exam_voucher_id = NULL
    WHERE id = v_voucher.trainee_id;
  END IF;

  -- Update voucher
  UPDATE public.ecp_vouchers
  SET
    status = 'available',
    assigned_to_email = NULL,
    assigned_to_name = NULL,
    trainee_id = NULL,
    assigned_at = NULL,
    assigned_by = NULL
  WHERE id = p_voucher_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get voucher stats for partner
CREATE OR REPLACE FUNCTION get_partner_voucher_stats(p_partner_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'available', COUNT(*) FILTER (WHERE status = 'available'),
    'assigned', COUNT(*) FILTER (WHERE status = 'assigned'),
    'used', COUNT(*) FILTER (WHERE status = 'used'),
    'expired', COUNT(*) FILTER (WHERE status = 'expired'),
    'cp_available', COUNT(*) FILTER (WHERE status = 'available' AND certification_type = 'CP'),
    'scp_available', COUNT(*) FILTER (WHERE status = 'available' AND certification_type = 'SCP'),
    'expiring_soon', COUNT(*) FILTER (WHERE status IN ('available', 'assigned') AND valid_until <= CURRENT_DATE + INTERVAL '30 days')
  )
  INTO v_result
  FROM public.ecp_vouchers
  WHERE partner_id = p_partner_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Auto-expire vouchers (to be called by cron)
CREATE OR REPLACE FUNCTION expire_vouchers()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.ecp_vouchers
  SET status = 'expired'
  WHERE status IN ('available', 'assigned')
    AND valid_until < CURRENT_DATE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGER: Auto-generate request number
-- =============================================================================

CREATE OR REPLACE FUNCTION set_voucher_request_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_number IS NULL THEN
    NEW.request_number := generate_voucher_request_number();
  END IF;

  -- Calculate total amount
  NEW.total_amount := NEW.quantity * NEW.unit_price;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_voucher_request_number ON public.ecp_voucher_requests;
CREATE TRIGGER trigger_set_voucher_request_number
  BEFORE INSERT ON public.ecp_voucher_requests
  FOR EACH ROW EXECUTE FUNCTION set_voucher_request_number();

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT EXECUTE ON FUNCTION generate_voucher_code(certification_type) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_voucher(UUID, VARCHAR, VARCHAR, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION unassign_voucher(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_partner_voucher_stats(UUID) TO authenticated;
