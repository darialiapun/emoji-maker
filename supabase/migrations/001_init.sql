-- Run this in the Supabase SQL editor (Dashboard → SQL) to create tables.

create table if not exists public.generated_emojis (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  image_url text not null,
  user_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists generated_emojis_created_at_idx
  on public.generated_emojis (created_at desc);

create table if not exists public.emoji_likes (
  emoji_id uuid not null references public.generated_emojis (id) on delete cascade,
  user_id text not null,
  created_at timestamptz not null default now(),
  primary key (emoji_id, user_id)
);

create index if not exists emoji_likes_emoji_id_idx on public.emoji_likes (emoji_id);

alter table public.generated_emojis enable row level security;
alter table public.emoji_likes enable row level security;

-- If you use NEXT_PUBLIC_SUPABASE_ANON_KEY from API routes, apply 002_rls_policies_anon.sql
-- so RLS allows the anon role to read/write these tables.
