-- =============================================
-- FIX SCHEMA - Update profiles table structure
-- =============================================

-- Add role and status columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('user', 'admin'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
    ALTER TABLE public.profiles ADD COLUMN status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'banned'));
  END IF;
END $$;

-- Migrate existing data
UPDATE public.profiles SET role = 'admin' WHERE is_admin = true AND role IS NULL;
UPDATE public.profiles SET role = 'user' WHERE is_admin = false AND role IS NULL;
UPDATE public.profiles SET status = 'banned' WHERE is_banned = true AND status IS NULL;
UPDATE public.profiles SET status = 'approved' WHERE is_approved = true AND is_banned = false AND status IS NULL;
UPDATE public.profiles SET status = 'pending' WHERE status IS NULL;

-- Add type column to updates table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'updates' AND column_name = 'type') THEN
    ALTER TABLE public.updates ADD COLUMN type text DEFAULT 'announcement' CHECK (type IN ('announcement', 'feature', 'bugfix', 'improvement'));
  END IF;
END $$;

-- Fix audit_log table to have user_id instead of admin_id
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_log' AND column_name = 'user_id') THEN
    ALTER TABLE public.audit_log ADD COLUMN user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update download_links to not require title (use version as identifier)
ALTER TABLE public.download_links ALTER COLUMN title DROP NOT NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Drop and recreate RLS policies for profiles with new columns
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (
    auth.uid() = id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin" ON public.profiles 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Fix chat messages policies
DROP POLICY IF EXISTS "chat_messages_select_approved" ON public.chat_messages;
CREATE POLICY "chat_messages_select_approved" ON public.chat_messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND status = 'approved'
    )
  );

DROP POLICY IF EXISTS "chat_messages_insert_approved" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_approved" ON public.chat_messages 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND status = 'approved'
    )
  );

DROP POLICY IF EXISTS "chat_messages_update_own_or_admin" ON public.chat_messages;
CREATE POLICY "chat_messages_update_own_or_admin" ON public.chat_messages 
  FOR UPDATE USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "chat_messages_delete_admin" ON public.chat_messages;
CREATE POLICY "chat_messages_delete_admin" ON public.chat_messages 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Fix direct messages policies
DROP POLICY IF EXISTS "dm_select_participant" ON public.direct_messages;
CREATE POLICY "dm_select_participant" ON public.direct_messages 
  FOR SELECT USING (
    (auth.uid() = sender_id OR auth.uid() = receiver_id)
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND status = 'approved'
    )
  );

DROP POLICY IF EXISTS "dm_select_admin" ON public.direct_messages;
CREATE POLICY "dm_select_admin" ON public.direct_messages 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "dm_insert_approved" ON public.direct_messages;
CREATE POLICY "dm_insert_approved" ON public.direct_messages 
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND status = 'approved'
    )
  );

DROP POLICY IF EXISTS "dm_update_participant" ON public.direct_messages;
CREATE POLICY "dm_update_participant" ON public.direct_messages 
  FOR UPDATE USING (
    auth.uid() = sender_id 
    OR auth.uid() = receiver_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "dm_delete_admin" ON public.direct_messages;
CREATE POLICY "dm_delete_admin" ON public.direct_messages 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Fix download links policies
DROP POLICY IF EXISTS "download_links_select_approved" ON public.download_links;
CREATE POLICY "download_links_select_approved" ON public.download_links 
  FOR SELECT USING (
    is_active = true 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND status = 'approved'
    )
  );

DROP POLICY IF EXISTS "download_links_select_admin" ON public.download_links;
CREATE POLICY "download_links_select_admin" ON public.download_links 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "download_links_insert_admin" ON public.download_links;
CREATE POLICY "download_links_insert_admin" ON public.download_links 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "download_links_update_admin" ON public.download_links;
CREATE POLICY "download_links_update_admin" ON public.download_links 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "download_links_delete_admin" ON public.download_links;
CREATE POLICY "download_links_delete_admin" ON public.download_links 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Fix updates policies
DROP POLICY IF EXISTS "updates_insert_admin" ON public.updates;
CREATE POLICY "updates_insert_admin" ON public.updates 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "updates_update_admin" ON public.updates;
CREATE POLICY "updates_update_admin" ON public.updates 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "updates_delete_admin" ON public.updates;
CREATE POLICY "updates_delete_admin" ON public.updates 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Fix audit log policies
DROP POLICY IF EXISTS "audit_select_admin" ON public.audit_log;
CREATE POLICY "audit_select_admin" ON public.audit_log 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "audit_insert_admin" ON public.audit_log;
CREATE POLICY "audit_insert_admin" ON public.audit_log 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Update trigger to use new columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role, status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data ->> 'role', 'user'),
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;
