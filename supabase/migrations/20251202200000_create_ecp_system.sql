-- Migration: Create ECP (Exclusive Certification Partner) System
-- Date: 2025-12-02
-- Description: Complete schema for ECP partner management including training batches, trainees, trainers
-- FIXED: Correct table creation order to avoid circular reference issues

-- =============================================================================
-- TABLE: ecp_trainers (MUST be created first - referenced by batches)
-- Certified trainers registered by ECP partners
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ecp_trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Partner reference
  partner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Trainer information
  trainer_code VARCHAR(50) UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,

  -- Qualifications
  certifications certification_type[] DEFAULT '{}',
  trainer_certification_date DATE,
  trainer_certification_expiry DATE,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'inactive')),

  -- Bio/Profile
  bio TEXT,
  photo_url TEXT,
  linkedin_url TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(partner_id, email)
);

-- =============================================================================
-- TABLE: ecp_training_batches
-- Training batches/cohorts managed by ECP partners
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ecp_training_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Partner reference
  partner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Batch information
  batch_code VARCHAR(50) UNIQUE NOT NULL, -- Auto-generated batch code
  batch_name TEXT NOT NULL,
  batch_name_ar TEXT,
  description TEXT,

  -- Certification type
  certification_type certification_type NOT NULL,

  -- Training details
  trainer_id UUID REFERENCES public.ecp_trainers(id) ON DELETE SET NULL,
  training_start_date DATE NOT NULL,
  training_end_date DATE NOT NULL,
  exam_date DATE,

  -- Location
  training_location TEXT,
  training_mode VARCHAR(20) NOT NULL DEFAULT 'in_person' CHECK (training_mode IN ('in_person', 'online', 'hybrid')),

  -- Capacity
  max_capacity INTEGER NOT NULL DEFAULT 30,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled')),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_training_dates CHECK (training_end_date >= training_start_date),
  CONSTRAINT valid_exam_date CHECK (exam_date IS NULL OR exam_date >= training_end_date)
);

-- =============================================================================
-- TABLE: ecp_trainees
-- Individual trainees enrolled by ECP partners
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ecp_trainees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Partner reference
  partner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Trainee information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,

  -- Associated user (if registered)
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Organization info
  company_name TEXT,
  job_title TEXT,

  -- Batch enrollment
  batch_id UUID REFERENCES public.ecp_training_batches(id) ON DELETE SET NULL,

  -- Certification track
  certification_type certification_type NOT NULL,

  -- Status tracking
  enrollment_status VARCHAR(20) NOT NULL DEFAULT 'enrolled' CHECK (enrollment_status IN ('enrolled', 'attending', 'completed', 'dropped', 'transferred')),
  training_completed BOOLEAN DEFAULT false,
  training_completion_date DATE,

  -- Exam tracking
  exam_voucher_id UUID, -- References exam_vouchers
  exam_scheduled BOOLEAN DEFAULT false,
  exam_date DATE,
  exam_passed BOOLEAN,
  exam_score DECIMAL(5,2),

  -- Certification
  certified BOOLEAN DEFAULT false,
  certification_date DATE,
  certificate_number VARCHAR(50),

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(partner_id, email, certification_type)
);

-- =============================================================================
-- TABLE: ecp_voucher_allocations
-- Vouchers allocated to ECP partners
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ecp_voucher_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Partner reference
  partner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Allocation details
  certification_type certification_type NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2),
  total_amount DECIMAL(10,2),

  -- Payment/Order reference
  order_reference VARCHAR(100),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled', 'refunded')),

  -- Allocation status
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'depleted', 'expired', 'cancelled')),

  -- Validity
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL,

  -- Usage tracking
  vouchers_used INTEGER NOT NULL DEFAULT 0,
  vouchers_remaining INTEGER GENERATED ALWAYS AS (quantity - vouchers_used) STORED,

  -- Audit
  allocated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_quantity CHECK (quantity > 0),
  CONSTRAINT valid_used CHECK (vouchers_used >= 0 AND vouchers_used <= quantity)
);

