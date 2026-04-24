-- Required when using NEXT_PUBLIC_SUPABASE_ANON_KEY from API routes (RLS applies).
-- Run in Supabase SQL editor after 001_init.sql.

drop policy if exists "generated_emojis_select_anon" on public.generated_emojis;
drop policy if exists "generated_emojis_insert_anon" on public.generated_emojis;
drop policy if exists "emoji_likes_select_anon" on public.emoji_likes;
drop policy if exists "emoji_likes_insert_anon" on public.emoji_likes;
drop policy if exists "emoji_likes_delete_anon" on public.emoji_likes;

create policy "generated_emojis_select_anon"
  on public.generated_emojis for select
  to anon, authenticated
  using (true);

create policy "generated_emojis_insert_anon"
  on public.generated_emojis for insert
  to anon, authenticated
  with check (true);

create policy "emoji_likes_select_anon"
  on public.emoji_likes for select
  to anon, authenticated
  using (true);

create policy "emoji_likes_insert_anon"
  on public.emoji_likes for insert
  to anon, authenticated
  with check (true);

create policy "emoji_likes_delete_anon"
  on public.emoji_likes for delete
  to anon, authenticated
  using (true);
