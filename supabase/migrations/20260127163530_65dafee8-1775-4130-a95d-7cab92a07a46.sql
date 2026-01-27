-- Simplify the INSERT policy - just require authenticated user
DROP POLICY IF EXISTS "Authenticated users can add creators" ON public.creators;

CREATE POLICY "Authenticated users can add creators"
ON public.creators
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);