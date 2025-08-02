-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('student', 'admin');

-- Create enum for question difficulty
CREATE TYPE public.question_difficulty AS ENUM ('Easy', 'Medium', 'Hard');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  cohort TEXT,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sheets table
CREATE TABLE public.sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  topics TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sheet_id UUID NOT NULL REFERENCES public.sheets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  difficulty question_difficulty NOT NULL,
  solve_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_progress table to track student progress
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  marked_for_revision BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  time_spent INTEGER, -- in minutes
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create RLS policies for sheets (readable by all authenticated users)
CREATE POLICY "Authenticated users can view sheets" 
ON public.sheets 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins can manage sheets" 
ON public.sheets 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create RLS policies for questions (readable by all authenticated users)
CREATE POLICY "Authenticated users can view questions" 
ON public.questions 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins can manage questions" 
ON public.questions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create RLS policies for user_progress
CREATE POLICY "Users can view their own progress" 
ON public.user_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own progress" 
ON public.user_progress 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress" 
ON public.user_progress 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sheets_updated_at
  BEFORE UPDATE ON public.sheets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
-- Sample sheet
INSERT INTO public.sheets (title, description, topics) VALUES 
('DSA Practice Sheet', 'Complete Data Structures and Algorithms practice questions', ARRAY['Array', 'String', 'Stack & Queue', 'Linked List', 'Trees', 'Dynamic Programming']);

-- Sample questions (getting the sheet_id from the inserted sheet)
INSERT INTO public.questions (sheet_id, title, topic, tags, difficulty, solve_url, order_index) 
SELECT 
  s.id,
  'Find the Duplicate Number',
  'Array',
  ARRAY['Array', 'Two Pointers', 'Binary Search'],
  'Medium',
  'https://leetcode.com/problems/find-the-duplicate-number/',
  1
FROM public.sheets s WHERE s.title = 'DSA Practice Sheet';

INSERT INTO public.questions (sheet_id, title, topic, tags, difficulty, solve_url, order_index) 
SELECT 
  s.id,
  'Two Sum',
  'Array',
  ARRAY['Array', 'Hash Table'],
  'Easy',
  'https://leetcode.com/problems/two-sum/',
  2
FROM public.sheets s WHERE s.title = 'DSA Practice Sheet';

INSERT INTO public.questions (sheet_id, title, topic, tags, difficulty, solve_url, order_index) 
SELECT 
  s.id,
  'Valid Parentheses',
  'Stack & Queue',
  ARRAY['String', 'Stack'],
  'Easy',
  'https://leetcode.com/problems/valid-parentheses/',
  3
FROM public.sheets s WHERE s.title = 'DSA Practice Sheet';