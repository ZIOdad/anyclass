-- 역할: 임차인이 기본이고 임대인은 관리자가 대시보드에서 직접 지정한다.
alter table public.profiles
  add column role text not null default 'tenant'
  check (role in ('tenant', 'landlord'));

-- 사용자가 스스로 역할을 바꾸지 못하도록 수정 가능한 열을 표시 이름으로 한정한다.
revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;

-- 정책 안에서 호출하는 역할 확인. profiles 정책과 순환하지 않도록 security definer로 둔다.
create function public.is_landlord()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'landlord'
  );
$$;

revoke execute on function public.is_landlord() from public, anon;
grant execute on function public.is_landlord() to authenticated;

-- 민원: 분류 세 값이 null이면 "분류 안 됨"이다.
create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  problem_type text check (problem_type in ('누수', '난방·온수', '전기', '곰팡이', '배수', '도어락·창호', '기타')),
  facility text check (facility in ('욕실', '주방', '보일러·온수기', '현관·도어락', '창문', '거실·방', '공용부', '기타·불명')),
  urgency text check (urgency in ('긴급', '보통', '낮음')),
  needs_review boolean not null default true,
  multiple_issues boolean not null default false,
  classifier text not null,
  created_at timestamptz not null default now()
);

create index complaints_reporter_id_idx on public.complaints (reporter_id);

alter table public.complaints enable row level security;

revoke all on public.complaints from anon;
grant select, insert, delete on public.complaints to authenticated;

create policy "complaints_insert_own"
  on public.complaints for insert
  to authenticated
  with check ((select auth.uid()) = reporter_id);

create policy "complaints_select_own"
  on public.complaints for select
  to authenticated
  using ((select auth.uid()) = reporter_id);

create policy "complaints_select_landlord"
  on public.complaints for select
  to authenticated
  using ((select public.is_landlord()));

create policy "complaints_delete_landlord"
  on public.complaints for delete
  to authenticated
  using ((select public.is_landlord()));
