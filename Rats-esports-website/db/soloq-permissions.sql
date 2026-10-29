-- Applied after soloq.sql: remove Supabase default grants before granting only required operations.
revoke all on public.soloq_admins from anon, authenticated;
grant select on public.soloq_admins to authenticated;
revoke all on public.soloq_players from anon, authenticated;
grant select on public.soloq_players to anon, authenticated;
grant insert, delete on public.soloq_players to authenticated;