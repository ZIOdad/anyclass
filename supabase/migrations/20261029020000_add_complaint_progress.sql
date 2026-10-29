-- 임대인이 민원을 확인한 시각과 해결한 시각. null이면 아직 아니다.
alter table public.complaints
  add column confirmed_at timestamptz,
  add column resolved_at timestamptz,
  add constraint complaints_resolved_after_confirmed
    check (resolved_at is null or confirmed_at is not null);

-- 임대인은 이 두 열만 고칠 수 있다. 접수 내용과 분류는 바꾸지 못한다.
grant update (confirmed_at, resolved_at) on public.complaints to authenticated;

create policy "complaints_update_landlord"
  on public.complaints for update
  to authenticated
  using ((select public.is_landlord()))
  with check ((select public.is_landlord()));
