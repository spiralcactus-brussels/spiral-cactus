-- SpiralCactus administration: run in Supabase SQL Editor after creating your project.
-- This migration does not affect the existing Pages CMS or GitHub JSON files.
create table if not exists public.sc_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null default 'editor' check (role in ('owner','editor')),
 created_at timestamptz not null default now()
);
alter table public.sc_admins enable row level security;
revoke all on public.sc_admins from anon;
grant select on public.sc_admins to authenticated;
drop policy if exists "Members can see their own membership" on public.sc_admins;
create policy "Members can see their own membership"
 on public.sc_admins for select to authenticated
 using ((select auth.uid())=user_id);

create table if not exists public.sc_gallery_photos (
 id uuid primary key default gen_random_uuid(),
 event_id text not null,
 image_url text not null check (image_url like 'https://res.cloudinary.com/%'),
 cloudinary_public_id text not null unique,
 caption_en text not null default '',
 caption_fr text not null default '',
 caption_nl text not null default '',
 width integer,
 height integer,
 bytes bigint,
 status text not null default 'draft' check (status in ('draft','published')),
 sort_order integer not null default 0,
 uploader_id uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now()
);
create index if not exists sc_gallery_event_idx on public.sc_gallery_photos (event_id,created_at desc);
create index if not exists sc_gallery_published_idx on public.sc_gallery_photos (status,created_at desc);
alter table public.sc_gallery_photos enable row level security;
grant select on public.sc_gallery_photos to anon,authenticated;
grant insert,update,delete on public.sc_gallery_photos to authenticated;
drop policy if exists "Anyone reads published gallery photos" on public.sc_gallery_photos;
create policy "Anyone reads published gallery photos" on public.sc_gallery_photos
 for select to anon,authenticated using (status='published');
drop policy if exists "Admins read their draft photos" on public.sc_gallery_photos;
create policy "Admins read their draft photos" on public.sc_gallery_photos
 for select to authenticated using (
   exists(select 1 from public.sc_admins a where a.user_id=(select auth.uid()))
 );
drop policy if exists "Admins upload photos" on public.sc_gallery_photos;
create policy "Admins upload photos" on public.sc_gallery_photos
 for insert to authenticated with check (
   exists(select 1 from public.sc_admins a where a.user_id=(select auth.uid()))
   and uploader_id=(select auth.uid())
 );
drop policy if exists "Admins modify photos" on public.sc_gallery_photos;
create policy "Admins modify photos" on public.sc_gallery_photos
 for update to authenticated using (
   exists(select 1 from public.sc_admins a where a.user_id=(select auth.uid()))
 ) with check (
   exists(select 1 from public.sc_admins a where a.user_id=(select auth.uid()))
 );
drop policy if exists "Admins remove photo records" on public.sc_gallery_photos;
create policy "Admins remove photo records" on public.sc_gallery_photos
 for delete to authenticated using (
   exists(select 1 from public.sc_admins a where a.user_id=(select auth.uid()))
 );
-- IMPORTANT: after inviting an admin account in Supabase Authentication,
-- copy the user's UUID and run (only in the secure SQL Editor):
-- insert into public.sc_admins(user_id,role) values ('USER_UUID_HERE','owner')
-- on conflict (user_id) do update set role=excluded.role;
-- Never add user UUIDs or private keys to browser-side configuration.