-- =============================================================================
-- TABLE: ecp_performance_metrics
-- Monthly/quarterly performance tracking for ECP partners
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ecp_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Partner reference
  partner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Period
  period_type VARCHAR(10) NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Training metrics
  batches_conducted INTEGER DEFAULT 0,
  trainees_trained INTEGER DEFAULT 0,
  training_completion_rate DECIMAL(5,2),

  -- Exam metrics
  exams_taken INTEGER DEFAULT 0,
  exams_passed INTEGER DEFAULT 0,
  pass_rate DECIMAL(5,2),
  average_score DECIMAL(5,2),

  -- Certification metrics
  certifications_issued INTEGER DEFAULT 0,
  cp_certifications INTEGER DEFAULT 0,
  scp_certifications INTEGER DEFAULT 0,

  -- Satisfaction
  trainee_satisfaction_score DECIMAL(3,2),
  nps_score INTEGER,

  -- Audit
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(partner_id, period_type, period_start)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_ecp_trainers_partner ON public.ecp_trainers(partner_id);
CREATE INDEX IF NOT EXISTS idx_ecp_trainers_status ON public.ecp_trainers(status);
CREATE INDEX IF NOT EXISTS idx_ecp_trainers_email ON public.ecp_trainers(email);

CREATE INDEX IF NOT EXISTS idx_ecp_batches_partner ON public.ecp_training_batches(partner_id);
CREATE INDEX IF NOT EXISTS idx_ecp_batches_status ON public.ecp_training_batches(status);
CREATE INDEX IF NOT EXISTS idx_ecp_batches_dates ON public.ecp_training_batches(training_start_date, training_end_date);
CREATE INDEX IF NOT EXISTS idx_ecp_batches_cert_type ON public.ecp_training_batches(certification_type);

