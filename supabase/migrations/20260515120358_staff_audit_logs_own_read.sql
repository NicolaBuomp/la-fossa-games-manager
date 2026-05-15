-- Allow staff users to read their own audit log entries (where they are the author).
-- Admins already have full read access via the existing audit_logs_admin_read policy.
CREATE POLICY audit_logs_own_read ON public.audit_logs
  FOR SELECT USING (changed_by = auth.uid());
