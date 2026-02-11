-- Fix: Allow users to also see their own creators (any status) so platform_links INSERT works
DROP POLICY "Anyone can view active creators" ON public.creators;

CREATE POLICY "Anyone can view active creators or own creators" 
ON public.creators 
FOR SELECT 
USING (
  status = 'active' 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR added_by_user_id = auth.uid()
);