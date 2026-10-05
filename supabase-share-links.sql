begin;

create table if not exists public.shared_houses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  house_name text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint shared_houses_payload_size check (octet_length(payload::text) <= 200000)
);

alter table public.shared_houses enable row level security;

revoke all on table public.shared_houses from anon, authenticated;
grant select, insert, delete on table public.shared_houses to authenticated;

create policy "Owners can list their shares"
  on public.shared_houses for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "Owners can create shares"
  on public.shared_houses for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Owners can delete their shares"
  on public.shared_houses for delete to authenticated
  using (owner_id = (select auth.uid()));

create or replace function public.get_shared_house(share_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select payload from public.shared_houses where id = share_id;
$$;

revoke all on function public.get_shared_house(uuid) from public, anon, authenticated;
grant execute on function public.get_shared_house(uuid) to anon, authenticated;

commit;
