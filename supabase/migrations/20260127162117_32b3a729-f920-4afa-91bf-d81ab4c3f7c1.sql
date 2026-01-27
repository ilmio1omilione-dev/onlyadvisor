-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can add creators" ON public.creators;

-- Recreate as PERMISSIVE policy (default)
CREATE POLICY "Authenticated users can add creators"
ON public.creators
FOR INSERT
TO authenticated
WITH CHECK (added_by_user_id = auth.uid());