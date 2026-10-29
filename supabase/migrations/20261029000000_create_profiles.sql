-- 프로필: Auth 사용자와 1:1, 본인만 읽고 수정한다.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text
);

alter table public.profiles enable row level security;

grant select, update on public.profiles to authenticated;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 가입 시 프로필 행을 만든다. 실패하면 가입이 막히므로 단순하게 유지한다.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
