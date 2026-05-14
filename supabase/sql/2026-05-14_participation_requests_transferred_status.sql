alter table public.participation_requests
  drop constraint participation_requests_status_check;

alter table public.participation_requests
  add constraint participation_requests_status_check
  check (
    status = any (
      array[
        'nuova'::text,
        'in_gestione'::text,
        'contattata'::text,
        'archiviata'::text,
        'trasferita'::text
      ]
    )
  );
