begin;

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.planner_documents (
  id uuid primary key,
  payload jsonb not null,
  write_hash bytea not null,
  updated_at timestamptz not null default now(),
  constraint planner_payload_format check (
    jsonb_typeof(payload) = 'object'
    and payload ? 'iv' and payload ? 'data'
    and jsonb_typeof(payload->'iv') = 'string'
    and jsonb_typeof(payload->'data') = 'string'
    and octet_length(payload::text) <= 1000000
  )
);

alter table public.planner_documents enable row level security;
revoke all on public.planner_documents from anon, authenticated;

create or replace function public.get_planner_document(document_id uuid)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select payload from public.planner_documents where id = document_id;
$$;

create or replace function public.save_planner_document(document_id uuid, document_payload jsonb, write_secret text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare saved_id uuid;
begin
  if length(write_secret) != 43 or write_secret !~ '^[A-Za-z0-9_-]+$' then
    return false;
  end if;
  insert into public.planner_documents (id, payload, write_hash)
  values (document_id, document_payload, extensions.digest(convert_to(write_secret, 'UTF8'), 'sha256'))
  on conflict (id) do update set payload = excluded.payload, updated_at = now()
    where public.planner_documents.write_hash = excluded.write_hash
  returning id into saved_id;
  return saved_id is not null;
end;
$$;

revoke all on function public.get_planner_document(uuid) from public, anon, authenticated;
revoke all on function public.save_planner_document(uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.get_planner_document(uuid) to anon, authenticated;
grant execute on function public.save_planner_document(uuid, jsonb, text) to anon, authenticated;

do $$
begin
  if to_regclass('public.shared_houses') is not null then
    execute 'revoke all on public.shared_houses from anon, authenticated';
  end if;
  if to_regprocedure('public.get_shared_house(uuid)') is not null then
    execute 'revoke all on function public.get_shared_house(uuid) from public, anon, authenticated';
  end if;
end;
$$;

commit;
