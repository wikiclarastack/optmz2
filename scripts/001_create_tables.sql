-- =============================================
-- OPTIMIZER PRO - DATABASE SCHEMA
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- PROFILES TABLE (linked to auth.users)
-- =============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  is_admin boolean default false,
  is_approved boolean default false,
  is_banned boolean default false,
  ban_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Profiles RLS Policies
create policy "profiles_select_all" on public.profiles 
  for select using (true);

create policy "profiles_insert_own" on public.profiles 
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles 
  for update using (
    auth.uid() = id 
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "profiles_delete_admin" on public.profiles 
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- =============================================
-- UPDATES TABLE (app updates/changelog)
-- =============================================
create table if not exists public.updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  version text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.updates enable row level security;

-- Updates RLS Policies
create policy "updates_select_all" on public.updates 
  for select using (true);

create policy "updates_insert_admin" on public.updates 
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "updates_update_admin" on public.updates 
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "updates_delete_admin" on public.updates 
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- =============================================
-- CHAT MESSAGES TABLE (general chat)
-- =============================================
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  is_deleted boolean default false,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.chat_messages enable row level security;

-- Chat Messages RLS Policies
create policy "chat_messages_select_approved" on public.chat_messages 
  for select using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and is_approved = true 
      and is_banned = false
    )
  );

create policy "chat_messages_insert_approved" on public.chat_messages 
  for insert with check (
    auth.uid() = user_id 
    and exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and is_approved = true 
      and is_banned = false
    )
  );

create policy "chat_messages_update_own_or_admin" on public.chat_messages 
  for update using (
    auth.uid() = user_id 
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "chat_messages_delete_admin" on public.chat_messages 
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- =============================================
-- DIRECT MESSAGES TABLE
-- =============================================
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  is_read boolean default false,
  is_deleted boolean default false,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.direct_messages enable row level security;

-- Direct Messages RLS Policies
create policy "dm_select_participant" on public.direct_messages 
  for select using (
    (auth.uid() = sender_id or auth.uid() = receiver_id)
    and exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and is_approved = true 
      and is_banned = false
    )
  );

create policy "dm_select_admin" on public.direct_messages 
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "dm_insert_approved" on public.direct_messages 
  for insert with check (
    auth.uid() = sender_id 
    and exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and is_approved = true 
      and is_banned = false
    )
  );

create policy "dm_update_participant" on public.direct_messages 
  for update using (
    auth.uid() = sender_id 
    or auth.uid() = receiver_id
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "dm_delete_admin" on public.direct_messages 
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- =============================================
-- DOWNLOAD LINKS TABLE
-- =============================================
create table if not exists public.download_links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  url text not null,
  version text,
  platform text default 'windows',
  is_active boolean default true,
  download_count integer default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.download_links enable row level security;

-- Download Links RLS Policies
create policy "download_links_select_approved" on public.download_links 
  for select using (
    is_active = true 
    and exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and is_approved = true 
      and is_banned = false
    )
  );

create policy "download_links_select_admin" on public.download_links 
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "download_links_insert_admin" on public.download_links 
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "download_links_update_admin" on public.download_links 
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "download_links_delete_admin" on public.download_links 
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- =============================================
-- PENDING REGISTRATIONS TABLE
-- =============================================
create table if not exists public.pending_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  email text not null,
  username text,
  reason text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

alter table public.pending_registrations enable row level security;

-- Pending Registrations RLS Policies
create policy "pending_select_own" on public.pending_registrations 
  for select using (user_id = auth.uid());

create policy "pending_select_admin" on public.pending_registrations 
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "pending_insert_own" on public.pending_registrations 
  for insert with check (user_id = auth.uid());

create policy "pending_update_admin" on public.pending_registrations 
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "pending_delete_admin" on public.pending_registrations 
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- =============================================
-- AUDIT LOG TABLE (for admin tracking)
-- =============================================
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

alter table public.audit_log enable row level security;

-- Audit Log RLS Policies
create policy "audit_select_admin" on public.audit_log 
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "audit_insert_admin" on public.audit_log 
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, is_admin, is_approved)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'is_admin')::boolean, false),
    false
  )
  on conflict (id) do nothing;

  -- Auto-create pending registration
  insert into public.pending_registrations (user_id, email, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Update timestamp trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at trigger to relevant tables
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

drop trigger if exists updates_updated_at on public.updates;
create trigger updates_updated_at
  before update on public.updates
  for each row
  execute function public.handle_updated_at();

drop trigger if exists download_links_updated_at on public.download_links;
create trigger download_links_updated_at
  before update on public.download_links
  for each row
  execute function public.handle_updated_at();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
create index if not exists idx_profiles_is_admin on public.profiles(is_admin);
create index if not exists idx_profiles_is_approved on public.profiles(is_approved);
create index if not exists idx_profiles_is_banned on public.profiles(is_banned);
create index if not exists idx_chat_messages_user_id on public.chat_messages(user_id);
create index if not exists idx_chat_messages_created_at on public.chat_messages(created_at desc);
create index if not exists idx_dm_sender_id on public.direct_messages(sender_id);
create index if not exists idx_dm_receiver_id on public.direct_messages(receiver_id);
create index if not exists idx_dm_created_at on public.direct_messages(created_at desc);
create index if not exists idx_pending_status on public.pending_registrations(status);
