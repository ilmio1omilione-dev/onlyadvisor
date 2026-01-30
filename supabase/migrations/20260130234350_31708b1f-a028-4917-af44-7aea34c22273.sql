-- =============================================
-- 1. FIX: Restrict settings table to admins only
-- =============================================
DROP POLICY IF EXISTS "Anyone can read settings" ON public.settings;

CREATE POLICY "Admins can read settings"
  ON public.settings
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 2. FIX: Restrict audit log INSERT to admins only
-- =============================================
DROP POLICY IF EXISTS "System can write audit log" ON public.admin_audit_log;

CREATE POLICY "Admins can write audit log"
  ON public.admin_audit_log
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 3. FIX: Create public view for creators without sensitive fields
-- =============================================
CREATE OR REPLACE VIEW public.public_creators AS
SELECT
  id,
  name,
  slug,
  bio,
  avatar_url,
  cover_image_url,
  category,
  country,
  languages,
  tags,
  rating,
  review_count,
  is_verified,
  is_premium,
  created_at,
  updated_at
FROM public.creators
WHERE status = 'active'::creator_status;

-- Grant access to the view
GRANT SELECT ON public.public_creators TO anon, authenticated;

-- =============================================
-- 4. FIX: Add SELECT policy to public_profiles view
-- =============================================
-- Note: public_profiles is a VIEW, not a table, so it inherits
-- permissions from the underlying table. We need to ensure it's accessible.
-- The view was created with security_invoker = true, so it uses caller's permissions.
-- We just need to grant SELECT on the view itself.
GRANT SELECT ON public.public_profiles TO anon, authenticated;