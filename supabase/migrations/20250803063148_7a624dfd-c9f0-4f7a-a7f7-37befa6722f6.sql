-- Create a function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Update existing user to admin (replace with an actual email from your users)
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'praveenchintuyt@gmail.com';

-- Add RLS policy for admins to view all user progress
CREATE POLICY "Admins can view all user progress for analytics"
ON public.user_progress
FOR SELECT
TO authenticated
USING (public.is_admin());