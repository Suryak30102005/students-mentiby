-- Create an admin user profile (they'll need to sign up first with this email)
-- Update a specific user to admin role (replace with actual admin email)
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@mentiby.com';

-- Insert admin profile if doesn't exist
INSERT INTO profiles (user_id, name, email, role, cohort)
SELECT 
  gen_random_uuid(), 
  'System Admin', 
  'admin@mentiby.com', 
  'admin'::user_role,
  'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE email = 'admin@mentiby.com'
);

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

-- Update RLS policies for admin access
-- Allow admins to view all user progress for analytics
CREATE POLICY "Admins can view all user progress"
ON public.user_progress
FOR SELECT
TO authenticated
USING (public.is_admin());