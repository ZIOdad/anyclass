-- 관리자 역할 추가. 관리자는 가입 후 대시보드에서 직접 지정한다.
alter table public.profiles
  drop constraint if exists profiles_role_check,
  add constraint profiles_role_check check (role in ('tenant', 'landlord', 'admin'));

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 물건과 사용자 연결. 한 물건에 여러 명, 한 사용자가 여러 물건에 연결될 수 있다.
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  address text check (address is null or char_length(address) <= 200),
  created_at timestamptz not null default now()
);

create table public.property_members (
  property_id uuid not null references public.properties (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (property_id, user_id)
);

create index property_members_user_id_idx on public.property_members (user_id);

alter table public.properties enable row level security;
alter table public.property_members enable row level security;

revoke all on public.properties, public.property_members from anon;
grant select, insert, delete on public.properties, public.property_members to authenticated;

create policy "properties_select_member"
  on public.properties for select
  to authenticated
  using (
    id in (
      select pm.property_id from public.property_members pm
      where pm.user_id = (select auth.uid())
    )
  );

create policy "properties_select_admin"
  on public.properties for select
  to authenticated
  using ((select public.is_admin()));

create policy "properties_insert_admin"
  on public.properties for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "properties_delete_admin"
  on public.properties for delete
  to authenticated
  using ((select public.is_admin()));

create policy "property_members_select_own"
  on public.property_members for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "property_members_select_admin"
  on public.property_members for select
  to authenticated
  using ((select public.is_admin()));

create policy "property_members_insert_admin"
  on public.property_members for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "property_members_delete_admin"
  on public.property_members for delete
  to authenticated
  using ((select public.is_admin()));

-- 사용자 목록과 역할 지정은 auth.users와 profiles.role을 건드리므로 관리자만 부르는 함수로 둔다.
create function public.admin_list_users()
returns table (id uuid, email text, display_name text, role text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, u.email::text, p.display_name, p.role
  from public.profiles p
  join auth.users u on u.id = p.id
  where (select public.is_admin())
  order by u.email;
$$;

create function public.admin_set_role(target uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if new_role not in ('tenant', 'landlord') then
    raise exception 'invalid role' using errcode = '22023';
  end if;
  -- 관리자 계정의 역할은 이 함수로 바꾸지 않는다.
  update public.profiles set role = new_role where id = target and role <> 'admin';
end;
$$;

revoke execute on function public.admin_list_users() from public, anon;
revoke execute on function public.admin_set_role(uuid, text) from public, anon;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_role(uuid, text) to authenticated;

-- 민원은 접수한 임차인의 물건에 붙는다. 이전에 접수된 건은 물건이 없다(null).
alter table public.complaints
  add column property_id uuid references public.properties (id) on delete set null;

create index complaints_property_id_idx on public.complaints (property_id);

-- 접수: 본인 명의이면서 본인이 연결된 물건에만 접수할 수 있다.
drop policy "complaints_insert_own" on public.complaints;
create policy "complaints_insert_own"
  on public.complaints for insert
  to authenticated
  with check (
    (select auth.uid()) = reporter_id
    and property_id in (
      select pm.property_id from public.property_members pm
      where pm.user_id = (select auth.uid())
    )
  );

-- 임대인은 자기 물건의 민원만 보고, 처리하고, 지운다.
drop policy "complaints_select_landlord" on public.complaints;
drop policy "complaints_delete_landlord" on public.complaints;
drop policy "complaints_update_landlord" on public.complaints;

create policy "complaints_select_landlord"
  on public.complaints for select
  to authenticated
  using (
    (select public.is_landlord())
    and property_id in (
      select pm.property_id from public.property_members pm
      where pm.user_id = (select auth.uid())
    )
  );

create policy "complaints_update_landlord"
  on public.complaints for update
  to authenticated
  using (
    (select public.is_landlord())
    and property_id in (
      select pm.property_id from public.property_members pm
      where pm.user_id = (select auth.uid())
    )
  )
  with check (
    (select public.is_landlord())
    and property_id in (
      select pm.property_id from public.property_members pm
      where pm.user_id = (select auth.uid())
    )
  );

create policy "complaints_delete_landlord"
  on public.complaints for delete
  to authenticated
  using (
    (select public.is_landlord())
    and property_id in (
      select pm.property_id from public.property_members pm
      where pm.user_id = (select auth.uid())
    )
  );
