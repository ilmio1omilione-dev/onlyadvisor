-- Fix permissive RLS policy for platform_links INSERT
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can add platform links" ON public.platform_links;

-- Create a more restrictive policy that checks if user owns the creator
CREATE POLICY "Users can add platform links to their creators"
  ON public.platform_links FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.creators 
      WHERE id = creator_id 
      AND added_by_user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );