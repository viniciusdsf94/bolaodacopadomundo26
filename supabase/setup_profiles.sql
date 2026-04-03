-- This script sets up the profiles table and related functions
-- Execute this in the Supabase SQL Editor

-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated, anon
  USING (auth.uid() = id OR auth.uid() IS NULL);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated, anon
  USING (auth.uid() = id OR auth.uid() IS NULL)
  WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated, anon
  WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (NEW.id, '', '')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
