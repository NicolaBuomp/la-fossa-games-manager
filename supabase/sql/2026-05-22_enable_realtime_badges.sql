-- Enable Supabase Realtime for badge-count tables.
-- Required for participation_requests and sponsors badge subscriptions in ShellComponent.
-- Without this, postgres_changes events are never broadcast to the client.

ALTER PUBLICATION supabase_realtime ADD TABLE participation_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE sponsors;
