-- Drop the restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Anyone can view active creators" ON public.creators;

CREATE POLICY "Anyone can view active creators"
  ON public.creators
  FOR SELECT
  TO anon, authenticated
  USING (
    (status = 'active'::creator_status) 
    OR 
    ((auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'admin'::app_role))
  );