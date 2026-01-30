-- =============================================
-- FIX: Restrict audit log INSERT to only admins logging their own actions
-- =============================================
DROP POLICY IF EXISTS "Admins can write audit log" ON public.admin_audit_log;

CREATE POLICY "Admins can write audit log"
  ON public.admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    AND admin_user_id = auth.uid()
  );