-- Add new fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS nickname text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE USING (auth.uid() = user_id);

-- Enforce constraints (optional but good)
-- Nickname length validation is handled in App logic usually, but check constraint is safer
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS nickname_length;
ALTER TABLE profiles ADD CONSTRAINT nickname_length CHECK (char_length(nickname) >= 2 AND char_length(nickname) <= 24);

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS bio_length;
ALTER TABLE profiles ADD CONSTRAINT bio_length CHECK (char_length(bio) <= 140);
