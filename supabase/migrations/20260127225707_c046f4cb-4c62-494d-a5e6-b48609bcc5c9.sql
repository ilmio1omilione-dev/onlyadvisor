-- Fix INSERT policy for creators table to ensure user can only insert for themselves
DROP POLICY IF EXISTS "Authenticated users can add creators" ON public.creators;

CREATE POLICY "Authenticated users can add creators"
ON public.creators
FOR INSERT
TO authenticated
WITH CHECK (added_by_user_id = auth.uid());