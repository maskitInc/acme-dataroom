-- Acme Data Room: rooms, nodes, PDF text index, storage
-- Auth-scoped via owner_id + RLS

create extension if not exists "pgcrypto";

create table public.datarooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index datarooms_owner_created_idx on public.datarooms (owner_id, created_at desc);

create table public.nodes (
  id uuid primary key default gen_random_uuid(),
  dataroom_id uuid not null references public.datarooms (id) on delete cascade,
  parent_id uuid references public.nodes (id) on delete cascade,
  type text not null check (type in ('folder', 'file')),
  name text not null check (char_length(trim(name)) > 0),
  mime_type text,
  size bigint,
  storage_path text,
  has_text_index boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index nodes_room_parent_idx on public.nodes (dataroom_id, parent_id);
create index nodes_room_idx on public.nodes (dataroom_id);

create table public.file_texts (
  node_id uuid primary key references public.nodes (id) on delete cascade,
  text text not null
);

alter table public.datarooms enable row level security;
alter table public.nodes enable row level security;
alter table public.file_texts enable row level security;

create or replace function public.is_room_owner(room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.datarooms d
    where d.id = room_id and d.owner_id = auth.uid()
  );
$$;

create policy datarooms_select on public.datarooms
  for select using (owner_id = auth.uid());
create policy datarooms_insert on public.datarooms
  for insert with check (owner_id = auth.uid());
create policy datarooms_update on public.datarooms
  for update using (owner_id = auth.uid());
create policy datarooms_delete on public.datarooms
  for delete using (owner_id = auth.uid());

create policy nodes_select on public.nodes
  for select using (public.is_room_owner(dataroom_id));
create policy nodes_insert on public.nodes
  for insert with check (public.is_room_owner(dataroom_id));
create policy nodes_update on public.nodes
  for update using (public.is_room_owner(dataroom_id));
create policy nodes_delete on public.nodes
  for delete using (public.is_room_owner(dataroom_id));

create policy file_texts_select on public.file_texts
  for select using (
    exists (
      select 1 from public.nodes n
      where n.id = node_id and public.is_room_owner(n.dataroom_id)
    )
  );
create policy file_texts_insert on public.file_texts
  for insert with check (
    exists (
      select 1 from public.nodes n
      where n.id = node_id and public.is_room_owner(n.dataroom_id)
    )
  );
create policy file_texts_update on public.file_texts
  for update using (
    exists (
      select 1 from public.nodes n
      where n.id = node_id and public.is_room_owner(n.dataroom_id)
    )
  );
create policy file_texts_delete on public.file_texts
  for delete using (
    exists (
      select 1 from public.nodes n
      where n.id = node_id and public.is_room_owner(n.dataroom_id)
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dataroom-files',
  'dataroom-files',
  false,
  52428800,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path: {user_id}/{dataroom_id}/{node_id}.pdf
create policy storage_dataroom_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'dataroom-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy storage_dataroom_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'dataroom-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy storage_dataroom_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'dataroom-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy storage_dataroom_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'dataroom-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
