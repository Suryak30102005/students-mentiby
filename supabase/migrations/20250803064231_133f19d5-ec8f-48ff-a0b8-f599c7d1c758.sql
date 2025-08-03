-- Update the handle_new_user function to automatically make specific emails admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role public.user_role := 'student';
BEGIN
  -- Check if this email should be admin
  IF NEW.email IN ('gopikrishnackofficial@gmail.com', 'praveenchintuyt@gmail.com') THEN
    user_role := 'admin';
  END IF;

  INSERT INTO public.profiles (user_id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email,
    user_role
  );
  RETURN NEW;
END;
$$;

-- Also update existing user if they already exist
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'gopikrishnackofficial@gmail.com';