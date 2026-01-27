-- Drop and recreate the INSERT policy with a more permissive check
DROP POLICY IF EXISTS "Authenticated users can add creators" ON public.creators;

-- Create policy that checks auth.uid() is not null AND matches added_by_user_id
CREATE POLICY "Authenticated users can add creators"
ON public.creators
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND added_by_user_id = auth.uid()
);

-- Also ensure the anon role cannot insert
REVOKE INSERT ON public.creators FROM anon;