CREATE INDEX IF NOT EXISTS idx_ecp_trainees_partner ON public.ecp_trainees(partner_id);
CREATE INDEX IF NOT EXISTS idx_ecp_trainees_batch ON public.ecp_trainees(batch_id);
CREATE INDEX IF NOT EXISTS idx_ecp_trainees_email ON public.ecp_trainees(email);
CREATE INDEX IF NOT EXISTS idx_ecp_trainees_status ON public.ecp_trainees(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_ecp_trainees_certified ON public.ecp_trainees(certified);

CREATE INDEX IF NOT EXISTS idx_ecp_vouchers_partner ON public.ecp_voucher_allocations(partner_id);
CREATE INDEX IF NOT EXISTS idx_ecp_vouchers_status ON public.ecp_voucher_allocations(status);

CREATE INDEX IF NOT EXISTS idx_ecp_metrics_partner ON public.ecp_performance_metrics(partner_id);
CREATE INDEX IF NOT EXISTS idx_ecp_metrics_period ON public.ecp_performance_metrics(period_start, period_end);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.ecp_trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecp_training_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecp_trainees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecp_voucher_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecp_performance_metrics ENABLE ROW LEVEL SECURITY;

-- ECP Partners can manage their own data
CREATE POLICY "ECP partners can view their trainers"
  ON public.ecp_trainers FOR SELECT
  TO authenticated
  USING (
    partner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "ECP partners can manage their trainers"
  ON public.ecp_trainers FOR ALL
  TO authenticated
  USING (partner_id = auth.uid())
  WITH CHECK (partner_id = auth.uid());

CREATE POLICY "ECP partners can view their batches"
  ON public.ecp_training_batches FOR SELECT
  TO authenticated
  USING (
    partner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "ECP partners can manage their batches"
  ON public.ecp_training_batches FOR ALL
  TO authenticated
  USING (partner_id = auth.uid())
  WITH CHECK (partner_id = auth.uid());

CREATE POLICY "ECP partners can view their trainees"
  ON public.ecp_trainees FOR SELECT
  TO authenticated
  USING (
    partner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "ECP partners can manage their trainees"
  ON public.ecp_trainees FOR ALL
  TO authenticated
  USING (partner_id = auth.uid())
  WITH CHECK (partner_id = auth.uid());

CREATE POLICY "ECP partners can view their voucher allocations"
  ON public.ecp_voucher_allocations FOR SELECT
  TO authenticated
  USING (
    partner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "ECP partners can view their metrics"
  ON public.ecp_performance_metrics FOR SELECT
  TO authenticated
  USING (
    partner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Admin policies
CREATE POLICY "Admins can manage all ECP trainers"
  ON public.ecp_trainers FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can manage all ECP batches"
  ON public.ecp_training_batches FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can manage all ECP trainees"
  ON public.ecp_trainees FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can manage voucher allocations"
  ON public.ecp_voucher_allocations FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can manage ECP metrics"
  ON public.ecp_performance_metrics FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- =============================================================================
-- TRIGGERS
-- =============================================================================

DROP TRIGGER IF EXISTS update_ecp_trainers_updated_at ON public.ecp_trainers;
CREATE TRIGGER update_ecp_trainers_updated_at
  BEFORE UPDATE ON public.ecp_trainers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ecp_training_batches_updated_at ON public.ecp_training_batches;
CREATE TRIGGER update_ecp_training_batches_updated_at
  BEFORE UPDATE ON public.ecp_training_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ecp_trainees_updated_at ON public.ecp_trainees;
CREATE TRIGGER update_ecp_trainees_updated_at
  BEFORE UPDATE ON public.ecp_trainees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ecp_voucher_allocations_updated_at ON public.ecp_voucher_allocations;
CREATE TRIGGER update_ecp_voucher_allocations_updated_at
  BEFORE UPDATE ON public.ecp_voucher_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Generate unique batch code
CREATE OR REPLACE FUNCTION generate_batch_code(p_partner_id UUID, p_certification_type certification_type)
RETURNS TEXT AS $$
DECLARE
  v_partner_code TEXT;
  v_sequence INTEGER;
  v_year TEXT;
BEGIN
  -- Get partner company initials or first 3 chars
  SELECT UPPER(SUBSTRING(COALESCE(company_name, 'ECP') FROM 1 FOR 3))
  INTO v_partner_code
  FROM public.users WHERE id = p_partner_id;

  -- Get current year
  v_year := TO_CHAR(NOW(), 'YY');

  -- Get next sequence for this partner
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(batch_code FROM LENGTH(batch_code) - 2) AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM public.ecp_training_batches
  WHERE partner_id = p_partner_id
    AND batch_code LIKE v_partner_code || '-' || p_certification_type || '-' || v_year || '-%';

  RETURN v_partner_code || '-' || p_certification_type || '-' || v_year || '-' || LPAD(v_sequence::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Get ECP partner dashboard stats
CREATE OR REPLACE FUNCTION get_ecp_dashboard_stats(p_partner_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_trainees', (SELECT COUNT(*) FROM public.ecp_trainees WHERE partner_id = p_partner_id),
    'active_trainees', (SELECT COUNT(*) FROM public.ecp_trainees WHERE partner_id = p_partner_id AND enrollment_status IN ('enrolled', 'attending')),
    'certified_trainees', (SELECT COUNT(*) FROM public.ecp_trainees WHERE partner_id = p_partner_id AND certified = true),
    'total_batches', (SELECT COUNT(*) FROM public.ecp_training_batches WHERE partner_id = p_partner_id),
    'active_batches', (SELECT COUNT(*) FROM public.ecp_training_batches WHERE partner_id = p_partner_id AND status IN ('scheduled', 'in_progress')),
    'total_trainers', (SELECT COUNT(*) FROM public.ecp_trainers WHERE partner_id = p_partner_id),
    'active_trainers', (SELECT COUNT(*) FROM public.ecp_trainers WHERE partner_id = p_partner_id AND is_active = true AND status = 'approved'),
    'vouchers_available', (SELECT COALESCE(SUM(vouchers_remaining), 0) FROM public.ecp_voucher_allocations WHERE partner_id = p_partner_id AND status = 'active'),
    'pass_rate', (
      SELECT CASE
        WHEN COUNT(*) FILTER (WHERE exam_passed IS NOT NULL) > 0
        THEN ROUND(COUNT(*) FILTER (WHERE exam_passed = true)::DECIMAL / COUNT(*) FILTER (WHERE exam_passed IS NOT NULL) * 100, 1)
        ELSE NULL
      END
      FROM public.ecp_trainees WHERE partner_id = p_partner_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT '✅ ECP system created successfully!' as status;
