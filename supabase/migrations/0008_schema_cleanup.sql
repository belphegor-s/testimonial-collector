-- Schema cleanup: remove unused / redundant columns

-- profiles.email: inserted by trigger but never read by the application.
-- All user identity is resolved via auth.users directly.
alter table public.profiles drop column if exists email;

-- custom_domains.user_id: redundant since organization_id is now the
-- authoritative ownership reference. Make nullable to allow future
-- inserts that only set organization_id.
alter table public.custom_domains alter column user_id drop not null;
