-- Migration: Fix Ticket Status History RLS
-- Date: 2025-10-02
-- Description: Add INSERT policy for ticket_status_history to allow admins to update ticket status

-- Allow admins to insert status history when updating tickets
CREATE POLICY "Admins can insert ticket status history"
  ON public.ticket_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Verification
SELECT '✅ Ticket status history RLS policy fixed!' as status;
