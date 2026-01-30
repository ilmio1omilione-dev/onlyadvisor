-- =============================================
-- FIX: Convert views to SECURITY INVOKER (safer)
-- =============================================

-- Recreate public_creators with security_invoker = true
DROP VIEW IF EXISTS public.public_creators;

CREATE VIEW public.public_creators
WITH (security_invoker = true)
AS
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

-- Recreate public_profiles with security_invoker = true  
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT
  user_id,
  username,
  avatar_url,
  created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;