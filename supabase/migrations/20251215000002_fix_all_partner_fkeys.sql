-- Fix all ECP/PDP tables to reference partners table instead of users table
-- This migration corrects the foreign key constraints after introducing the separate partners table

-- =============================================================================
-- Clean up orphaned partner_id records first
-- =============================================================================

-- Delete orphaned records from all tables before adding foreign key constraints
DELETE FROM public.pdp_partner_profiles WHERE partner_id NOT IN (SELECT id FROM public.partners);
DELETE FROM public.ecp_voucher_allocations WHERE partner_id NOT IN (SELECT id FROM public.partners);
DELETE FROM public.ecp_vouchers WHERE partner_id NOT IN (SELECT id FROM public.partners);
DELETE FROM public.ecp_voucher_requests WHERE partner_id NOT IN (SELECT id FROM public.partners);
DELETE FROM public.ecp_licenses WHERE partner_id NOT IN (SELECT id FROM public.partners);
DELETE FROM public.ecp_license_requests WHERE partner_id NOT IN (SELECT id FROM public.partners);
DELETE FROM public.ecp_trainers WHERE partner_id NOT IN (SELECT id FROM public.partners);
DELETE FROM public.ecp_training_batches WHERE partner_id NOT IN (SELECT id FROM public.partners);
DELETE FROM public.ecp_trainees WHERE partner_id NOT IN (SELECT id FROM public.partners);
DELETE FROM public.ecp_performance_metrics WHERE partner_id NOT IN (SELECT id FROM public.partners);
DELETE FROM public.pdp_licenses WHERE partner_id NOT IN (SELECT id FROM public.partners);
DELETE FROM public.pdp_license_requests WHERE partner_id NOT IN (SELECT id FROM public.partners);
DELETE FROM public.pdp_annual_reports WHERE partner_id NOT IN (SELECT id FROM public.partners);

-- =============================================================================
-- ECP Tables
-- =============================================================================

-- ecp_voucher_allocations
ALTER TABLE public.ecp_voucher_allocations
  DROP CONSTRAINT IF EXISTS ecp_voucher_allocations_partner_id_fkey;

ALTER TABLE public.ecp_voucher_allocations
  ADD CONSTRAINT ecp_voucher_allocations_partner_id_fkey
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;

-- ecp_vouchers
ALTER TABLE public.ecp_vouchers
  DROP CONSTRAINT IF EXISTS ecp_vouchers_partner_id_fkey;

ALTER TABLE public.ecp_vouchers
  ADD CONSTRAINT ecp_vouchers_partner_id_fkey
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;

-- ecp_voucher_requests
ALTER TABLE public.ecp_voucher_requests
  DROP CONSTRAINT IF EXISTS ecp_voucher_requests_partner_id_fkey;

ALTER TABLE public.ecp_voucher_requests
  ADD CONSTRAINT ecp_voucher_requests_partner_id_fkey
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;

-- ecp_licenses
ALTER TABLE public.ecp_licenses
  DROP CONSTRAINT IF EXISTS ecp_licenses_partner_id_fkey;

ALTER TABLE public.ecp_licenses
  ADD CONSTRAINT ecp_licenses_partner_id_fkey
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;

-- ecp_license_requests
ALTER TABLE public.ecp_license_requests
  DROP CONSTRAINT IF EXISTS ecp_license_requests_partner_id_fkey;

ALTER TABLE public.ecp_license_requests
  ADD CONSTRAINT ecp_license_requests_partner_id_fkey
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;

-- ecp_trainers
ALTER TABLE public.ecp_trainers
  DROP CONSTRAINT IF EXISTS ecp_trainers_partner_id_fkey;

ALTER TABLE public.ecp_trainers
  ADD CONSTRAINT ecp_trainers_partner_id_fkey
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;

-- ecp_training_batches
ALTER TABLE public.ecp_training_batches
  DROP CONSTRAINT IF EXISTS ecp_training_batches_partner_id_fkey;

ALTER TABLE public.ecp_training_batches
  ADD CONSTRAINT ecp_training_batches_partner_id_fkey
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;

-- ecp_trainees
ALTER TABLE public.ecp_trainees
  DROP CONSTRAINT IF EXISTS ecp_trainees_partner_id_fkey;

ALTER TABLE public.ecp_trainees
  ADD CONSTRAINT ecp_trainees_partner_id_fkey
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;

-- ecp_performance_metrics
ALTER TABLE public.ecp_performance_metrics
  DROP CONSTRAINT IF EXISTS ecp_performance_metrics_partner_id_fkey;

ALTER TABLE public.ecp_performance_metrics
  ADD CONSTRAINT ecp_performance_metrics_partner_id_fkey
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;

-- =============================================================================
-- PDP Tables
-- =============================================================================

-- pdp_licenses
ALTER TABLE public.pdp_licenses
  DROP CONSTRAINT IF EXISTS pdp_licenses_partner_id_fkey;

ALTER TABLE public.pdp_licenses
  ADD CONSTRAINT pdp_licenses_partner_id_fkey
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;

-- pdp_license_requests
ALTER TABLE public.pdp_license_requests
  DROP CONSTRAINT IF EXISTS pdp_license_requests_partner_id_fkey;

ALTER TABLE public.pdp_license_requests
  ADD CONSTRAINT pdp_license_requests_partner_id_fkey
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;

-- pdp_partner_profiles
ALTER TABLE public.pdp_partner_profiles
  DROP CONSTRAINT IF EXISTS pdp_partner_profiles_partner_id_fkey;

ALTER TABLE public.pdp_partner_profiles
  ADD CONSTRAINT pdp_partner_profiles_partner_id_fkey
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;

-- pdp_annual_reports
ALTER TABLE public.pdp_annual_reports
  DROP CONSTRAINT IF EXISTS pdp_annual_reports_partner_id_fkey;

ALTER TABLE public.pdp_annual_reports
  ADD CONSTRAINT pdp_annual_reports_partner_id_fkey
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;
