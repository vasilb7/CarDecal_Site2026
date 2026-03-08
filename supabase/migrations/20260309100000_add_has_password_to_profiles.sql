-- Migration: Add has_password column to profiles
-- Description: Track if a user has set a manual password (useful for social logins)

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_password BOOLEAN DEFAULT FALSE;

-- Update existing profiles that likely have passwords (email provider)
UPDATE public.profiles p
SET has_password = TRUE
FROM auth.users u
WHERE p.id = u.id 
AND u.encrypted_password IS NOT NULL 
AND u.encrypted_password <> '';

-- Update the handle_new_user function to include has_password
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, phone, has_password)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    NEW.raw_user_meta_data->>'phone',
    (NEW.app_metadata->>'provider' = 'email') -- Set true if signed up via email
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    email = EXCLUDED.email,
    has_password = CASE 
        WHEN profiles.has_password = TRUE THEN TRUE 
        ELSE EXCLUDED.has_password 
    END;
    
  RETURN NEW;
END;
$$;
