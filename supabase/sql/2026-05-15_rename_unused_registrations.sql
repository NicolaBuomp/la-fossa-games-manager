do $$
begin
  if to_regclass('public.registrations') is not null
     and to_regclass('public.registrations_legacy_backup') is null then
    alter table public.registrations rename to registrations_legacy_backup;
  end if;
end $$;
