-- =============================================
-- FIX: Create public view for reviews that excludes user_id
-- Le recensioni pubbliche non devono esporre user_id direttamente
-- =============================================
CREATE OR REPLACE VIEW public.public_reviews
WITH (security_invoker = true)
AS
SELECT
  r.id,
  r.creator_id,
  r.rating,
  r.title,
  r.content,
  r.pros,
  r.cons,
  r.platform,
  r.helpful_count,
  r.language,
  r.created_at,
  r.updated_at,
  -- Esponiamo solo username e avatar dal profilo pubblico, non user_id
  pp.username AS reviewer_username,
  pp.avatar_url AS reviewer_avatar
FROM public.reviews r
LEFT JOIN public.public_profiles pp ON pp.user_id = r.user_id
WHERE r.status = 'approved'::review_status;

-- Grant access to the view
GRANT SELECT ON public.public_reviews TO anon, authenticated;