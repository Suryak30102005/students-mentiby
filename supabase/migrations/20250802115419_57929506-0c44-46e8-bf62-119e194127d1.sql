-- Drop the problematic policies first
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage sheets" ON public.sheets;
DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can view all progress" ON public.user_progress;

-- Create a security definer function to get current user role (prevents recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY definer
STABLE
SET search_path = ''
AS $$
  SELECT role::text FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Recreate the admin policies using the security definer function
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage sheets" 
ON public.sheets 
FOR ALL 
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage questions" 
ON public.questions 
FOR ALL 
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can view all progress" 
ON public.user_progress 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');