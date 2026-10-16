-- SpiralCactus member profiles
-- Run once in your Supabase project: SQL Editor > New query > Run.
-- NEVER put service_role keys or database passwords in the GitHub repository.
create table if not exists public.member_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  newsletter_opt_in boolean not null default false,
  newsletter_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.member_profiles enable row level security;
revoke all on public.member_profiles from anon;
revoke all on public.member_profiles from authenticated;
grant usage on schema public to authenticated;
grant select on public.member_profiles to authenticated;
grant update (display_name, newsletter_opt_in) on public.member_profiles to authenticated;

drop policy if exists "Member can view own profile" on public.member_profiles;
create policy "Member can view own profile" on public.member_profiles
 for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "Member can update own preferences" on public.member_profiles;
create policy "Member can update own preferences" on public.member_profiles
 for update to authenticated using ((select auth.uid()) = id)
 with check ((select auth.uid()) = id);

create or replace function public.sc_create_profile()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.member_profiles (id, display_name, newsletter_opt_in, newsletter_consent_at)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 60),
    coalesce((new.raw_user_meta_data ->> 'newsletter_opt_in')::boolean, false),
    case when coalesce((new.raw_user_meta_data ->> 'newsletter_opt_in')::boolean, false) then now() else null end
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists sc_new_auth_user on auth.users;
create trigger sc_new_auth_user after insert on auth.users
for each row execute procedure public.sc_create_profile();

create or replace function public.sc_profile_updated()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.newsletter_opt_in is distinct from old.newsletter_opt_in then
    new.newsletter_consent_at := case when new.newsletter_opt_in then now() else null end;
  end if;
  return new;
end; $$;

drop trigger if exists sc_profile_updated on public.member_profiles;
create trigger sc_profile_updated before update on public.member_profiles
for each row execute procedure public.sc_profile_updated();
