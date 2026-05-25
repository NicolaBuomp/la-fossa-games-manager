alter table public.sponsors
  drop constraint if exists sponsors_category_check,
  add constraint sponsors_category_check
    check (category = any (array['bronzo'::text, 'argento'::text, 'oro'::text, 'platino'::text]));

update public.sponsors
set category = case
  when category = 'silver' then 'argento'
  when category = 'gold'   then 'oro'
  else category
end
where category in ('silver', 'gold');
